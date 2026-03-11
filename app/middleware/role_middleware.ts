import { normalizeRole, type UserRole } from '#services/role_permissions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type RoleOptions = {
  roles: UserRole[]
}

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: RoleOptions) {
    const user = ctx.auth.getUserOrFail()
    const currentRole = normalizeRole(user.role)

    if (!options.roles.includes(currentRole)) {
      return ctx.response.forbidden({
        message: 'You do not have permission to perform this action',
      })
    }

    return next()
  }
}
