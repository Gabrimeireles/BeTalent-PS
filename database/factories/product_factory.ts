import factory from '@adonisjs/lucid/factories'
import Product from '#models/product'

export const ProductFactory = factory
  .define(Product, async ({ faker }) => {
    return {
      name: faker.commerce.productName(),
      amount: faker.number.int({ min: 10, max: 5000 }),
    }
  })
  .build()
