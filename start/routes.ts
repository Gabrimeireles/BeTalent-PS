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
  })
  .use(middleware.auth())
