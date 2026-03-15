import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import {
  GatewayServiceError,
  type GatewayChargePayload,
  type GatewayChargeResult,
  type PaymentGatewayDriver,
} from '#services/gateway/payment_gateway_driver'

export default class Gateway2Driver implements PaymentGatewayDriver {
  async charge(gateway: Gateway, payload: GatewayChargePayload): Promise<GatewayChargeResult> {
    const response = await fetch(`${this.getBaseUrl(gateway)}/transacoes`, {
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
    return {
      externalId: this.extractExternalId(body),
      status: 'completed',
    }
  }

  async refund(gateway: Gateway, transaction: Transaction) {
    const response = await fetch(`${this.getBaseUrl(gateway)}/transacoes/reembolso`, {
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
