import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gateway from '#models/gateway'
import { UserFactory } from '#database/factories/user_factory'
import { createBearerToken } from './helpers.js'
import Transaction from '#models/transaction'

const runLive = process.env.GATEWAY_LIVE_TESTS === 'true'

async function assertGatewayMocksRunning() {
  try {
    await Promise.all([
      fetch('http://localhost:3001/login', { method: 'OPTIONS' }),
      fetch('http://localhost:3002/transacoes', { method: 'OPTIONS' }),
    ])
  } catch {
    throw new Error(
      'Gateway mocks are not reachable. Start them with: docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock'
    )
  }
}

test.group('Gateway Live Integration', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates transaction against real gateway mocks', async ({ client, assert }) => {
    if (!runLive) return
    await assertGatewayMocksRunning()

    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      { name: 'Gateway 1', priority: 1, isActive: true, url: 'http://localhost:3001' }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      { name: 'Gateway 2', priority: 2, isActive: true, url: 'http://localhost:3002' }
    )

    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .post('/transactions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        amount: 1000,
        name: 'live tester',
        email: 'live.tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
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

    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      { name: 'Gateway 1', priority: 1, isActive: true, url: 'http://localhost:3001' }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      { name: 'Gateway 2', priority: 2, isActive: true, url: 'http://localhost:3002' }
    )

    const finance = await UserFactory.merge({ role: 'FINANCE' }).create()
    const token = await createBearerToken(finance)

    const createResponse = await client
      .post('/transactions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        amount: 1000,
        name: 'refund tester',
        email: 'refund.tester@email.com',
        cardNumber: '5569000000006063',
        cvv: '010',
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
    assert.equal(transaction.status, 'failed')
  })
})
