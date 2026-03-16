# Be Talent API

API desenvolvida em AdonisJS como parte de um case tecnico. A aplicacao implementa autenticacao com token Bearer, controle de acesso por perfil, gerenciamento de usuarios e produtos, consulta de clientes, processamento de transacoes e integracao com gateways de pagamento mockados.

## Visao geral

- Stack principal: Node.js, TypeScript, AdonisJS 7, Lucid ORM e MySQL.
- Autenticacao: Bearer token.
- Autorizacao: RBAC com os perfis `ADMIN`, `MANAGER`, `FINANCE` e `USER`.
- Integracoes externas: dois gateways de pagamento mockados.
- Documentacao OpenAPI: Swagger UI embutido na propria aplicacao.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior.
- MySQL 8.
- Docker e Docker Compose, caso prefira subir todo o ambiente por containers.

## Variaveis de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Ajuste os valores conforme o ambiente.

Exemplo de configuracao local:

```env
TZ=UTC
PORT=3333
HOST=localhost
NODE_ENV=development

LOG_LEVEL=info
APP_KEY=sua_chave_gerada
APP_URL=http://localhost:3333
SESSION_DRIVER=cookie

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=be_talent_db

GATEWAY_MOCK_HOST=localhost
GATEWAY1_PORT=3001
GATEWAY2_PORT=3002
```

Observacoes:

- `APP_KEY` e obrigatoria para a aplicacao subir corretamente.
- O projeto usa MySQL como conexao padrao.
- Para rodar os gateways mockados em container separado, mantenha `GATEWAY_MOCK_HOST=localhost`.
- No `docker-compose.yml` principal, a aplicacao usa `GATEWAY_MOCK_HOST=gateways-mock`.
- O `docker-compose.yml` principal reaproveita `DB_DATABASE`, `DB_USER` e `DB_PASSWORD` do `.env` para manter a aplicacao e o MySQL sincronizados.
- Opcionalmente, o proprio `docker-compose.yml` pode executar a suite de testes antes de subir a API com `RUN_TESTS_ON_BOOT=true`.

## Como instalar e rodar o projeto

### Opcao 1: ambiente local

1. Instale as dependencias:

```bash
npm install
```

2. Configure o arquivo `.env`.

3. Gere a chave da aplicacao, se necessario:

```bash
node ace generate:key
```

4. Suba o MySQL e os gateways mockados.

Exemplo com Docker apenas para as dependencias:

```bash
docker run --name be-talent-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=be_talent_db -p 3306:3306 -d mysql:8.4
docker run --name be-talent-gateways -p 3001:3001 -p 3002:3002 -d matheusprotzen/gateways-mock
```

5. Execute as migrations:

```bash
node ace migration:run
```

6. Rode os seeders:

```bash
node ace db:seed
```

7. Inicie a aplicacao:

```bash
npm run dev
```

A API ficara disponivel em `http://localhost:3333`.

### Opcao 2: ambiente completo com Docker Compose

Para subir banco, gateways mockados e aplicacao de uma vez:

```bash
docker compose up --build
```

Esse fluxo:

- sobe o MySQL;
- sobe os mocks dos gateways;
- executa `migration:run`;
- executa `db:seed`;
- executa `npm test` quando `RUN_TESTS_ON_BOOT=true`;
- inicia a API na porta `3333`.

Observacao:

- Ao final da suite, o teardown dos testes executa `db:truncate` e `db:seed`, deixando o banco limpo e sem residuo dos testes.
- Para desativar os testes no boot do Docker, defina `RUN_TESTS_ON_BOOT=false`.

## Dados iniciais

O projeto possui seeders para facilitar a avaliacao do case:

- Usuario administrador inicial:
  - email: `dev@betalent.tech`
  - credencial de login: `FEC9BB078BF338F464F96B48089EB498`
- Gateways iniciais:
  - `Gateway 1`
  - `Gateway 2`

Importante:

