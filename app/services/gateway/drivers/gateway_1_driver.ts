import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import {
  GatewayServiceError,
  type GatewayChargePayload,
  type GatewayChargeResult,
  type PaymentGatewayDriver,
} from '#services/gateway/payment_gateway_driver'

export default class Gateway1Driver implements PaymentGatewayDriver {
  private static tokenCache = new Map<number, string>()

  async charge(gateway: Gateway, payload: GatewayChargePayload): Promise<GatewayChargeResult> {
    const bearerToken = await this.getBearerToken(gateway)
    const response = await fetch(`${this.getBaseUrl(gateway)}/transactions`, {
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
    return {
      externalId: this.extractExternalId(body),
      status: 'completed',
    }
  }

  async refund(gateway: Gateway, transaction: Transaction) {
    const bearerToken = await this.getBearerToken(gateway)
    const response = await fetch(
      `${this.getBaseUrl(gateway)}/transactions/${transaction.externalId}/charge_back`,
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
  }

  private async getBearerToken(gateway: Gateway) {
    const cachedToken = Gateway1Driver.tokenCache.get(gateway.id)
    if (cachedToken) {
      return cachedToken
    }

    const response = await fetch(`${this.getBaseUrl(gateway)}/login`, {
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
    Gateway1Driver.tokenCache.set(gateway.id, token)
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

  private getBaseUrl(gateway: Gateway) {
    const safeUrl = gateway.url?.trim() ?? ''
    return safeUrl.endsWith('/') ? safeUrl.slice(0, -1) : safeUrl
  }
}
