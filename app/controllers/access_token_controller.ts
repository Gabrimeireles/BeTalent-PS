import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokenController {
  async store({ request, response }: HttpContext) {
    const { email, token } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, token)
    const accessToken = await User.accessTokens.create(user)

    return response.ok({
      user: UserTransformer.toResponse(user),
      token: accessToken.value?.release() ?? accessToken.toJSON().token,
      tokenType: 'Bearer',
    })
  }

  async destroy({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return response.ok({
      message: 'Logged out successfully',
    })
  }
}
