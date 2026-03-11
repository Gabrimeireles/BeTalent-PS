import { test } from '@japa/runner'
import {
  canManageProducts,
  canManageUsers,
  canRefund,
  isAdmin,
  normalizeRole,
} from '#services/role_permissions'

test.group('Role permissions', () => {
  test('normalize role to USER when undefined or invalid', ({ assert }) => {
    assert.equal(normalizeRole(undefined), 'USER')
    assert.equal(normalizeRole(null), 'USER')
    assert.equal(normalizeRole('invalid-role'), 'USER')
  })

  test('normalize lowercase roles', ({ assert }) => {
    assert.equal(normalizeRole('admin'), 'ADMIN')
    assert.equal(normalizeRole('manager'), 'MANAGER')
    assert.equal(normalizeRole('finance'), 'FINANCE')
    assert.equal(normalizeRole('user'), 'USER')
  })

  test('admin can do everything', ({ assert }) => {
    assert.isTrue(isAdmin('ADMIN'))
    assert.isTrue(canManageUsers('ADMIN'))
    assert.isTrue(canManageProducts('ADMIN'))
    assert.isTrue(canRefund('ADMIN'))
  })

  test('manager can manage users and products', ({ assert }) => {
    assert.isFalse(isAdmin('MANAGER'))
    assert.isTrue(canManageUsers('MANAGER'))
    assert.isTrue(canManageProducts('MANAGER'))
    assert.isFalse(canRefund('MANAGER'))
  })

  test('finance can manage products and refund', ({ assert }) => {
    assert.isFalse(isAdmin('FINANCE'))
    assert.isFalse(canManageUsers('FINANCE'))
    assert.isTrue(canManageProducts('FINANCE'))
    assert.isTrue(canRefund('FINANCE'))
  })

  test('user only does uncited/default actions', ({ assert }) => {
    assert.isFalse(isAdmin('USER'))
    assert.isFalse(canManageUsers('USER'))
    assert.isFalse(canManageProducts('USER'))
    assert.isFalse(canRefund('USER'))
  })
})
