import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createBearerToken } from './helpers.js'
import { UserFactory } from '#database/factories/user_factory'
import { GatewayFactory } from '#database/factories/gateway_factory'

test.group('Gateways', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin can activate/deactivate gateway and change priority', async ({ client, assert }) => {
    const admin = await UserFactory.merge({
      email: 'admin@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    }).create()
    const adminToken = await createBearerToken(admin)
    const gateway = await GatewayFactory.merge({
      name: 'Gateway Test',
      priority: 1,
      isActive: true,
      url: 'https://gateway-test.local',
    }).create()

    const statusResponse = await client
      .patch(`/gateways/${gateway.id}/status`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: false })

    statusResponse.assertStatus(200)
    const statusBody = await statusResponse.body()
    assert.equal(statusBody.data.isActive, false)

    const priorityResponse = await client
      .patch(`/gateways/${gateway.id}/priority`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ priority: 10 })

    priorityResponse.assertStatus(200)
    const priorityBody = await priorityResponse.body()
    assert.equal(priorityBody.data.priority, 10)
  })

  test('manager cannot update gateway settings', async ({ client }) => {
    const manager = await UserFactory.merge({
      email: 'manager2@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    }).create()
    const managerToken = await createBearerToken(manager)
    const gateway = await GatewayFactory.merge({
      name: 'Gateway Restricted',
      priority: 2,
      isActive: true,
      url: 'https://gateway-restricted.local',
    }).create()

    const response = await client
      .patch(`/gateways/${gateway.id}/priority`)
      .header('Authorization', `Bearer ${managerToken}`)
      .json({ priority: 4 })

    response.assertStatus(403)
  })

  test('gateway status update returns 404 when not found', async ({ client }) => {
    const admin = await UserFactory.merge({
      email: 'admin.gateway404@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    }).create()
    const adminToken = await createBearerToken(admin)

    const response = await client
      .patch('/gateways/9999/status')
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: true })

    response.assertStatus(404)
  })

  test('gateway priority validation rejects negative values', async ({ client }) => {
    const admin = await UserFactory.merge({
      email: 'admin.gateway.validation@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    }).create()
    const adminToken = await createBearerToken(admin)
    const gateway = await GatewayFactory.merge({
      name: 'Gateway Priority Validation',
      priority: 2,
      isActive: true,
      url: 'https://gateway-priority-validation.local',
    }).create()

    const response = await client
      .patch(`/gateways/${gateway.id}/priority`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ priority: -1 })

    response.assertStatus(422)
  })

  test('gateway status validation rejects non-boolean', async ({ client }) => {
    const admin = await UserFactory.merge({
      email: 'admin.gateway.bool@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    }).create()
    const adminToken = await createBearerToken(admin)
    const gateway = await GatewayFactory.merge({
      name: 'Gateway Status Validation',
      priority: 2,
      isActive: true,
      url: 'https://gateway-status-validation.local',
    }).create()

    const response = await client
      .patch(`/gateways/${gateway.id}/status`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: 'yes' })

    response.assertStatus(422)
  })
})
