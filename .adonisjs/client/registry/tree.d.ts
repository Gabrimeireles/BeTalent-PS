/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  docs: {
    ui: typeof routes['docs.ui']
    json: typeof routes['docs.json']
  }
  health: {
    health: typeof routes['health.health']
    live: typeof routes['health.live']
    ready: typeof routes['health.ready']
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
  gateways: {
    updateStatus: typeof routes['gateways.update_status']
    updatePriority: typeof routes['gateways.update_priority']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
    show: typeof routes['products.show']
    update: typeof routes['products.update']
    destroy: typeof routes['products.destroy']
  }
  clients: {
    index: typeof routes['clients.index']
    show: typeof routes['clients.show']
  }
  transactions: {
    index: typeof routes['transactions.index']
    show: typeof routes['transactions.show']
    store: typeof routes['transactions.store']
    refund: typeof routes['transactions.refund']
  }
}
