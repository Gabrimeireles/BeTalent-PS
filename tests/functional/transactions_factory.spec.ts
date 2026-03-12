import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { TransactionFactory } from '#database/factories/transaction_factory'
import TransactionProduct from '#models/transaction_product'

test.group('TransactionFactory', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates transaction with related transaction_products', async ({ assert }) => {
    const transaction = await TransactionFactory.create()

    assert.exists(transaction.id)
    assert.isTrue(transaction.amount > 0)
    assert.equal(transaction.status, 'pending')
    assert.lengthOf(transaction.cardLastNumbers, 4)

    const items = await TransactionProduct.query().where('transactionId', transaction.id)
    assert.isTrue(items.length > 0)
    assert.isTrue(items.every((item) => item.quantity > 0))
  })
})
