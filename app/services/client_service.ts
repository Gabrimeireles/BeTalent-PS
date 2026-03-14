import Client from '#models/client'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type EnsureClientPayload = {
  name: string
  email: string
}

export default class ClientService {
  async ensure(payload: EnsureClientPayload, trx?: TransactionClientContract) {
    const email = payload.email.trim().toLowerCase()
    const name = payload.name.trim()

    const existingClient = await Client.query({ client: trx }).where('email', email).first()
    if (existingClient) {
      if (name.length > 0 && existingClient.name !== name) {
        existingClient.name = name
        if (trx) {
          existingClient.useTransaction(trx)
        }
        await existingClient.save()
      }
      return existingClient
    }

    return Client.create(
      {
        name,
        email,
      },
      trx ? { client: trx } : undefined
    )
  }
}