- O endpoint de login espera os campos `email` e `token`.
- Na pratica, esse `token` funciona como a credencial usada na verificacao do usuario.

Exemplo de login:

```bash
curl --request POST \
  --url http://localhost:3333/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "dev@betalent.tech",
    "token": "FEC9BB078BF338F464F96B48089EB498"
  }'
```

## Scripts uteis

- `npm run dev`: sobe a API em modo desenvolvimento com HMR.
- `npm run build`: gera build de producao.
- `npm start`: executa a aplicacao compilada.
- `npm test`: executa a suite de testes.
- `npm run lint`: executa o lint.
- `npm run typecheck`: valida tipos TypeScript.
- `npm run generate:swagger`: gera o arquivo Swagger em `swagger/swagger.json`.

## Detalhamento das rotas

### Publicas

| Metodo | Rota | Descricao | Autenticacao |
| --- | --- | --- | --- |
| GET | `/` | Endpoint simples de teste | Nao |
| GET | `/docs` | Swagger UI da API | Nao |
| GET | `/docs/openapi.json` | Especificacao OpenAPI em JSON | Nao |
| GET | `/health` | Status basico da aplicacao | Nao |
| GET | `/health/live` | Liveness check com uptime e versao | Nao |
| GET | `/health/ready` | Readiness check com validacao de banco | Nao |
| POST | `/login` | Autentica usuario e retorna Bearer token | Nao |
| POST | `/transactions` | Cria uma transacao e envia para o gateway | Nao |

### Autenticadas

Todas as rotas abaixo exigem header `Authorization: Bearer <token>`.

#### Conta

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| GET | `/account/profile` | Retorna os dados do usuario autenticado | Todos autenticados |
| POST | `/logout` | Revoga o token atual | Todos autenticados |

#### Usuarios

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| POST | `/users/register` | Cria um novo usuario | `ADMIN`, `MANAGER` |
| GET | `/users` | Lista usuarios | `ADMIN`, `MANAGER` |
| GET | `/users/:id` | Detalha um usuario | `ADMIN`, `MANAGER` |
| PUT | `/users/:id` | Atualiza email, senha e perfil | `ADMIN`, `MANAGER` |
| DELETE | `/users/:id` | Remove um usuario | `ADMIN`, `MANAGER` |

Corpo esperado em criacao:

```json
{
  "email": "new.user@betalent.tech",
  "password": "UserSecret123",
  "passwordConfirmation": "UserSecret123",
  "role": "USER"
}
```

#### Gateways

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| PATCH | `/gateways/:id/status` | Ativa ou desativa um gateway | `ADMIN` |
| PATCH | `/gateways/:id/priority` | Altera a prioridade de um gateway | `ADMIN` |

Exemplos de corpo:

```json
{
  "isActive": false
}
```

```json
{
  "priority": 10
}
```

Regras relevantes:

- Prioridade minima permitida: `1`.
- Gateways inativos nao entram na ordem de tentativa de cobranca.

#### Produtos

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| GET | `/products` | Lista produtos | `ADMIN`, `MANAGER`, `FINANCE` |
| POST | `/products` | Cria produto | `ADMIN`, `MANAGER`, `FINANCE` |
| GET | `/products/:id` | Detalha produto | `ADMIN`, `MANAGER`, `FINANCE` |
| PUT | `/products/:id` | Atualiza produto | `ADMIN`, `MANAGER`, `FINANCE` |
| DELETE | `/products/:id` | Remove produto | `ADMIN`, `MANAGER`, `FINANCE` |

Corpo esperado:

```json
{
  "name": "Premium Plan",
  "amount": 1999,
  "quantity": 10
}
```

Regras relevantes:

- `amount` deve ser informado em centavos.
- `quantity` representa o estoque disponivel do produto e deve ser inteiro maior ou igual a `0`.

#### Clientes

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| GET | `/clients` | Lista clientes | Todos autenticados |
| GET | `/clients/:id` | Retorna cliente com historico de compras | Todos autenticados |

