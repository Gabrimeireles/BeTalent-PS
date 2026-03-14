import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gateways'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.integer('priority').unsigned().notNullable().defaultTo(1)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.string('url').notNullable().unique()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT \`${this.tableName}_priority_check\` CHECK (\`priority\` >= 1)`
      )
      await db.rawQuery(
        `ALTER TABLE \`${this.tableName}\` ADD CONSTRAINT \`${this.tableName}_is_active_check\` CHECK (\`is_active\` IN (0, 1))`
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
