import { BaseTransformer } from '@adonisjs/core/transformers'
import type Gateway from '#models/gateway'

export default class GatewayTransformer extends BaseTransformer<Gateway> {
  static toResponse(gateway: Gateway) {
    return {
      id: gateway.id,
      name: gateway.name,
      priority: gateway.priority,
      isActive: gateway.isActive,
      url: gateway.url,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
    }
  }

  toObject() {
    return GatewayTransformer.toResponse(this.resource)
  }
}
