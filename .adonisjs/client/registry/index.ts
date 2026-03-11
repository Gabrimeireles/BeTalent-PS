/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'docs.ui': {
    methods: ["GET","HEAD"],
    pattern: '/docs',
    tokens: [{"old":"/docs","type":0,"val":"docs","end":""}],
    types: placeholder as Registry['docs.ui']['types'],
  },
  'docs.json': {
    methods: ["GET","HEAD"],
    pattern: '/docs/openapi.json',
    tokens: [{"old":"/docs/openapi.json","type":0,"val":"docs","end":""},{"old":"/docs/openapi.json","type":0,"val":"openapi.json","end":""}],
    types: placeholder as Registry['docs.json']['types'],
  },
  'access_token.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['access_token.store']['types'],
  },
  'access_token.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['access_token.destroy']['types'],
  },
  'profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/account/profile',
    tokens: [{"old":"/account/profile","type":0,"val":"account","end":""},{"old":"/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.show']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/users/register',
    tokens: [{"old":"/users/register","type":0,"val":"users","end":""},{"old":"/users/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/users',
    tokens: [{"old":"/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.index']['types'],
  },
  'users.show': {
    methods: ["GET","HEAD"],
    pattern: '/users/:id',
    tokens: [{"old":"/users/:id","type":0,"val":"users","end":""},{"old":"/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.show']['types'],
  },
  'users.update': {
    methods: ["PUT"],
    pattern: '/users/:id',
    tokens: [{"old":"/users/:id","type":0,"val":"users","end":""},{"old":"/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.update']['types'],
  },
  'users.destroy': {
    methods: ["DELETE"],
    pattern: '/users/:id',
    tokens: [{"old":"/users/:id","type":0,"val":"users","end":""},{"old":"/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.destroy']['types'],
  },
  'gateways.update_status': {
    methods: ["PATCH"],
    pattern: '/gateways/:id/status',
    tokens: [{"old":"/gateways/:id/status","type":0,"val":"gateways","end":""},{"old":"/gateways/:id/status","type":1,"val":"id","end":""},{"old":"/gateways/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['gateways.update_status']['types'],
  },
  'gateways.update_priority': {
    methods: ["PATCH"],
    pattern: '/gateways/:id/priority',
    tokens: [{"old":"/gateways/:id/priority","type":0,"val":"gateways","end":""},{"old":"/gateways/:id/priority","type":1,"val":"id","end":""},{"old":"/gateways/:id/priority","type":0,"val":"priority","end":""}],
    types: placeholder as Registry['gateways.update_priority']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
