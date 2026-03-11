import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccessTokenController {
  async store({ request, response }: HttpContext) {
    const { email, token } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, token)
    const accessToken = await User.accessTokens.create(user)

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        initials: user.initials,
      },
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
