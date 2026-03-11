import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import { updateGatewayPriorityValidator, updateGatewayStatusValidator } from '#validators/gateway'

export default class GatewaysController {
  async updateStatus({ params, request, response }: HttpContext) {
    const gateway = await Gateway.find(params.id)

    if (!gateway) {
      return response.notFound({ message: 'Gateway not found' })
    }

    const { isActive } = await request.validateUsing(updateGatewayStatusValidator)
    gateway.isActive = isActive
    await gateway.save()

    return response.ok({
      data: {
        id: gateway.id,
        name: gateway.name,
        priority: gateway.priority,
        isActive: gateway.isActive,
        updatedAt: gateway.updatedAt,
      },
    })
  }

  async updatePriority({ params, request, response }: HttpContext) {
    const gateway = await Gateway.find(params.id)

    if (!gateway) {
      return response.notFound({ message: 'Gateway not found' })
    }

    const { priority } = await request.validateUsing(updateGatewayPriorityValidator)
    gateway.priority = priority
    await gateway.save()

    return response.ok({
      data: {
        id: gateway.id,
        name: gateway.name,
        priority: gateway.priority,
        isActive: gateway.isActive,
        updatedAt: gateway.updatedAt,
      },
    })
  }
}
