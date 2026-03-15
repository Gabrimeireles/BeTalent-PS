import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import Client from '#models/client'
import GatewayService from '#services/gateway/gateway_service'

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

test.group('GatewayService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  group.each.setup(() => {
    const originalEnv = process.env.NODE_ENV
    const originalFetch = global.fetch

    process.env.NODE_ENV = 'development'

    return () => {
      process.env.NODE_ENV = originalEnv
      global.fetch = originalFetch
    }
  })

  async function deactivateExistingGateways() {
    await Gateway.query().update({ isActive: false })
  }

  test('charges using highest priority active gateway (gateway 1)', async ({ assert }) => {
    await deactivateExistingGateways()
    const gateway1BaseUrl = `http://g1-${crypto.randomUUID()}.local:3001`
    const gateway2BaseUrl = `http://g2-${crypto.randomUUID()}.local:3002`

    const gateway1 = await Gateway.create({
      name: `Gateway 1 Unit ${crypto.randomUUID()}`,
      priority: 1,
      isActive: true,
      driver: 'gateway_1',
      url: gateway1BaseUrl,
    })

    await Gateway.create({
      name: `Gateway 2 Unit ${crypto.randomUUID()}`,
      priority: 2,
      isActive: true,
      driver: 'gateway_2',
      url: gateway2BaseUrl,
    })

    const calls: Array<{ url: string; init?: RequestInit }> = []
    const mockedFetch: FetchMock = async (input, init) => {
      const url = input.toString()
      calls.push({ url, init })

      if (url.endsWith('/login')) {
        return jsonResponse({ token: 'gateway-1-token' })
      }

      if (url.endsWith('/transactions')) {
        return jsonResponse({ id: 'ext-g1-001' }, 201)
      }

      return jsonResponse({ message: 'Unexpected URL' }, 500)
    }

    global.fetch = mockedFetch
    const service = new GatewayService()

    const result = await service.charge({
      amount: 1000,
      name: 'Tester',
      email: 'tester@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    assert.equal(result.gateway.id, gateway1.id)
    assert.equal(result.externalId, 'ext-g1-001')
    assert.equal(calls.length, 2)
    assert.equal(calls[0]?.url, `${gateway1BaseUrl}/login`)
    assert.equal(calls[1]?.url, `${gateway1BaseUrl}/transactions`)
  })

  test('falls back to next gateway on technical failure', async ({ assert }) => {
    await deactivateExistingGateways()
    const gateway1BaseUrl = `http://g1-${crypto.randomUUID()}.local:3001`
    const gateway2BaseUrl = `http://g2-${crypto.randomUUID()}.local:3002`

    await Gateway.create({
      name: `Gateway 1 Unit ${crypto.randomUUID()}`,
      priority: 1,
      isActive: true,
      driver: 'gateway_1',
      url: gateway1BaseUrl,
    })

    const gateway2 = await Gateway.create({
      name: `Gateway 2 Unit ${crypto.randomUUID()}`,
      priority: 2,
      isActive: true,
      driver: 'gateway_2',
      url: gateway2BaseUrl,
    })

    const calls: string[] = []
    const mockedFetch: FetchMock = async (input) => {
      const url = input.toString()
      calls.push(url)

      if (url.endsWith('/login')) {
        return jsonResponse({ token: 'gateway-1-token' })
      }

      if (url.endsWith('/transactions')) {
        return jsonResponse({ message: 'temporary outage' }, 500)
      }

      if (url.endsWith('/transacoes')) {
        return jsonResponse({ id: 'ext-g2-001' }, 201)
      }

      return jsonResponse({ message: 'Unexpected URL' }, 500)
    }

    global.fetch = mockedFetch
    const service = new GatewayService()

    const result = await service.charge({
      amount: 2000,
      name: 'Tester 2',
      email: 'tester2@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    assert.equal(result.gateway.id, gateway2.id)
    assert.equal(result.externalId, 'ext-g2-001')
    assert.deepEqual(calls, [
      `${gateway1BaseUrl}/login`,
      `${gateway1BaseUrl}/transactions`,
      `${gateway2BaseUrl}/transacoes`,
    ])
  })

  test('ignores inactive gateways even when they have higher priority', async ({ assert }) => {
    await deactivateExistingGateways()
    const inactiveGatewayBaseUrl = `http://g1-${crypto.randomUUID()}.local:3001`
    const activeGatewayBaseUrl = `http://g2-${crypto.randomUUID()}.local:3002`

    await Gateway.create({
      name: `Gateway Inactive ${crypto.randomUUID()}`,
      priority: 1,
      isActive: false,
      driver: 'gateway_1',
      url: inactiveGatewayBaseUrl,
    })

    const activeGateway = await Gateway.create({
      name: `Gateway 2 Active ${crypto.randomUUID()}`,
      priority: 2,
      isActive: true,
      driver: 'gateway_2',
      url: activeGatewayBaseUrl,
    })

    const calls: string[] = []
    const mockedFetch: FetchMock = async (input) => {
      const url = input.toString()
      calls.push(url)

      if (url.endsWith('/transacoes')) {
        return jsonResponse({ id: 'ext-g2-active-001' }, 201)
      }

      return jsonResponse({ message: 'Unexpected URL' }, 500)
    }

    global.fetch = mockedFetch
    const service = new GatewayService()

    const result = await service.charge({
      amount: 1500,
      name: 'Tester Active',
      email: 'tester.active@email.com',
      cardNumber: '5569000000006063',
      cvv: '010',
    })

    assert.equal(result.gateway.id, activeGateway.id)
    assert.equal(result.externalId, 'ext-g2-active-001')
    assert.deepEqual(calls, [`${activeGatewayBaseUrl}/transacoes`])
  })

  test('refunds gateway 1 transaction on charge_back endpoint', async ({ assert }) => {
    const gateway1BaseUrl = `http://g1-${crypto.randomUUID()}.local:3001`

    const gateway1 = await Gateway.create({
      name: `Gateway 1 Unit ${crypto.randomUUID()}`,
      priority: 1,
      isActive: true,
      driver: 'gateway_1',
      url: gateway1BaseUrl,
    })

    const client = await Client.create({
      name: 'Refund Client',
      email: 'refund.client@email.com',
    })

    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: gateway1.id,
      externalId: 'g1-ext-123',
      status: 'completed',
      amount: 1000,
      cardLastNumbers: '6063',
    })

    const calls: string[] = []
    const mockedFetch: FetchMock = async (input) => {
      const url = input.toString()
      calls.push(url)

      if (url.endsWith('/login')) {
        return jsonResponse({ token: 'gateway-1-token' })
      }

      if (url.endsWith('/transactions/g1-ext-123/charge_back')) {
        return jsonResponse({ ok: true }, 200)
      }

      return jsonResponse({ message: 'Unexpected URL' }, 500)
    }

    global.fetch = mockedFetch
    const service = new GatewayService()

    await service.refund(transaction)

    assert.deepEqual(calls, [
      `${gateway1BaseUrl}/login`,
      `${gateway1BaseUrl}/transactions/g1-ext-123/charge_back`,
    ])
  })

  test('refunds gateway 2 transaction on reembolso endpoint', async ({ assert }) => {
    const gateway2BaseUrl = `http://g2-${crypto.randomUUID()}.local:3002`

    const gateway2 = await Gateway.create({
      name: `Gateway 2 Unit ${crypto.randomUUID()}`,
      priority: 2,
      isActive: true,
      driver: 'gateway_2',
      url: gateway2BaseUrl,
    })

    const client = await Client.create({
      name: 'Refund Client 2',
      email: 'refund.client2@email.com',
    })

    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: gateway2.id,
      externalId: 'g2-ext-123',
      status: 'completed',
      amount: 1000,
      cardLastNumbers: '6063',
    })

    let requestBody: unknown = null
    const calls: string[] = []
    const mockedFetch: FetchMock = async (input, init) => {
      const url = input.toString()
      calls.push(url)

      if (url.endsWith('/transacoes/reembolso')) {
        requestBody = init?.body ? JSON.parse(init.body.toString()) : null
        return jsonResponse({ ok: true }, 200)
      }

      return jsonResponse({ message: 'Unexpected URL' }, 500)
    }

    global.fetch = mockedFetch
    const service = new GatewayService()

    await service.refund(transaction)

    assert.deepEqual(calls, [`${gateway2BaseUrl}/transacoes/reembolso`])
    assert.deepEqual(requestBody, { id: 'g2-ext-123' })
  })
})
