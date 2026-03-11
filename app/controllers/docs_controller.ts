import { openApiSpec } from '#start/openapi'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocsController {
  async json({ response }: HttpContext) {
    return response.ok(openApiSpec)
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
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
      })
    </script>
  </body>
</html>`

    return response.type('text/html').send(html)
  }
}
