import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { createBearerToken, createGatewayRecord } from './helpers.js'

test.group('Gateways', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin can activate/deactivate gateway and change priority', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'admin@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    })
    const adminToken = await createBearerToken(admin)
    const gatewayId = await createGatewayRecord('Gateway Test', 1, true)

    const statusResponse = await client
      .patch(`/gateways/${gatewayId}/status`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: false })

    statusResponse.assertStatus(200)
    const statusBody = await statusResponse.body()
    assert.equal(statusBody.data.isActive, false)

    const priorityResponse = await client
      .patch(`/gateways/${gatewayId}/priority`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ priority: 10 })

    priorityResponse.assertStatus(200)
    const priorityBody = await priorityResponse.body()
    assert.equal(priorityBody.data.priority, 10)
  })

  test('manager cannot update gateway settings', async ({ client }) => {
    const manager = await User.create({
      email: 'manager2@betalent.tech',
      password: 'ManagerSecret123',
      role: 'MANAGER',
    })
    const managerToken = await createBearerToken(manager)
    const gatewayId = await createGatewayRecord('Gateway Restricted', 2, true)

    const response = await client
      .patch(`/gateways/${gatewayId}/priority`)
      .header('Authorization', `Bearer ${managerToken}`)
      .json({ priority: 4 })

    response.assertStatus(403)
  })

  test('gateway status update returns 404 when not found', async ({ client }) => {
    const admin = await User.create({
      email: 'admin.gateway404@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    })
    const adminToken = await createBearerToken(admin)

    const response = await client
      .patch('/gateways/9999/status')
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: true })

    response.assertStatus(404)
  })

  test('gateway priority validation rejects negative values', async ({ client }) => {
    const admin = await User.create({
      email: 'admin.gateway.validation@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    })
    const adminToken = await createBearerToken(admin)
    const gatewayId = await createGatewayRecord('Gateway Priority Validation', 2, true)

    const response = await client
      .patch(`/gateways/${gatewayId}/priority`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ priority: -1 })

    response.assertStatus(422)
  })

  test('gateway status validation rejects non-boolean', async ({ client }) => {
    const admin = await User.create({
      email: 'admin.gateway.bool@betalent.tech',
      password: 'AdminSecret123',
      role: 'ADMIN',
    })
    const adminToken = await createBearerToken(admin)
    const gatewayId = await createGatewayRecord('Gateway Status Validation', 2, true)

    const response = await client
      .patch(`/gateways/${gatewayId}/status`)
      .header('Authorization', `Bearer ${adminToken}`)
      .json({ isActive: 'yes' })

    response.assertStatus(422)
  })
})
