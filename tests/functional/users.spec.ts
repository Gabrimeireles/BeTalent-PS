import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { createBearerToken } from './helpers.js'

test.group('Users', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('users routes are blocked without bearer token', async ({ client }) => {
    const response = await client.get('/users')

    response.assertStatus(401)
  })

  test('manager can register users', async ({ client, assert }) => {
    const manager = await User.create({
      email: 'manager@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)

    const response = await client
      .post('/users/register')
      .header('Authorization', `Bearer ${managerToken}`)
      .json({
        email: 'new.user@betalent.tech',
        password: 'UserSecret123',
        passwordConfirmation: 'UserSecret123',
        role: 'USER',
      })

    response.assertStatus(201)
    const created = await User.findBy('email', 'new.user@betalent.tech')
    assert.exists(created)
    assert.equal(created?.role, 'USER')
  })

  test('regular user cannot register users', async ({ client }) => {
    const user = await User.create({
      email: 'user@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })
    const userToken = await createBearerToken(user)

    const response = await client
      .post('/users/register')
      .header('Authorization', `Bearer ${userToken}`)
      .json({
        email: 'blocked.user@betalent.tech',
        password: 'UserSecret123',
        passwordConfirmation: 'UserSecret123',
        role: 'USER',
      })

    response.assertStatus(403)
  })

  test('register validation fails with invalid role', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.validation@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)

    const response = await client
      .post('/users/register')
      .header('Authorization', `Bearer ${managerToken}`)
      .json({
        email: 'invalid.role@betalent.tech',
        password: 'UserSecret123',
        passwordConfirmation: 'UserSecret123',
        role: 'OWNER' as unknown as 'USER',
      })

    response.assertStatus(422)
  })

  test('register validation fails with password mismatch', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.confirm@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)

    const response = await client
      .post('/users/register')
      .header('Authorization', `Bearer ${managerToken}`)
      .json({
        email: 'mismatch@betalent.tech',
        password: 'UserSecret123',
        passwordConfirmation: 'DifferentSecret123',
        role: 'USER',
      })

    response.assertStatus(422)
  })

  test('register fails when email already exists', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.unique@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)
    await User.create({
      email: 'existing@betalent.tech',
      password: 'ExistingSecret123',
      role: 'USER',
    })

    const response = await client
      .post('/users/register')
      .header('Authorization', `Bearer ${managerToken}`)
      .json({
        email: 'existing@betalent.tech',
        password: 'UserSecret123',
        passwordConfirmation: 'UserSecret123',
        role: 'USER',
      })

    response.assertStatus(422)
  })

  test('manager receives 404 when user is not found', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.notfound@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)

    const response = await client
      .get('/users/9999')
      .header('Authorization', `Bearer ${managerToken}`)

    response.assertStatus(404)
  })

  test('manager receives 409 when updating user with duplicated email', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.update@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)
    const userA = await User.create({
      email: 'user.a@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })
    await User.create({
      email: 'user.b@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })

    const response = await client
      .put(`/users/${userA.id}`)
      .header('Authorization', `Bearer ${managerToken}`)
      .json({
        email: 'user.b@betalent.tech',
      })

    response.assertStatus(409)
  })

  test('manager can delete user', async ({ client }) => {
    const manager = await User.create({
      email: 'manager.delete@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)
    const target = await User.create({
      email: 'target.delete@betalent.tech',
      password: 'UserSecret123',
      role: 'USER',
    })

    const response = await client
      .delete(`/users/${target.id}`)
      .header('Authorization', `Bearer ${managerToken}`)

    response.assertStatus(200)
  })
})
