import Gateway from '#models/gateway'
import Transaction from '#models/transaction'

type CreateChargePayload = {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

type ChargeResult = {
  gateway: Gateway
  externalId: string
  status: 'completed' | 'pending' | 'failed'
}

export class GatewayServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
  }
}

export default class GatewayService {
  private gateway1Token: string | null = null

  private isLiveGatewayTestEnabled() {
    return (
      process.env.NODE_ENV === 'test' &&
      process.env.GATEWAY_LIVE_TESTS === 'true' &&
      Boolean(process.env.GATEWAY_MOCK_HOST?.trim())
    )
  }

  async charge(payload: CreateChargePayload): Promise<ChargeResult> {
    const gateways = await this.getActiveGatewaysByPriority()
    if (!gateways.length) {
      throw new GatewayServiceError('No active gateway available', 400)
    }

    const isTestEnvironment = process.env.NODE_ENV === 'test' && !this.isLiveGatewayTestEnabled()

    let fallbackError: Error | null = null
    for (const gateway of gateways) {
      try {
        if (isTestEnvironment) {
          return {
            gateway,
            externalId: crypto.randomUUID(),
            status: 'completed',
          }
        }

        const response = await this.chargeByGateway(gateway, payload)
        return {
          gateway,
          externalId: response.externalId,
          status: 'completed',
        }
      } catch (error) {
        if (error instanceof GatewayServiceError) {
          if (error.statusCode >= 500) {
            fallbackError = error
            continue
          }
          throw error
        }

        fallbackError = error as Error
      }
    }

    throw fallbackError ?? new GatewayServiceError('Gateway integration failed', 502)
  }

