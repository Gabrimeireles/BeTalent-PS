import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { beforeSave } from '@adonisjs/lucid/orm'
import { normalizeRole } from '#services/role_permissions'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

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
