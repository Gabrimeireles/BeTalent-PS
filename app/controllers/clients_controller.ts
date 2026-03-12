import Client from '#models/client'
import Product from '#models/product'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import type { HttpContext } from '@adonisjs/core/http'

export default class ClientsController {
  async index({ response }: HttpContext) {
    const clients = await Client.query().orderBy('id', 'asc')

    return response.ok({
      data: clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      })),
    })
  }

  async show({ params, response }: HttpContext) {
    const client = await Client.find(params.id)

    if (!client) {
      return response.notFound({ message: 'Client not found' })
    }

    const transactions = await Transaction.query()
      .where('clientId', client.id)
      .orderBy('id', 'desc')

    const transactionIds = transactions.map((transaction) => transaction.id)
    const transactionProducts = transactionIds.length
      ? await TransactionProduct.query().whereIn('transactionId', transactionIds)
      : []
    const productIds = [...new Set(transactionProducts.map((item) => item.productId))]
    const products = productIds.length ? await Product.query().whereIn('id', productIds) : []
    const productsMap = new Map(products.map((product) => [product.id, product]))

    const purchases = transactions.map((transaction) => {
      const items = transactionProducts
        .filter((item) => item.transactionId === transaction.id)
        .map((item) => {
          const product = productsMap.get(item.productId)
          const amount = product?.amount ?? 0

          return {
            productId: item.productId,
            name: product?.name ?? null,
            amount,
            quantity: item.quantity,
            subtotal: amount * item.quantity,
          }
        })

      return {
        id: transaction.id,
        externalId: transaction.externalId,
        gatewayId: transaction.gatewayId,
        status: transaction.status,
        amount: transaction.amount,
        cardLastNumbers: transaction.cardLastNumbers,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        items,
      }
    })

    return response.ok({
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        purchases,
      },
    })
  }
}
