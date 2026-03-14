import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gateway from '#models/gateway'
import { UserFactory } from '#database/factories/user_factory'
import Transaction from '#models/transaction'
import Product from '#models/product'
import { createBearerToken } from './helpers.js'

const runLive = process.env.GATEWAY_LIVE_TESTS === 'true'

async function assertGatewayMocksRunning() {
  const gatewayMockHost = process.env.GATEWAY_MOCK_HOST?.trim() || 'localhost'
  const gateway1Port = process.env.GATEWAY1_PORT?.trim() || '3001'
  const gateway2Port = process.env.GATEWAY2_PORT?.trim() || '3002'

  try {
    await Promise.all([
      fetch(`http://${gatewayMockHost}:${gateway1Port}/login`, { method: 'OPTIONS' }),
      fetch(`http://${gatewayMockHost}:${gateway2Port}/transacoes`, { method: 'OPTIONS' }),
    ])
  } catch {
    throw new Error(
      'Gateway mocks are not reachable. Start them with: docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock and configure GATEWAY_MOCK_HOST'
    )
  }
}

test.group('Gateway Live Integration', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates transaction against real gateway mocks', async ({ client, assert }) => {
    if (!runLive) return
    await assertGatewayMocksRunning()
    const gatewayMockHost = process.env.GATEWAY_MOCK_HOST?.trim() || 'localhost'
    const gateway1Port = process.env.GATEWAY1_PORT?.trim() || '3001'
    const gateway2Port = process.env.GATEWAY2_PORT?.trim() || '3002'

    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      {
        name: 'Gateway 1',
        priority: 1,
        isActive: true,
        url: `http://${gatewayMockHost}:${gateway1Port}`,
      }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      {
        name: 'Gateway 2',
        priority: 2,
        isActive: true,
        url: `http://${gatewayMockHost}:${gateway2Port}`,
      }
    )

    const product = await Product.create({ name: 'Live Product', amount: 1000, quantity: 5 })

    const response = await client
      .post('/transactions')
      .json({
        name: 'live tester',
        email: 'live.tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
        products: [{ productId: product.id, quantity: 1 }],
      })

    response.assertStatus(201)
    const body = (await response.body()) as {
      data: { id: number; externalId: string; status: string }
    }
    assert.exists(body.data.externalId)
    assert.equal(body.data.status, 'completed')
  })

  test('refunds transaction against real gateway mocks', async ({ client, assert }) => {
    if (!runLive) return
    await assertGatewayMocksRunning()
    const gatewayMockHost = process.env.GATEWAY_MOCK_HOST?.trim() || 'localhost'
    const gateway1Port = process.env.GATEWAY1_PORT?.trim() || '3001'
    const gateway2Port = process.env.GATEWAY2_PORT?.trim() || '3002'

    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      {
        name: 'Gateway 1',
        priority: 1,
        isActive: true,
        url: `http://${gatewayMockHost}:${gateway1Port}`,
      }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      {
        name: 'Gateway 2',
        priority: 2,
        isActive: true,
        url: `http://${gatewayMockHost}:${gateway2Port}`,
      }
    )

    const finance = await UserFactory.merge({ role: 'FINANCE' }).create()
    const token = await createBearerToken(finance)
    const product = await Product.create({ name: 'Refund Product', amount: 1000, quantity: 5 })

    const createResponse = await client
      .post('/transactions')
      .json({
        name: 'refund tester',
        email: 'refund.tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
        products: [{ productId: product.id, quantity: 1 }],
      })

    createResponse.assertStatus(201)
    const createdBody = (await createResponse.body()) as {
      data: { id: number }
    }
    const transactionId = createdBody.data.id as number

    const refundResponse = await client
      .post(`/transactions/${transactionId}/refund`)
      .header('Authorization', `Bearer ${token}`)

    refundResponse.assertStatus(200)

    const transaction = await Transaction.findOrFail(transactionId)
    assert.equal(transaction.status, 'refunded')
  })
})
