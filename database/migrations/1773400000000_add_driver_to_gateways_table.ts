import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gateways'

  async up() {
    const hasDriverColumn = await this.schema.hasColumn(this.tableName, 'driver')
    if (hasDriverColumn) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.string('driver').notNullable().defaultTo('gateway_1').after('is_active')
    })
  }

  async down() {
    const hasDriverColumn = await this.schema.hasColumn(this.tableName, 'driver')
    if (!hasDriverColumn) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('driver')
    })
  }
}
