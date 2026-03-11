import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize, response }: HttpContext) {
    return response.ok(
      serialize({
        data: UserTransformer.transform(auth.getUserOrFail()),
      })
    )
  }
}
