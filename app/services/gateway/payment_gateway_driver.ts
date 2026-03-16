import type Gateway from '#models/gateway'
import type Transaction from '#models/transaction'

export type GatewayChargePayload = {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

export type GatewayChargeResult = {
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

export interface PaymentGatewayDriver {
  charge(gateway: Gateway, payload: GatewayChargePayload): Promise<GatewayChargeResult>
  refund(gateway: Gateway, transaction: Transaction): Promise<void>
}
