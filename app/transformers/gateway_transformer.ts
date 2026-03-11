import { BaseTransformer } from '@adonisjs/core/transformers'
import type Gateway from '#models/gateway'

export default class GatewayTransformer extends BaseTransformer<Gateway> {
  toObject() {
    return this.pick(this.resource, ['id'])
  }
}
