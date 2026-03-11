import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

export async function createBearerToken(user: User) {
  const accessToken = await User.accessTokens.create(user)
  return accessToken.value!.release()
}

export async function createGatewayRecord(name: string, priority = 1, isActive = true) {
  const [id] = await db.table('gateways').insert({
    name,
    URL: `https://${name.toLowerCase().replace(/\s+/g, '-')}.local`,
    priority,
    is_active: isActive,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return Number(id)
}
