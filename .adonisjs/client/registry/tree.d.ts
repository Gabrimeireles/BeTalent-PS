/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  docs: {
    ui: typeof routes['docs.ui']
    json: typeof routes['docs.json']
  }
  accessToken: {
    store: typeof routes['access_token.store']
    destroy: typeof routes['access_token.destroy']
  }
  profile: {
    show: typeof routes['profile.show']
  }
  users: {
    store: typeof routes['users.store']
    index: typeof routes['users.index']
    show: typeof routes['users.show']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
  }
}
