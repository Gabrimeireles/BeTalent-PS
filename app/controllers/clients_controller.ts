import Client from '#models/client'
import Product from '#models/product'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import type { HttpContext } from '@adonisjs/core/http'
import ClientTransformer from '#transformers/client_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'

export default class ClientsController {
  async index({ response }: HttpContext) {
    const clients = await Client.query().orderBy('id', 'asc')

    return response.ok({
      data: ClientTransformer.collection(clients),
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
          }
        })

      return TransactionTransformer.toClientPurchase({
        transaction,
        items,
      })
    })

    return response.ok({
      data: {
        ...ClientTransformer.toResponse(client),
        purchases,
      },
    })
  }
}