  async refund(transaction: Transaction) {
    const gateway = await Gateway.find(transaction.gatewayId)
    if (!gateway) {
      throw new GatewayServiceError('Gateway not found for transaction', 404)
    }

    if (process.env.NODE_ENV === 'test' && !this.isLiveGatewayTestEnabled()) {
      return
    }

    if (this.isGateway1(gateway)) {
      const bearerToken = await this.getGateway1BearerToken(gateway)
      const response = await fetch(
        `${this.getGatewayBaseUrl(gateway)}/transactions/${transaction.externalId}/charge_back`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new GatewayServiceError('Gateway chargeback failed', response.status)
      }
      return
    }

    if (this.isGateway2(gateway)) {
      const response = await fetch(`${this.getGatewayBaseUrl(gateway)}/transacoes/reembolso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Gateway-Auth-Token': process.env.GATEWAY2_AUTH_TOKEN ?? 'tk_f2198cc671b5289fa856',
          'Gateway-Auth-Secret':
            process.env.GATEWAY2_AUTH_SECRET ?? '3d15e8ed6131446ea7e3456728b1211f',
        },
        body: JSON.stringify({
          id: transaction.externalId,
        }),
      })

      if (!response.ok) {
        throw new GatewayServiceError('Gateway refund failed', response.status)
      }
      return
    }

    throw new GatewayServiceError(`Unsupported gateway "${gateway.name}"`, 400)
  }

  private async getActiveGatewaysByPriority() {
    return Gateway.query()
      .where('isActive', true)
      .where('priority', '>=', 1)
      .whereNotNull('url')
      .orderBy('priority', 'asc')
      .orderBy('id', 'asc')
  }

  private async chargeByGateway(gateway: Gateway, payload: CreateChargePayload) {
    if (this.isGateway1(gateway)) {
      const bearerToken = await this.getGateway1BearerToken(gateway)
      const response = await fetch(`${this.getGatewayBaseUrl(gateway)}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payload.amount,
          name: payload.name,
          email: payload.email,
          cardNumber: payload.cardNumber,
          cvv: payload.cvv,
        }),
      })

      if (!response.ok) {
        throw new GatewayServiceError(await this.readGatewayError(response), response.status)
      }

      const body = (await response.json()) as Record<string, unknown>
      const externalId = this.extractExternalId(body)

      return { externalId }
    }

    if (this.isGateway2(gateway)) {
      const response = await fetch(`${this.getGatewayBaseUrl(gateway)}/transacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Gateway-Auth-Token': process.env.GATEWAY2_AUTH_TOKEN ?? 'tk_f2198cc671b5289fa856',
          'Gateway-Auth-Secret':
            process.env.GATEWAY2_AUTH_SECRET ?? '3d15e8ed6131446ea7e3456728b1211f',
        },
        body: JSON.stringify({
          valor: payload.amount,
          nome: payload.name,
          email: payload.email,
          numeroCartao: payload.cardNumber,
          cvv: payload.cvv,
        }),
      })

      if (!response.ok) {
        throw new GatewayServiceError(await this.readGatewayError(response), response.status)
      }

      const body = (await response.json()) as Record<string, unknown>
      const externalId = this.extractExternalId(body)

      return { externalId }
    }

    throw new GatewayServiceError(`Unsupported gateway "${gateway.name}"`, 400)
  }

  private async getGateway1BearerToken(gateway: Gateway) {
    if (this.gateway1Token) {
      return this.gateway1Token
    }

    const response = await fetch(`${this.getGatewayBaseUrl(gateway)}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.GATEWAY1_LOGIN_EMAIL ?? 'dev@betalent.tech',
        token: process.env.GATEWAY1_LOGIN_TOKEN ?? 'FEC9BB078BF338F464F96B48089EB498',
      }),
    })

    if (!response.ok) {
      throw new GatewayServiceError('Gateway 1 authentication failed', response.status)
    }

    const body = (await response.json()) as Record<string, unknown>
    const token = this.extractToken(body)
    this.gateway1Token = token
    return token
  }

  private extractToken(body: Record<string, unknown>) {
    const token = body.token ?? body.accessToken ?? body.access_token
    if (typeof token !== 'string' || !token) {
      throw new GatewayServiceError('Gateway 1 token not found in response', 502)
    }
    return token
  }

  private extractExternalId(body: Record<string, unknown>) {
    const candidates = [body.id, body.externalId, body.external_id]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate
      }
    }

    // Some mocks wrap data in nested objects
    const data = body.data as Record<string, unknown> | undefined
    if (data) {
      const nestedId = data.id ?? data.externalId ?? data.external_id
      if (typeof nestedId === 'string' && nestedId.length > 0) {
        return nestedId
      }
    }

    throw new GatewayServiceError('Gateway response does not include transaction id', 502)
  }

  private async readGatewayError(response: Response) {
    try {
      const body = (await response.json()) as Record<string, unknown>
      const message = body.message ?? body.error
      return typeof message === 'string' && message ? message : 'Gateway request failed'
    } catch {
      return 'Gateway request failed'
    }
  }

  private isGateway1(gateway: Gateway) {
    const gatewayName = gateway.name?.toLowerCase() ?? ''
    const gatewayUrl = gateway.url ?? ''
    return gatewayName.includes('gateway 1') || gatewayUrl.includes(':3001')
  }

  private isGateway2(gateway: Gateway) {
    const gatewayName = gateway.name?.toLowerCase() ?? ''
    const gatewayUrl = gateway.url ?? ''
    return gatewayName.includes('gateway 2') || gatewayUrl.includes(':3002')
  }

  private getGatewayBaseUrl(gateway: Gateway) {
    const configuredUrl = gateway.url?.trim()
    if (configuredUrl) {
      return this.normalizeUrl(configuredUrl)
    }

    if (this.isGateway1(gateway)) {
      return this.normalizeUrl(process.env.GATEWAY1_BASE_URL ?? 'http://localhost:3001')
    }

    if (this.isGateway2(gateway)) {
      return this.normalizeUrl(process.env.GATEWAY2_BASE_URL ?? 'http://localhost:3002')
    }

    return ''
  }

  private normalizeUrl(url: string | null | undefined) {
    const safeUrl = url ?? ''
    return safeUrl.endsWith('/') ? safeUrl.slice(0, -1) : safeUrl
  }
}
