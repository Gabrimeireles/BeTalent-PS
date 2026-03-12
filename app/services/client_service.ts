import Client from '#models/client'

type EnsureClientPayload = {
  name: string
  email: string
}

export default class ClientService {
  async ensure(payload: EnsureClientPayload) {
    const email = payload.email.trim().toLowerCase()
    const name = payload.name.trim()

    const existingClient = await Client.findBy('email', email)
    if (existingClient) {
      if (name.length > 0 && existingClient.name !== name) {
        existingClient.name = name
        await existingClient.save()
      }
      return existingClient
    }

    return Client.create({
      name,
      email,
    })
  }
}
