import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import Product from '#models/product'
import Client from '#models/client'
import db from '@adonisjs/lucid/services/db'
import { createTransactionValidator } from '#validators/transaction'
import ClientService from '#services/client_service'
import GatewayService, { GatewayServiceError } from '#services/gateway/gateway_service'
import TransactionTransformer from '#transformers/transaction_transformer'

export default class TransactionsController {
  private clientService = new ClientService()
  private gatewayService = new GatewayService()

  async index({ response }: HttpContext) {
    const transactions = await Transaction.query().orderBy('id', 'desc')

    return response.ok({
      data: await this.serializeTransactions(transactions),
    })
  }

  async show({ params, response }: HttpContext) {
    const transaction = await Transaction.find(params.id)

    if (!transaction) {
      return response.notFound({ message: 'Transaction not found' })
    }

    const [serialized] = await this.serializeTransactions([transaction])
    return response.ok({ data: serialized })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createTransactionValidator)

    const productIds = [...new Set(payload.products.map((item) => item.productId))]
    try {
      const transaction = await db.transaction(async (trx) => {
        const products = await Product.query({ client: trx }).whereIn('id', productIds).forUpdate()
        const productsMap = new Map(products.map((product) => [product.id, product]))

        const missingProductIds = productIds.filter((productId) => !productsMap.has(productId))
        if (missingProductIds.length > 0) {
          throw new GatewayServiceError(`Products not found: ${missingProductIds.join(', ')}`, 422)
        }

        const unavailableProducts = payload.products
          .map((item) => {
            const product = productsMap.get(item.productId)!
            return product.quantity < item.quantity
              ? {
                  productId: item.productId,
                  requested: item.quantity,
                  available: product.quantity,
                }
              : null
          })
          .filter((item) => item !== null)

        if (unavailableProducts.length > 0) {
          const details = unavailableProducts.map(
            (item) =>
              `product ${item.productId}: requested ${item.requested}, available ${item.available}`
          )

          throw new GatewayServiceError(`Insufficient stock for ${details.join('; ')}`, 422)
        }

        const amount = payload.products.reduce((total, item) => {
          const product = productsMap.get(item.productId)!
          return total + product.amount * item.quantity
        }, 0)

        const client = await this.clientService.ensure(
          {
            name: payload.name,
            email: payload.email,
          },
          trx
        )

        const chargeResult = await this.gatewayService.charge({
          amount,
          name: payload.name,
          email: payload.email,
          cardNumber: payload.cardNumber,
          cvv: payload.cvv,
        })

        for (const item of payload.products) {
          const product = productsMap.get(item.productId)!
          product.quantity -= item.quantity
          product.useTransaction(trx)
          await product.save()
        }

        const transaction = await Transaction.create(
          {
            clientId: client.id,
            gatewayId: chargeResult.gateway.id,
            externalId: chargeResult.externalId,
            status: chargeResult.status,
            amount,
            cardLastNumbers: payload.cardNumber.slice(-4),
          },
          { client: trx }
        )

        await TransactionProduct.createMany(
          payload.products.map((item) => ({
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
          { client: trx }
        )

        return transaction
      })

      const [serialized] = await this.serializeTransactions([transaction])
      return response.created({ data: serialized })
    } catch (error) {
      if (error instanceof GatewayServiceError) {
        return response.status(error.statusCode).json({ message: error.message })
      }

      return response.badGateway({ message: 'Gateway integration failed' })
    }
  }

  async refund({ params, response }: HttpContext) {
    const transaction = await Transaction.find(params.id)

    if (!transaction) {
      return response.notFound({ message: 'Transaction not found' })
    }

    if (transaction.status !== 'completed') {
      return response.conflict({ message: 'Only completed transactions can be refunded' })
    }

    try {
      await db.transaction(async (trx) => {
        await this.gatewayService.refund(transaction)

        const items = await TransactionProduct.query({ client: trx })
          .where('transactionId', transaction.id)
          .forUpdate()

        const productIds = [...new Set(items.map((item) => item.productId))]
        const products = productIds.length
          ? await Product.query({ client: trx }).whereIn('id', productIds).forUpdate()
          : []
        const productMap = new Map(products.map((product) => [product.id, product]))

        for (const item of items) {
          const product = productMap.get(item.productId)
          if (!product) {
            continue
          }

          product.quantity += item.quantity
          product.useTransaction(trx)
          await product.save()
        }

        transaction.status = 'refunded'
        transaction.useTransaction(trx)
        await transaction.save()
      })
    } catch (error) {
      if (error instanceof GatewayServiceError) {
        return response.status(error.statusCode).json({ message: error.message })
      }

      return response.badGateway({ message: 'Gateway integration failed' })
    }

    const [serialized] = await this.serializeTransactions([transaction])
    return response.ok({
      message: 'Transaction refunded successfully',
      data: serialized,
    })
  }

  private async serializeTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) {
      return []
    }

    const transactionIds = transactions.map((transaction) => transaction.id)
    const clientIds = [...new Set(transactions.map((transaction) => transaction.clientId))]
    const gatewayIds = [...new Set(transactions.map((transaction) => transaction.gatewayId))]

    const [clients, gateways, transactionProducts] = await Promise.all([
      Client.query().whereIn('id', clientIds),
      Gateway.query().whereIn('id', gatewayIds),
      TransactionProduct.query().whereIn('transactionId', transactionIds),
    ])

    const productIds = [...new Set(transactionProducts.map((item) => item.productId))]
    const products = productIds.length ? await Product.query().whereIn('id', productIds) : []

    const clientMap = new Map(clients.map((client) => [client.id, client]))
    const gatewayMap = new Map(gateways.map((gateway) => [gateway.id, gateway]))
    const productMap = new Map(products.map((product) => [product.id, product]))

    return transactions.map((transaction) => {
      const items = transactionProducts
        .filter((item) => item.transactionId === transaction.id)
        .map((item) => {
          const product = productMap.get(item.productId)
          const amount = product?.amount ?? 0

          return {
            productId: item.productId,
            name: product?.name ?? null,
            amount,
            quantity: item.quantity,
          }
        })

      const client = clientMap.get(transaction.clientId)
      const gateway = gatewayMap.get(transaction.gatewayId)

      return TransactionTransformer.toResponse({
        transaction,
        client,
        gateway,
        items,
      })
    })
  }
}
