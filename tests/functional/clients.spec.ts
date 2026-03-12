import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ClientFactory } from '#database/factories/client_factory'
import { GatewayFactory } from '#database/factories/gateway_factory'
import { ProductFactory } from '#database/factories/product_factory'
import { createBearerToken } from './helpers.js'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'

test.group('Clients', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('blocks clients routes without bearer token', async ({ client }) => {
    const response = await client.get('/clients')
    response.assertStatus(401)
  })

  test('authenticated user can list clients', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    await ClientFactory.createMany(2)

    const response = await client
      .get('/clients')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('authenticated user can view a client with purchases', async ({ client, assert }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)
    const clientRecord = await ClientFactory.create()
    const gateway = await GatewayFactory.create()
    const product = await ProductFactory.merge({ amount: 1200 }).create()

    const transaction = await Transaction.create({
      clientId: clientRecord.id,
      gatewayId: gateway.id,
      externalId: 'txn_client_details_001',
      status: 'completed',
      amount: 1200,
      cardLastNumbers: '6063',
    })

    await TransactionProduct.create({
      transactionId: transaction.id,
      productId: product.id,
      quantity: 1,
    })

    const response = await client
      .get(`/clients/${clientRecord.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = await response.body()
    assert.equal(body.data.id, clientRecord.id)
  })

  test('authenticated user receives 404 when client is not found', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .get('/clients/99999')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})
