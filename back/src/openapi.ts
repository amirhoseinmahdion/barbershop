export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Hair Salon Platform API",
    version: "0.2.0",
    description: "Express API for salon news, schedules, and appointment reservations.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Process and dependency health checks",
    },
    {
      name: "Authentication",
      description: "Customer registration and cookie-based sessions",
    },
  ],
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"], summary: "Register a customer", operationId: "registerCustomer",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } },
        responses: {
          "201": { description: "Customer created and session cookies set.", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"], summary: "Sign in", operationId: "login",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: {
          "200": { description: "Authenticated and session cookies set.", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"], summary: "Get the active user", operationId: "getCurrentUser",
        security: [{ accessCookie: [] }],
        responses: {
          "200": { description: "Current authenticated user.", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Authentication"], summary: "Rotate the session", operationId: "refreshSession",
        security: [{ refreshCookie: [] }],
        responses: {
          "200": { description: "Session cookies rotated.", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Authentication"], summary: "Sign out", operationId: "logout",
        security: [{ refreshCookie: [] }],
        responses: { "204": { description: "Session revoked and cookies cleared." } },
      },
    },
    "/health/live": {
      get: {
        tags: ["Health"],
        summary: "Check process liveness",
        operationId: "getLiveness",
        responses: {
          "200": {
            description: "The Express process is running.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LivenessResponse",
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["Health"],
        summary: "Check application readiness",
        operationId: "getReadiness",
        responses: {
          "200": {
            description: "The API can connect to PostgreSQL.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReadyResponse",
                },
              },
            },
          },
          "503": {
            description: "PostgreSQL is unavailable.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotReadyResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      accessCookie: { type: "apiKey", in: "cookie", name: "salon_access" },
      refreshCookie: { type: "apiKey", in: "cookie", name: "salon_refresh" },
    },
    responses: {
      Unauthorized: { description: "Authentication failed.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      Conflict: { description: "The email is already registered.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      ValidationError: { description: "The request body is invalid.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
    schemas: {
      User: {
        type: "object", additionalProperties: false,
        required: ["id", "email", "firstName", "lastName", "phone", "profileImageUrl", "role"],
        properties: {
          id: { type: "string", format: "uuid" }, email: { type: "string", format: "email" },
          firstName: { type: "string" }, lastName: { type: "string" },
          phone: { type: ["string", "null"] }, profileImageUrl: { type: ["string", "null"], format: "uri" },
          role: { type: "string", enum: ["CUSTOMER", "SALON_ADMIN", "SUPER_ADMIN"] },
        },
      },
      AuthResponse: {
        type: "object", additionalProperties: false, required: ["data"],
        properties: { data: { type: "object", additionalProperties: false, required: ["user"], properties: { user: { $ref: "#/components/schemas/User" } } } },
      },
      LoginRequest: {
        type: "object", additionalProperties: false, required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } },
      },
      RegisterRequest: {
        allOf: [
          { $ref: "#/components/schemas/LoginRequest" },
          { type: "object", additionalProperties: false, required: ["firstName", "lastName"], properties: { firstName: { type: "string" }, lastName: { type: "string" }, phone: { type: "string" } } },
        ],
      },
      ErrorResponse: {
        type: "object", required: ["error"],
        properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" } } } },
      },
      LivenessResponse: {
        type: "object",
        additionalProperties: false,
        required: ["status"],
        properties: {
          status: { type: "string", const: "ok" },
        },
      },
      ReadyResponse: {
        type: "object",
        additionalProperties: false,
        required: ["status", "database"],
        properties: {
          status: { type: "string", const: "ready" },
          database: { type: "string", const: "connected" },
        },
      },
      NotReadyResponse: {
        type: "object",
        additionalProperties: false,
        required: ["status", "database"],
        properties: {
          status: { type: "string", const: "not_ready" },
          database: { type: "string", const: "unavailable" },
        },
      },
    },
  },
} as const;
