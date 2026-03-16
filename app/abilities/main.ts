/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import { Bouncer } from '@adonisjs/bouncer'
import { canManageProducts, canManageUsers, canRefund, isAdmin } from '#services/role_permissions'

/**
 * Delete the following ability to start from
 * scratch
 */
type RoleUser = {
  role: string
}

export const manageAll = Bouncer.ability((user: RoleUser | null) => {
  return isAdmin(user?.role)
})

export const manageUsers = Bouncer.ability((user: RoleUser | null) => {
  return canManageUsers(user?.role)
})

export const manageProducts = Bouncer.ability((user: RoleUser | null) => {
  return canManageProducts(user?.role)
})

export const refundProducts = Bouncer.ability((user: RoleUser | null) => {
  return canRefund(user?.role)
})
