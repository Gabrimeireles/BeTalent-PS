import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { openApiSpec } from '../start/openapi.js'

const outputDir = path.join(process.cwd(), 'swagger')
const outputFile = path.join(outputDir, 'swagger.json')

await mkdir(outputDir, { recursive: true })
await writeFile(outputFile, `${JSON.stringify(openApiSpec, null, 2)}\n`, 'utf8')

console.log(`Swagger JSON generated at ${outputFile}`)
