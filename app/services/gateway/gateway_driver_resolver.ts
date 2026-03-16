import type Gateway from '#models/gateway'
import Gateway1Driver from '#services/gateway/drivers/gateway_1_driver'
import Gateway2Driver from '#services/gateway/drivers/gateway_2_driver'
import {
  GatewayServiceError,
  type PaymentGatewayDriver,
} from '#services/gateway/payment_gateway_driver'

export default class GatewayDriverResolver {
  private readonly drivers: Record<string, PaymentGatewayDriver> = {
    gateway_1: new Gateway1Driver(),
    gateway_2: new Gateway2Driver(),
  }

  resolve(gateway: Gateway) {
    const driver = this.drivers[gateway.driver]
    if (!driver) {
      throw new GatewayServiceError(`Unsupported gateway driver "${gateway.driver}"`, 400)
    }

    return driver
  }
}
