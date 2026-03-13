import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  static toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      initials: user.initials,
    }
  }

  static collection(users: User[]) {
    return users.map((user) => this.toResponse(user))
  }

  toObject() {
    return UserTransformer.toResponse(this.resource)
  }
}
