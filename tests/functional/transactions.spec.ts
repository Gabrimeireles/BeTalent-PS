import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { GatewayFactory } from '#database/factories/gateway_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { ProductFactory } from '#database/factories/product_factory'
import { createBearerToken } from './helpers.js'
import Transaction from '#models/transaction'
import Client from '#models/client'

test.group('Transactions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('allows public transaction creation without bearer token', async ({ client }) => {
    const product = await ProductFactory.merge({ quantity: 3 }).create()
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()

    const response = await client.post('/transactions').json({
      name: 'tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
      products: [{ productId: product.id, quantity: 1 }],
    })

    response.assertStatus(201)
  })

  test('validates payload when email is invalid', async ({ client, assert }) => {
    const product = await ProductFactory.merge({ quantity: 3 }).create()

    const response = await client
      .post('/transactions')
      .json({
        name: 'tester',
        email: 'invalid-email',
        cardNumber: '5569000000006063',
        cvv: '010',
        products: [{ productId: product.id, quantity: 1 }],
      })

    response.assertStatus(422)
    const body = (await response.body()) as any
    assert.isArray(body.errors)
    assert.isTrue(body.errors.length > 0)
  })

  test('creates a transaction from payment payload', async ({ client, assert }) => {
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()
    const productA = await ProductFactory.merge({ amount: 1000, quantity: 3 }).create()
    const productB = await ProductFactory.merge({ amount: 500, quantity: 2 }).create()

    const response = await client
      .post('/transactions')
      .json({
        name: 'tester',
        email: 'tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
        products: [
          { productId: productA.id, quantity: 2 },
          { productId: productB.id, quantity: 1 },
        ],
      })

    response.assertStatus(201)

    const createdClient = await Client.findBy('email', 'tester@email.com')
    assert.exists(createdClient)

    const createdTransaction = await Transaction.query().orderBy('id', 'desc').first()
    assert.exists(createdTransaction)
    assert.equal(createdTransaction?.amount, 2500)
    assert.equal(createdTransaction?.cardLastNumbers, '6063')
    await productA.refresh()
    await productB.refresh()
    assert.equal(productA.quantity, 1)
    assert.equal(productB.quantity, 1)

    const body = (await response.body()) as {
      data: any
    }
    assert.properties(body.data, [
      'id',
      'externalId',
      'status',
      'amount',
      'cardLastNumbers',
      'createdAt',
      'updatedAt',
      'client',
      'gateway',
      'items',
    ])
    assert.equal(body.data.amount, 2500)
    assert.equal(body.data.status, 'completed')
    assert.properties(body.data.client, ['id', 'name', 'email'])
    assert.properties(body.data.gateway, ['id', 'name', 'priority', 'isActive'])
    assert.equal(body.data.items.length, 2)
    assert.properties(body.data.items[0], ['productId', 'name', 'amount', 'quantity', 'subtotal'])
  })

  test('validates cvv with 3 numeric chars', async ({ client, assert }) => {
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()
    const product = await ProductFactory.merge({ quantity: 3 }).create()

    const response = await client
      .post('/transactions')
      .json({
        name: 'tester',
        email: 'tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '10',
        products: [{ productId: product.id, quantity: 1 }],
      })

    response.assertStatus(422)
    const body = (await response.body()) as any
    assert.isArray(body.errors)
    assert.isTrue(body.errors.length > 0)
  })

  test('authenticated user can list transactions', async ({ client, assert }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    await TransactionFactory.createMany(2)

    const response = await client
      .get('/transactions')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = (await response.body()) as any
    assert.isArray(body.data)
    assert.isTrue(body.data.length >= 2)
    assert.properties(body.data[0], [
      'id',
      'externalId',
      'status',
      'amount',
      'cardLastNumbers',
      'createdAt',
      'updatedAt',
      'client',
      'gateway',
      'items',
    ])
  })

  test('authenticated user can get transaction details', async ({ client, assert }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    const transaction = await TransactionFactory.create()

    const response = await client
      .get(`/transactions/${transaction.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = (await response.body()) as any
    assert.equal(body.data.id, transaction.id)
    assert.properties(body.data, [
      'id',
      'externalId',
      'status',
      'amount',
      'cardLastNumbers',
      'createdAt',
      'updatedAt',
      'client',
      'gateway',
      'items',
    ])
  })

  test('finance can refund a completed transaction', async ({ client, assert }) => {
    const finance = await UserFactory.merge({ role: 'FINANCE' }).create()
    const token = await createBearerToken(finance)
    const transaction = await TransactionFactory.merge({ status: 'completed' }).create()

    const response = await client
      .post(`/transactions/${transaction.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = (await response.body()) as any
    assert.equal(body.message, 'Transaction refunded successfully')
    assert.equal(body.data.status, 'refunded')
    await transaction.refresh()
    assert.equal(transaction.status, 'refunded')
  })

  test('rejects transaction when requested quantity exceeds available stock', async ({
    client,
    assert,
  }) => {
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()
    const product = await ProductFactory.merge({ amount: 1000, quantity: 1 }).create()

    const response = await client.post('/transactions').json({
      name: 'tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
      products: [{ productId: product.id, quantity: 2 }],
    })

    response.assertStatus(422)
    const body = (await response.body()) as any
    assert.equal(
      body.message,
      `Insufficient stock for product ${product.id}: requested 2, available 1`
    )
    await product.refresh()
    assert.equal(product.quantity, 1)
  })

  test('manager cannot refund a transaction', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)
    const transaction = await TransactionFactory.merge({ status: 'completed' }).create()

    const response = await client
      .post(`/transactions/${transaction.id}/refund`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'You do not have permission to perform this action',
    })
  })
})
