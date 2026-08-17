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
  ],
  paths: {
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
    schemas: {
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
