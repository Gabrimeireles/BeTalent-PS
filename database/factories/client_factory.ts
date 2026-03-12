import factory from '@adonisjs/lucid/factories'
import Client from '#models/client'

export const ClientFactory = factory
  .define(Client, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
    }
  })
  .build()
