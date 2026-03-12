import factory from '@adonisjs/lucid/factories'
import Transaction from '#models/transaction'
import db from '@adonisjs/lucid/services/db'

export const TransactionFactory = factory
  .define(Transaction, async ({ faker }) => {
    const cardNumber = faker.finance.creditCardNumber('################')
    return {
      clientId: 0,
      gatewayId: 0,
      externalId: `txn_${faker.string.alphanumeric(24).toLowerCase()}`,
      status: 'pending',
      amount: 0,
      cardLastNumbers: cardNumber.slice(-4),
    }
  })
  .before('create', async (_builder, transaction, ctx) => {
    const dbClient = ctx.$trx || db

    const [clientId] = await dbClient.table('clients').insert({
      name: ctx.faker.person.fullName(),
      email: ctx.faker.internet.email().toLowerCase(),
      created_at: new Date(),
      updated_at: new Date(),
    })

    const gatewayName = `${ctx.faker.company.name()}-${ctx.faker.string.alphanumeric(6)}`
    const [gatewayId] = await dbClient.table('gateways').insert({
      name: gatewayName,
      priority: 1,
      is_active: true,
      url: `https://${gatewayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.local`,
      created_at: new Date(),
      updated_at: new Date(),
    })

    transaction.clientId = Number(clientId)
    transaction.gatewayId = Number(gatewayId)
  })
  .after('create', async (_builder, transaction, ctx) => {
    const dbClient = ctx.$trx || db

    let totalAmount = 0
    const productsToCreate = ctx.faker.number.int({ min: 1, max: 3 })
    for (let index = 0; index < productsToCreate; index++) {
      const price = ctx.faker.number.int({ min: 10, max: 5000 })
      const quantity = ctx.faker.number.int({ min: 1, max: 3 })
      totalAmount += price * quantity

      const [productId] = await dbClient.table('products').insert({
        name: ctx.faker.commerce.productName(),
        amount: price,
        created_at: new Date(),
        updated_at: new Date(),
      })

      await dbClient.table('transaction_products').insert({
        transaction_id: transaction.id,
        product_id: Number(productId),
        quantity,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    transaction.amount = totalAmount
    if (ctx.$trx) {
      await transaction.useTransaction(ctx.$trx).save()
    } else {
      await transaction.save()
    }
  })
  .build()
