import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createBearerToken } from './helpers.js'
import { UserFactory } from '#database/factories/user_factory'

test.group('Auth', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('login returns bearer token and user payload', async ({ client, assert }) => {
    const loginToken = 'FEC9BB078BF338F464F96B48089EB498'
    const user = await UserFactory.merge({
      email: 'login.success@betalent.tech',
      password: loginToken,
      role: 'ADMIN',
    }).create()

    const response = await client.post('/login').json({
      email: user.email,
      token: loginToken,
    })

    response.assertStatus(200)
    const body = await response.body()
    assert.exists(body.token)
    assert.equal(body.tokenType, 'Bearer')
    assert.equal(body.user.email, user.email)
    assert.equal(body.user.role, 'ADMIN')
  })

  test('login fails with invalid credentials', async ({ client }) => {
    const user = await UserFactory.merge({
      email: 'login.fail@betalent.tech',
      password: 'ValidSecret123',
      role: 'ADMIN',
    }).create()

    const response = await client.post('/login').json({
      email: user.email,
      token: 'WrongSecret123',
    })

    response.assertStatus(400)
  })

  test('authenticated user can access profile', async ({ client }) => {
    const user = await UserFactory.merge({
      email: 'profile.user@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    }).create()
    const userToken = await createBearerToken(user)

    const response = await client
      .get('/account/profile')
      .header('Authorization', `Bearer ${userToken}`)

    response.assertStatus(200)
  })

  test('logout revokes current token', async ({ client }) => {
    const user = await UserFactory.merge({
      email: 'logout.user@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    }).create()
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
