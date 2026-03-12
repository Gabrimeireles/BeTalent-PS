import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'client_id' })
  declare clientId: number

  @column({ columnName: 'gateway_id' })
  declare gatewayId: number

  @column({ columnName: 'external_id' })
  declare externalId: string

  @column()
  declare status: 'pending' | 'completed' | 'failed'

  @column()
  declare amount: number

  @column({ columnName: 'card_last_numbers' })
  declare cardLastNumbers: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