#### Transacoes

| Metodo | Rota | Descricao | Perfis |
| --- | --- | --- | --- |
| GET | `/transactions` | Lista transacoes | Todos autenticados |
| GET | `/transactions/:id` | Detalha uma transacao | Todos autenticados |
| POST | `/transactions/:id/refund` | Estorna uma transacao concluida | `ADMIN`, `FINANCE` |

Corpo esperado para criacao:

```json
{
  "name": "Cliente Exemplo",
  "email": "cliente@exemplo.com",
  "cardNumber": "5569000000006063",
  "cvv": "010",
  "products": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

Comportamentos relevantes:

- O valor total da transacao e calculado pela API a partir dos produtos e quantidades enviados.
- O campo `amount` e persistido em centavos, como inteiro.
- O cliente e criado automaticamente caso ainda nao exista.
- A compra so e concluida quando existe estoque suficiente para todos os produtos solicitados.
- Se alguma quantidade solicitada for maior que o estoque disponivel, a API retorna `422` e nao efetiva a cobranca.
- Ao concluir a compra, o estoque dos produtos e decrementado conforme as quantidades compradas.
- A API tenta cobrar nos gateways ativos em ordem de prioridade.
- Em caso de erro de infraestrutura em um gateway, a API tenta fallback para o proximo gateway ativo.
- O estorno so e permitido para transacoes com status `completed`.
- Ao estornar uma compra, o status da transacao passa para `refunded`.
- Ao estornar uma compra, o estoque dos produtos da transacao e devolvido.

## Swagger e documentacao da API

Swagger local:

- UI: `http://localhost:3333/docs`
- OpenAPI JSON: `http://localhost:3333/docs/openapi.json`

Swagger da aplicacao publica:

- UI: `https://be-talent.grmeireles.dev/docs/`
- OpenAPI JSON: `https://be-talent.grmeireles.dev/docs/openapi.json`

Observacao: a URL da UI publica deve ser acessada com barra final (`/docs/`).

Os endpoints publicos acima foram validados durante a geracao deste README.

## Testes

Para executar os testes automatizados:

```bash
npm test
```

Existe tambem uma suite de integracao com gateways reais mockados, controlada por variavel de ambiente:

```bash
GATEWAY_LIVE_TESTS=true npm test
```

Nesse caso, os mocks precisam estar acessiveis nas portas configuradas pelas variaveis `GATEWAY_MOCK_HOST`, `GATEWAY1_PORT` e `GATEWAY2_PORT`.

## Informacoes relevantes para a entrega do case

- A API foi estruturada com separacao clara entre controllers, services, validators, models, transformers e testes.
- O projeto possui health checks de disponibilidade e prontidao.
- A documentacao OpenAPI fica disponivel junto com a aplicacao, o que facilita a avaliacao funcional.
- O controle de acesso por perfil cobre cenarios administrativos, operacionais e financeiros.
- O fluxo de transacao contempla criacao, consulta e estorno.
- O projeto ja possui arquivos para execucao local e via Docker, o que reduz o esforco de setup para avaliacao.

## Refactor dos gateways

O fluxo de integracao com gateways foi refatorado para um modelo baseado em drivers, com o objetivo de reduzir acoplamento e facilitar evolucao:

- Contrato comum de integracao em `app/services/gateway/payment_gateway_driver.ts`.
- Implementacoes especificas por provedor em `app/services/gateway/drivers/`.
- Resolucao do driver correto por gateway em `app/services/gateway/gateway_driver_resolver.ts`.
- Orquestracao central de cobranca e estorno em `app/services/gateway/gateway_service.ts`.

Beneficios diretos no case:

- Inclusao de novos gateways sem alterar o fluxo principal de transacoes.
- Regras isoladas por provedor (autenticacao, payload, parse de resposta e tratamento de erro).
- Testes mais simples e direcionados por driver e por fluxo de orquestracao.
