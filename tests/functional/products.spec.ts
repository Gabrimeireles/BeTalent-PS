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

  test('admin can create product', async ({ client, assert }) => {
    const admin = await UserFactory.merge({ role: 'ADMIN' }).create()
    const token = await createBearerToken(admin)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Premium Plan',
        amount: 1999,
        quantity: 10,
      })

    response.assertStatus(201)
    const body = (await response.body()) as any
    assert.properties(body.data, ['id', 'name', 'amount', 'quantity', 'createdAt', 'updatedAt'])
    assert.equal(body.data.name, 'Premium Plan')
    assert.equal(body.data.amount, 1999)
    assert.equal(body.data.quantity, 10)
  })

  test('admin can list products', async ({ client, assert }) => {
    const admin = await UserFactory.merge({ role: 'ADMIN' }).create()
    const token = await createBearerToken(admin)
    await ProductFactory.createMany(2)

    const response = await client
      .get('/products')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = (await response.body()) as any
    assert.isArray(body.data)
    assert.isTrue(body.data.length >= 2)
    assert.properties(body.data[0], ['id', 'name', 'amount', 'quantity', 'createdAt', 'updatedAt'])
  })

  test('manager can create product', async ({ client, assert }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Enterprise Plan',
        amount: 3999,
        quantity: 8,
      })

    response.assertStatus(201)
    const body = (await response.body()) as any
    assert.equal(body.data.name, 'Enterprise Plan')
    assert.equal(body.data.amount, 3999)
    assert.equal(body.data.quantity, 8)
  })

  test('finance can create product', async ({ client, assert }) => {
    const finance = await UserFactory.merge({ role: 'FINANCE' }).create()
    const token = await createBearerToken(finance)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Finance Plan',
        amount: 4999,
        quantity: 6,
      })

    response.assertStatus(201)
    const body = (await response.body()) as any
    assert.equal(body.data.name, 'Finance Plan')
    assert.equal(body.data.amount, 4999)
    assert.equal(body.data.quantity, 6)
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
        quantity: 1,
      })

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'You do not have permission to perform this action',
    })
  })

  test('user cannot list products', async ({ client }) => {
    const user = await UserFactory.merge({ role: 'USER' }).create()
    const token = await createBearerToken(user)

    const response = await client
      .get('/products')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'You do not have permission to perform this action',
    })
  })

  test('validates product payload', async ({ client, assert }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: '',
        amount: -10,
        quantity: -1,
      })

    response.assertStatus(422)
    const body = (await response.body()) as any
    assert.isArray(body.errors)
    assert.isTrue(body.errors.length > 0)
  })

  test('manager can update product', async ({ client, assert }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)
    const product = await ProductFactory.create()

    const response = await client
      .put(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Updated Product',
        amount: 2999,
        quantity: 15,
      })

    response.assertStatus(200)
    const body = (await response.body()) as any
    assert.equal(body.data.name, 'Updated Product')
    assert.equal(body.data.amount, 2999)
    assert.equal(body.data.quantity, 15)
  })

  test('manager can delete product', async ({ client }) => {
    const manager = await UserFactory.merge({ role: 'MANAGER' }).create()
    const token = await createBearerToken(manager)
    const product = await ProductFactory.create()

    const response = await client
      .delete(`/products/${product.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Product deleted successfully' })
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
        quantity: 15,
      })

    response.assertStatus(404)
    response.assertBodyContains({ message: 'Product not found' })
  })
})
