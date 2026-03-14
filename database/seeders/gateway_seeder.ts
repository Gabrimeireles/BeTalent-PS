import Gateway from '#models/gateway'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const gatewayMockHost = process.env.GATEWAY_MOCK_HOST?.trim() || 'localhost'
    const gateway1Port = process.env.GATEWAY1_PORT?.trim() || '3001'
    const gateway2Port = process.env.GATEWAY2_PORT?.trim() || '3002'

    const gateway1Url =
      process.env.GATEWAY1_BASE_URL?.trim() || `http://${gatewayMockHost}:${gateway1Port}`
    const gateway2Url =
      process.env.GATEWAY2_BASE_URL?.trim() || `http://${gatewayMockHost}:${gateway2Port}`

    await Gateway.updateOrCreate(
      { id: 1 },
      {
        name: 'Gateway 1',
        priority: 1,
        isActive: true,
        url: gateway1Url,
      }
    )

    await Gateway.updateOrCreate(
      { id: 2 },
      {
        name: 'Gateway 2',
        priority: 2,
        isActive: true,
        url: gateway2Url,
      }
    )
  }
}
