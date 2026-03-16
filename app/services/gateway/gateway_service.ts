import Gateway from '#models/gateway'
import type Transaction from '#models/transaction'
import GatewayDriverResolver from '#services/gateway/gateway_driver_resolver'
import {
  GatewayServiceError,
  type GatewayChargePayload,
} from '#services/gateway/payment_gateway_driver'

type ChargeResult = {
  gateway: Gateway
  externalId: string
  status: 'completed' | 'pending' | 'failed'
}

export { GatewayServiceError }

export default class GatewayService {
  private readonly resolver = new GatewayDriverResolver()

  private isLiveGatewayTestEnabled() {
    return (
      process.env.NODE_ENV === 'test' &&
      process.env.GATEWAY_LIVE_TESTS === 'true' &&
      Boolean(process.env.GATEWAY_MOCK_HOST?.trim())
    )
  }

  async charge(payload: GatewayChargePayload): Promise<ChargeResult> {
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

        const driver = this.resolver.resolve(gateway)
        const response = await driver.charge(gateway, payload)

        return {
          gateway,
          externalId: response.externalId,
          status: response.status,
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

    const driver = this.resolver.resolve(gateway)
    await driver.refund(gateway, transaction)
  }

  private async getActiveGatewaysByPriority() {
    return Gateway.query()
      .where('isActive', true)
      .where('priority', '>=', 1)
      .whereNotNull('url')
      .whereNotNull('driver')
      .orderBy('priority', 'asc')
      .orderBy('id', 'asc')
  }
}
