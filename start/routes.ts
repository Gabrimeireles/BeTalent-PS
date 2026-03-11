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
import AccessTokenController from '#controllers/access_token_controller'
import ProfileController from '#controllers/profile_controller'
import UsersController from '#controllers/users_controller'
import DocsController from '#controllers/docs_controller'

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
  })
  .use(middleware.auth())
