/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const AccessTokenController = () => import('#controllers/access_token_controller')
const ProfileController = () => import('#controllers/profile_controller')
const UsersController = () => import('#controllers/users_controller')
const DocsController = () => import('#controllers/docs_controller')
const GatewaysController = () => import('#controllers/gateways_controller')
const ProductsController = () => import('#controllers/products_controller')
const ClientsController = () => import('#controllers/clients_controller')
const TransactionsController = () => import('#controllers/transactions_controller')

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/docs', [DocsController, 'ui'])
router.get('/docs/openapi.json', [DocsController, 'json'])

router.post('/login', [AccessTokenController, 'store'])

router
  .group(() => {
    router.post('/logout', [AccessTokenController, 'destroy'])

    router.get('/account/profile', [ProfileController, 'show'])

    router
      .group(() => {
        router.post('/register', [UsersController, 'store'])
        router.get('/', [UsersController, 'index'])
        router.get('/:id', [UsersController, 'show'])
        router.put('/:id', [UsersController, 'update'])
        router.delete('/:id', [UsersController, 'destroy'])
      })
      .prefix('/users')
      .use(middleware.role({ roles: ['ADMIN', 'MANAGER'] }))

    router
      .group(() => {
        router.patch('/:id/status', [GatewaysController, 'updateStatus'])
        router.patch('/:id/priority', [GatewaysController, 'updatePriority'])
      })
      .prefix('/gateways')
      .use(middleware.role({ roles: ['ADMIN'] }))

    router
      .group(() => {
        router.get('/', [ProductsController, 'index'])
        router.post('/', [ProductsController, 'store'])
        router.get('/:id', [ProductsController, 'show'])
        router.put('/:id', [ProductsController, 'update'])
        router.delete('/:id', [ProductsController, 'destroy'])
      })
      .prefix('/products')
      .use(middleware.role({ roles: ['ADMIN', 'MANAGER', 'FINANCE'] }))

    router
      .group(() => {
        router.get('/', [ClientsController, 'index'])
        router.get('/:id', [ClientsController, 'show'])
      })
      .prefix('/clients')

    router
      .group(() => {
        router.get('/', [TransactionsController, 'index'])
        router.get('/:id', [TransactionsController, 'show'])
        router.post('/', [TransactionsController, 'store'])
        router
          .post('/:id/refund', [TransactionsController, 'refund'])
          .use(middleware.role({ roles: ['ADMIN', 'FINANCE'] }))
      })
      .prefix('/transactions')
  })
  .use(middleware.auth())
