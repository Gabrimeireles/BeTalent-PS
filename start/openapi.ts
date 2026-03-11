export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Be Talent API',
    version: '1.0.0',
    description: 'Technical case API for auth, users, and role-based authorization',
  },
  servers: [
    {
      url: 'http://localhost:3333',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
      },
    },
    schemas: {
      LoginBody: {
        type: 'object',
        required: ['email', 'token'],
        properties: {
          email: { type: 'string', format: 'email' },
          token: { type: 'string' },
        },
      },
      CreateUserBody: {
        type: 'object',
        required: ['email', 'password', 'passwordConfirmation', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          passwordConfirmation: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
        },
      },
      UpdateUserBody: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
        },
      },
    },
  },
  paths: {
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and generate access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
          },
        },
      },
    },
    '/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and revoke token',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Token revoked',
          },
        },
      },
    },
    '/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Register user (ADMIN or MANAGER)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserBody' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (ADMIN or MANAGER)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Users list',
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id (ADMIN or MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User details' },
          '404': { description: 'User not found' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user (ADMIN or MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserBody' },
            },
          },
        },
        responses: {
          '200': { description: 'User updated' },
          '404': { description: 'User not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (ADMIN or MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User deleted' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/account/profile': {
      get: {
        tags: ['Account'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profile' },
        },
      },
    },
  },
} as const
