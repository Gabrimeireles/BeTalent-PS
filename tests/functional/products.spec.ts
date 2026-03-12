import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ProductFactory } from '#database/factories/product_factory'
import { createBearerToken } from './helpers.js'

test.group('Products', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('blocks products routes without bearer token', async ({ client }) => {
    const response = await client.get('/products')
    response.assertStatus(401)
  })

  test('admin can create product', async ({ client }) => {
    const admin = await UserFactory.merge({ role: 'ADMIN' }).create()
    const token = await createBearerToken(admin)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Premium Plan',
        amount: 1999,
      })

    response.assertStatus(201)
  })

  test('admin can list products', async ({ client }) => {
    const admin = await UserFactory.merge({ role: 'ADMIN' }).create()
    const token = await createBearerToken(admin)
    await ProductFactory.createMany(2)

    const response = await client
      .get('/products')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('manager can create product', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Enterprise Plan',
        amount: 3999,
      })

    response.assertStatus(201)
  })

  test('finance can create product', async ({ client }) => {
    const finance = await UserFactory.merge({ role: 'FINANCE' }).create()
    const token = await createBearerToken(finance)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Finance Plan',
        amount: 4999,
      })

    response.assertStatus(201)
  })

  test('user cannot create product', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Blocked Plan',
        amount: 999,
      })

    response.assertStatus(403)
  })

  test('user cannot list products', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .get('/products')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('validates product payload', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: '',
        amount: -10,
      })

    response.assertStatus(422)
  })

  test('manager can update product', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)
    const product = await ProductFactory.create()

    const response = await client
      .put(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Updated Product',
        amount: 2999,
      })

    response.assertStatus(200)
  })

  test('manager can delete product', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)
    const product = await ProductFactory.create()

    const response = await client
      .delete(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('manager receives 404 when product is not found', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)

    const response = await client
      .put('/products/99999')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Updated Product',
        amount: 2999,
      })

    response.assertStatus(404)
  })
})
