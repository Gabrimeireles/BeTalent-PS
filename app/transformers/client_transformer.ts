import { BaseTransformer } from '@adonisjs/core/transformers'
import type Client from '#models/client'

export default class ClientTransformer extends BaseTransformer<Client> {
  static toResponse(client: Client) {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }
  }

  static collection(clients: Client[]) {
    return clients.map((client) => this.toResponse(client))
  }

  toObject() {
    return ClientTransformer.toResponse(this.resource)
  }
}
