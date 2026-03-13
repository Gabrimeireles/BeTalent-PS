import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  async health({ response }: HttpContext) {
    return response.ok({ status: 'ok' })
  }

  async live({ response }: HttpContext) {
    return response.ok({
      status: 'ok',
      uptime: this.getUptimeDays(),
      version: this.getVersion(),
    })
  }

  async ready({ response }: HttpContext) {
    try {
      await db.rawQuery('SELECT 1')

      return response.ok({
        status: 'ok',
        info: { db: { status: 'up' } },
        details: { db: { status: 'up' } },
      })
    } catch (error) {
      return response.serviceUnavailable({
        status: 'error',
        error: { db: { status: 'down', message: error instanceof Error ? error.message : String(error) } },
        details: { db: { status: 'down' } },
      })
    }
  }

  private getUptimeDays() {
    const days = process.uptime() / 86400
    return Number(days.toFixed(2))
  }

  private getVersion() {
    return (
      process.env.APP_VERSION ||
      process.env.HOMOLOG_VERSION ||
      process.env.VERSION ||
      process.env.BUILD_SHA ||
      process.env.COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      'unknown'
    )
  }
}
