import factory from '@adonisjs/lucid/factories'
import Gateway from '#models/gateway'

export const GatewayFactory = factory
  .define(Gateway, async ({ faker }) => {
    const name = `${faker.company.name()}-${faker.string.alphanumeric(6)}`
    return {
      name,
      priority: 1,
      isActive: true,
      url: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.local`,
    }
  })
  .build()
