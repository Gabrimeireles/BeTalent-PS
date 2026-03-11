import Gateway from '#models/gateway'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Gateway.updateOrCreate(
      { id: 1 },
      {
        name: 'Gateway 1',
        priority: 1,
        isActive: true,
        url: 'http://localhost:3001/',
      }
    )

    await Gateway.updateOrCreate(
      { id: 2 },
      {
        name: 'Gateway 2',
        priority: 1,
        isActive: true,
        url: 'http://localhost:3002/',
      }
    )
  }
}
