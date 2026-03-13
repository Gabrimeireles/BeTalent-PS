import { BaseTransformer } from '@adonisjs/core/transformers'
import type Transaction from '#models/transaction'
import type Client from '#models/client'
import type Gateway from '#models/gateway'

type TransactionItemInput = {
  productId: number
  name: string | null
  amount: number
  quantity: number
}

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  static toItemResponse(item: TransactionItemInput) {
    return {
      productId: item.productId,
      name: item.name,
      amount: item.amount,
      quantity: item.quantity,
      subtotal: item.amount * item.quantity,
    }
  }

  static toResponse({
    transaction,
    client,
    gateway,
    items,
  }: {
    transaction: Transaction
    client?: Client | null
    gateway?: Gateway | null
    items?: TransactionItemInput[]
  }) {
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
      items: (items ?? []).map((item) => this.toItemResponse(item)),
    }
  }

  static toClientPurchase({
    transaction,
    items,
  }: {
    transaction: Transaction
    items?: TransactionItemInput[]
  }) {
    return {
      id: transaction.id,
      externalId: transaction.externalId,
      gatewayId: transaction.gatewayId,
      status: transaction.status,
      amount: transaction.amount,
      cardLastNumbers: transaction.cardLastNumbers,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      items: (items ?? []).map((item) => this.toItemResponse(item)),
    }
  }

  toObject() {
    return TransactionTransformer.toResponse({
      transaction: this.resource,
    })
  }
}
