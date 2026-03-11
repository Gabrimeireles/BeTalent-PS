import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { registerUserValidator, updateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ serialize, response }: HttpContext) {
    const users = await User.query().orderBy('id', 'asc')

    return response.ok(
      serialize({
        data: users.map((user) => UserTransformer.transform(user)),
      })
    )
  }

  async store({ request, serialize, response }: HttpContext) {
    const payload = await request.validateUsing(registerUserValidator)

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      role: payload.role,
    })

    return response.created(
      serialize({
        data: UserTransformer.transform(user),
      })
    )
  }

  async show({ params, serialize, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    return response.ok(
      serialize({
        data: UserTransformer.transform(user),
      })
    )
  }

  async update({ params, request, serialize, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    const payload = await request.validateUsing(updateUserValidator)

    if (payload.email && payload.email !== user.email) {
      const emailInUse = await User.query()
        .where('email', payload.email)
        .whereNot('id', user.id)
        .first()
      if (emailInUse) {
        return response.conflict({ message: 'Email already in use' })
      }
    }

    user.merge(payload)
    await user.save()

    return response.ok(
      serialize({
        data: UserTransformer.transform(user),
      })
    )
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    await user.delete()

    return response.ok({ message: 'User deleted successfully' })
  }
}
