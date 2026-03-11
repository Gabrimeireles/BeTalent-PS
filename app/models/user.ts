import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { BaseModel, beforeSave, column } from '@adonisjs/lucid/orm'
import { normalizeRole } from '#services/role_permissions'

export default class User extends compose(BaseModel, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeSave()
  static async normalizeUserRole(user: User) {
    if (user.$dirty.role || !user.role) {
      user.role = normalizeRole(user.role)
    }
  }

  get initials() {
    const [localPart] = this.email.split('@')
    return localPart.slice(0, 2).toUpperCase()
  }
}
