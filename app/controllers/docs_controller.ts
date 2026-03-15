import { openApiSpec } from '#start/openapi'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocsController {
  async json({ request, response }: HttpContext) {
    const forwardedProto = request.header('x-forwarded-proto')?.split(',')[0]?.trim()
    const forwardedHost = request.header('x-forwarded-host')?.split(',')[0]?.trim()
    const protocol = forwardedProto || request.protocol()
    const host = forwardedHost || request.host()
    const defaultServerUrl = openApiSpec.servers[0]?.url || 'http://localhost:3333'
    const serverUrl = host ? `${protocol}://${host}` : defaultServerUrl

    const spec = {
      ...openApiSpec,
      servers: [{ url: serverUrl }],
    }

    return response.ok(spec)
  }

  async ui({ response }: HttpContext) {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Be Talent API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: 'openapi.json',
        dom_id: '#swagger-ui',
      })
    </script>
  </body>
</html>`

    return response.type('text/html').send(html)
  }
}
