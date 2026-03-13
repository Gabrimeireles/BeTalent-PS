import User from '#models/user'
import { registerUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, response }: HttpContext) {
    const { email, password, role } = await request.validateUsing(registerUserValidator)

    const user = await User.create({ email, password, role })

    return response.created({
      data: UserTransformer.toResponse(user),
    })
  }
}
