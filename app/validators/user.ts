import vine from '@vinejs/vine'
import { ROLES } from '#services/role_permissions'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)
const role = () => vine.enum(ROLES)

/**
 * Validator to use when creating users by ADMIN/MANAGER
 */
export const registerUserValidator = vine.create({
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  role: role(),
})

/**
 * Validator to use when updating users by ADMIN/MANAGER
 */
export const updateUserValidator = vine.create({
  email: email().optional(),
  password: password().optional(),
  role: role().optional(),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  token: vine.string().minLength(8).maxLength(64),
})
