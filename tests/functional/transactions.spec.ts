import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { GatewayFactory } from '#database/factories/gateway_factory'
import { createBearerToken } from './helpers.js'
import Transaction from '#models/transaction'
import Client from '#models/client'

test.group('Transactions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('blocks transaction creation without bearer token', async ({ client }) => {
    const response = await client.post('/transactions').json({
      amount: 1000,
      name: 'tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    response.assertStatus(401)
  })

  test('validates payload when email is invalid', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .post('/transactions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        amount: 1000,
        name: 'tester',
        email: 'invalid-email',
        cardNumber: '5569000000006063',
        cvv: '010',
      })

    response.assertStatus(422)
  })

  test('creates a transaction from payment payload', async ({ client, assert }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()

    const response = await client
      .post('/transactions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        amount: 1000,
        name: 'tester',
        email: 'tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
      })

    response.assertStatus(201)

    const createdClient = await Client.findBy('email', 'tester@email.com')
    assert.exists(createdClient)

    const createdTransaction = await Transaction.query().orderBy('id', 'desc').first()
    assert.exists(createdTransaction)
    assert.equal(createdTransaction?.amount, 1000)
    assert.equal(createdTransaction?.cardLastNumbers, '6063')
  })

  test('validates cvv with 3 numeric chars', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    await GatewayFactory.merge({ priority: 1, isActive: true }).create()

    const response = await client
      .post('/transactions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        amount: 1000,
        name: 'tester',
        email: 'tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '10',
      })

    response.assertStatus(422)
  })
})
