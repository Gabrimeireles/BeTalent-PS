import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import Product from '#models/product'
import Client from '#models/client'
import { createTransactionValidator } from '#validators/transaction'
import ClientService from '#services/client_service'
import GatewayService, { GatewayServiceError } from '#services/gateway_service'

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

    const client = await this.clientService.ensure({
      name: payload.name,
      email: payload.email,
    })

    let chargeResult: Awaited<ReturnType<GatewayService['charge']>>
    try {
      chargeResult = await this.gatewayService.charge(payload)
    } catch (error) {
      if (error instanceof GatewayServiceError) {
        return response.status(error.statusCode).json({ message: error.message })
      }

      return response.badGateway({ message: 'Gateway integration failed' })
    }

    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: chargeResult.gateway.id,
      externalId: chargeResult.externalId,
      status: chargeResult.status,
      amount: payload.amount,
      cardLastNumbers: payload.cardNumber.slice(-4),
    })

    const [serialized] = await this.serializeTransactions([transaction])
    return response.created({ data: serialized })
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
      await this.gatewayService.refund(transaction)
      transaction.status = 'failed'
      await transaction.save()
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
            subtotal: amount * item.quantity,
          }
        })

      const client = clientMap.get(transaction.clientId)
      const gateway = gatewayMap.get(transaction.gatewayId)

      return {
        id: transaction.id,
        externalId: transaction.externalId,
        status: transaction.status,
        amount: transaction.amount,
        cardLastNumbers: transaction.cardLastNumbers,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        client: client
          ? {
              id: client.id,
              name: client.name,
              email: client.email,
            }
          : null,
        gateway: gateway
          ? {
              id: gateway.id,
              name: gateway.name,
              priority: gateway.priority,
              isActive: gateway.isActive,
            }
          : null,
        items,
      }
    })
  }
}
