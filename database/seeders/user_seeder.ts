import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'dev@betalent.tech' },
      {
        password: 'FEC9BB078BF338F464F96B48089EB498',
        role: 'ADMIN',
      }
    )
  }
}
