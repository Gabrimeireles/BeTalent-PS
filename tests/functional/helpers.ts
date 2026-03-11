import User from '#models/user'

export async function createBearerToken(user: User) {
  const accessToken = await User.accessTokens.create(user)
  return accessToken.value!.release()
}
