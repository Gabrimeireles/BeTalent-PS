import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { createBearerToken } from './helpers.js'

test.group('Auth', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('login returns bearer token and user payload', async ({ client, assert }) => {
    const loginToken = 'FEC9BB078BF338F464F96B48089EB498'
    await User.create({
      email: 'dev@betalent.tech',
      password: loginToken,
      role: 'ADMIN',
    })

    const response = await client.post('/login').json({
      email: 'dev@betalent.tech',
      token: loginToken,
    })

    response.assertStatus(200)
    const body = await response.body()
    assert.exists(body.token)
    assert.equal(body.tokenType, 'Bearer')
    assert.equal(body.user.email, 'dev@betalent.tech')
    assert.equal(body.user.role, 'ADMIN')
  })

  test('login fails with invalid credentials', async ({ client }) => {
    await User.create({
      email: 'dev@betalent.tech',
      password: 'ValidSecret123',
      role: 'ADMIN',
    })

    const response = await client.post('/login').json({
      email: 'dev@betalent.tech',
      token: 'WrongSecret123',
    })

    response.assertStatus(400)
  })

  test('authenticated user can access profile', async ({ client }) => {
    const user = await User.create({
      email: 'profile.user@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })
    const userToken = await createBearerToken(user)

    const response = await client
      .get('/account/profile')
      .header('Authorization', `Bearer ${userToken}`)

    response.assertStatus(200)
  })

  test('logout revokes current token', async ({ client }) => {
    const user = await User.create({
      email: 'logout.user@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })
    const userToken = await createBearerToken(user)

    const logoutResponse = await client
      .post('/logout')
      .header('Authorization', `Bearer ${userToken}`)
    logoutResponse.assertStatus(200)

    const profileResponse = await client
      .get('/account/profile')
      .header('Authorization', `Bearer ${userToken}`)
    profileResponse.assertStatus(401)
  })
})
