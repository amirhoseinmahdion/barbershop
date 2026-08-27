export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Hair Salon Platform API",
    version: "0.5.0",
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
    { name: "Profiles", description: "Authenticated account profiles" },
    { name: "Salons", description: "Public salon and service discovery" },
    { name: "Availability", description: "Public appointment availability calculated by the backend" },
    { name: "Bookings", description: "Authenticated customer reservations" },
    { name: "Salon administration", description: "Tenant-scoped salon and service management" },
    { name: "Platform administration", description: "Platform-wide salon provisioning" },
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
    "/api/v1/users/me": {
      patch: {
        tags: ["Profiles"], summary: "Update the current profile", operationId: "updateCurrentProfile", security: [{ accessCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileUpdate" } } } },
        responses: { "200": { description: "Updated safe user profile.", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/salons": {
      get: {
        tags: ["Salons"], summary: "List active salons", operationId: "listSalons",
        parameters: [
          { name: "audience", in: "query", schema: { type: "string", enum: ["MEN", "WOMEN", "UNISEX"] } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "cursor", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
        ],
        responses: { "200": { description: "Active salons.", content: { "application/json": { schema: { $ref: "#/components/schemas/SalonList" } } } } },
      },
    },
    "/api/v1/salons/{salonIdOrSlug}": {
      get: {
        tags: ["Salons"], summary: "Get an active salon", operationId: "getSalon",
        parameters: [{ name: "salonIdOrSlug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Salon detail.", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { salon: { $ref: "#/components/schemas/Salon" } } } } } } } }, "404": { description: "Salon not found." } },
      },
    },
    "/api/v1/salons/{salonId}/services": {
      get: {
        tags: ["Salons"], summary: "List active salon services", operationId: "listSalonServices",
        parameters: [{ name: "salonId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Active services.", content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceList" } } } } },
      },
    },
    "/api/v1/salons/{salonId}/availability": {
      get: {
        tags: ["Availability"], summary: "Get available appointment times", operationId: "getSalonAvailability",
        parameters: [
          { name: "salonId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "serviceId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
          { name: "date", in: "query", required: true, description: "Salon-local calendar date.", schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "Available start times as ISO 8601 UTC timestamps.", content: { "application/json": { schema: { $ref: "#/components/schemas/AvailabilityResponse" } } } },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/v1/bookings": {
      post: {
        tags: ["Bookings"], summary: "Create a customer reservation", operationId: "createBooking", security: [{ accessCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BookingCreate" } } } },
        responses: {
          "201": { description: "Reservation created.", content: { "application/json": { schema: { $ref: "#/components/schemas/BookingResponse" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { description: "Customer role required.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Salon not found.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "The selected time is no longer available.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/v1/platform/salons": {
      get: {
        tags: ["Platform administration"], summary: "List all salons", operationId: "listPlatformSalons", security: [{ accessCookie: [] }],
        responses: { "200": { description: "All salons.", content: { "application/json": { schema: { $ref: "#/components/schemas/SalonList" } } } }, "403": { description: "Platform administrator role required." } },
      },
      post: {
        tags: ["Platform administration"], summary: "Create a salon", operationId: "createPlatformSalon", security: [{ accessCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SalonCreate" } } } },
        responses: { "201": { description: "Salon created." }, "403": { description: "Platform administrator role required." }, "409": { $ref: "#/components/responses/Conflict" }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/platform/salons/{salonId}": {
      delete: {
        tags: ["Platform administration"], summary: "Delete a salon without booking history", operationId: "deletePlatformSalon", security: [{ accessCookie: [] }],
        parameters: [{ name: "salonId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Salon deleted." }, "403": { description: "Platform administrator role required." }, "404": { description: "Salon not found." }, "409": { description: "Salon has booking history and cannot be deleted." }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/platform/salons/{salonId}/admins": {
      post: {
        tags: ["Platform administration"], summary: "Assign a salon administrator by phone", operationId: "assignSalonAdministrator", security: [{ accessCookie: [] }],
        parameters: [{ name: "salonId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phone"], properties: { phone: { type: "string" } }, additionalProperties: false } } } },
        responses: { "201": { description: "Administrator assigned." }, "403": { description: "Platform administrator role required." }, "404": { description: "Salon or eligible administrator not found." }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/admin/salon": {
      get: { tags: ["Salon administration"], summary: "Get the managed salon", operationId: "getManagedSalon", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }], responses: { "200": { description: "Managed salon." }, "403": { description: "Role or assignment denied." } } },
      patch: { tags: ["Salon administration"], summary: "Update the managed salon", operationId: "updateManagedSalon", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SalonUpdate" } } } }, responses: { "200": { description: "Salon updated." }, "403": { description: "Role or assignment denied." }, "422": { $ref: "#/components/responses/ValidationError" } } },
    },
    "/api/v1/admin/services": {
      get: { tags: ["Salon administration"], summary: "List managed services", operationId: "listManagedServices", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }], responses: { "200": { description: "All managed services.", content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceList" } } } } } },
      post: { tags: ["Salon administration"], summary: "Create a service", operationId: "createService", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceWrite" } } } }, responses: { "201": { description: "Service created." }, "409": { $ref: "#/components/responses/Conflict" }, "422": { $ref: "#/components/responses/ValidationError" } } },
    },
    "/api/v1/admin/bookings": {
      get: {
        tags: ["Salon administration"], summary: "List reservations for the assigned salon", operationId: "listManagedBookings", security: [{ accessCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/AdminSalonId" }],
        responses: { "200": { description: "Assigned-salon reservations with customer contact details." }, "403": { description: "Role or salon assignment denied." } },
      },
    },
    "/api/v1/admin/schedule/weekly": {
      get: {
        tags: ["Salon administration"], summary: "Get weekly working hours", operationId: "getWeeklySchedule", security: [{ accessCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/AdminSalonId" }],
        responses: { "200": { description: "Weekly working periods.", content: { "application/json": { schema: { $ref: "#/components/schemas/WeeklyScheduleResponse" } } } }, "403": { description: "Role or assignment denied." } },
      },
      put: {
        tags: ["Salon administration"], summary: "Replace weekly working hours", operationId: "replaceWeeklySchedule", security: [{ accessCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/AdminSalonId" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WeeklyScheduleWrite" } } } },
        responses: { "200": { description: "Weekly schedule replaced.", content: { "application/json": { schema: { $ref: "#/components/schemas/WeeklyScheduleResponse" } } } }, "403": { description: "Role or assignment denied." }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/admin/services/{serviceId}": {
      patch: { tags: ["Salon administration"], summary: "Update a service", operationId: "updateService", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }, { name: "serviceId", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceWrite" } } } }, responses: { "200": { description: "Service updated." }, "404": { description: "Service not found." } } },
      delete: { tags: ["Salon administration"], summary: "Deactivate a service", operationId: "deactivateService", security: [{ accessCookie: [] }], parameters: [{ $ref: "#/components/parameters/AdminSalonId" }, { name: "serviceId", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "204": { description: "Service deactivated." }, "404": { description: "Service not found." } } },
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
    parameters: {
      AdminSalonId: { name: "salonId", in: "query", required: false, description: "Required only for platform administrators.", schema: { type: "string", format: "uuid" } },
    },
    securitySchemes: {
      accessCookie: { type: "apiKey", in: "cookie", name: "salon_access" },
      refreshCookie: { type: "apiKey", in: "cookie", name: "salon_refresh" },
    },
    responses: {
      Unauthorized: { description: "Authentication failed.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      Conflict: { description: "The email or phone number is already registered.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      ValidationError: { description: "The request body is invalid.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
    schemas: {
      User: {
        type: "object", additionalProperties: false,
        required: ["id", "email", "firstName", "lastName", "phone", "profileImageUrl", "role"],
        properties: {
          id: { type: "string", format: "uuid" }, email: { type: ["string", "null"], format: "email" },
          firstName: { type: "string" }, lastName: { type: "string" },
          phone: { type: ["string", "null"] }, profileImageUrl: { type: ["string", "null"], format: "uri" },
          role: { type: "string", enum: ["CUSTOMER", "SALON_ADMIN", "SUPER_ADMIN"] },
        },
      },
      ProfileUpdate: { type: "object", additionalProperties: false, minProperties: 1, properties: { firstName: { type: "string", maxLength: 80 }, lastName: { type: "string", maxLength: 80 }, phone: { type: ["string", "null"], maxLength: 30 }, profileImageUrl: { type: ["string", "null"], format: "uri" } } },
      Salon: { type: "object", required: ["id", "slug", "name", "audience", "city", "countryCode", "timezone", "isActive"], properties: { id: { type: "string", format: "uuid" }, slug: { type: "string" }, name: { type: "string" }, description: { type: "string" }, audience: { type: "string", enum: ["MEN", "WOMEN", "UNISEX"] }, streetAddress: { type: "string" }, city: { type: "string" }, region: { type: ["string", "null"] }, postalCode: { type: ["string", "null"] }, countryCode: { type: "string" }, phone: { type: ["string", "null"] }, email: { type: ["string", "null"] }, timezone: { type: "string" }, isActive: { type: "boolean" } } },
      SalonCreate: { type: "object", additionalProperties: false, required: ["slug", "name", "audience", "streetAddress"], properties: { slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 120 }, name: { type: "string", maxLength: 120 }, description: { type: "string", maxLength: 5000 }, audience: { type: "string", enum: ["MEN", "WOMEN", "UNISEX"] }, streetAddress: { type: "string", maxLength: 300 }, city: { type: "string", maxLength: 120 }, countryCode: { type: "string", pattern: "^[A-Z]{2}$" }, timezone: { type: "string", maxLength: 100 }, phone: { type: ["string", "null"], maxLength: 30 }, email: { type: ["string", "null"], format: "email" } } },
      SalonUpdate: { type: "object", additionalProperties: false, minProperties: 1, properties: { name: { type: "string" }, description: { type: "string" }, audience: { type: "string", enum: ["MEN", "WOMEN", "UNISEX"] }, streetAddress: { type: "string" }, city: { type: "string" }, region: { type: ["string", "null"] }, postalCode: { type: ["string", "null"] }, countryCode: { type: "string", pattern: "^[A-Z]{2}$" }, phone: { type: ["string", "null"] }, email: { type: ["string", "null"], format: "email" }, timezone: { type: "string" } } },
      SalonList: { type: "object", required: ["data", "nextCursor"], properties: { data: { type: "array", items: { $ref: "#/components/schemas/Salon" } }, nextCursor: { type: ["string", "null"], format: "uuid" } } },
      Service: { type: "object", required: ["id", "salonId", "name", "durationMinutes", "priceMinor", "currency", "isActive"], properties: { id: { type: "string", format: "uuid" }, salonId: { type: "string", format: "uuid" }, name: { type: "string" }, description: { type: "string" }, durationMinutes: { type: "integer" }, priceMinor: { type: "integer" }, currency: { type: "string" }, isActive: { type: "boolean" } } },
      ServiceWrite: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, description: { type: "string" }, durationMinutes: { type: "integer", minimum: 5, maximum: 720 }, priceMinor: { type: "integer", minimum: 1 }, currency: { type: "string", pattern: "^[A-Z]{3}$" }, isActive: { type: "boolean" } } },
      ServiceList: { type: "object", required: ["data", "nextCursor"], properties: { data: { type: "array", items: { $ref: "#/components/schemas/Service" } }, nextCursor: { type: ["string", "null"], format: "uuid" } } },
      AvailabilityResponse: {
        type: "object", additionalProperties: false, required: ["data"],
        properties: { data: { type: "object", additionalProperties: false, required: ["slots"], properties: { slots: { type: "array", items: { type: "string", format: "date-time" } } } } },
      },
      BookingCreate: {
        type: "object", additionalProperties: false, required: ["salonId", "serviceId", "startsAt"],
        properties: { salonId: { type: "string", format: "uuid" }, serviceId: { type: "string", format: "uuid" }, startsAt: { type: "string", format: "date-time" } },
      },
      Booking: {
        type: "object",
        required: ["id", "salonId", "serviceId", "customerId", "startsAt", "endsAt", "status", "serviceName", "durationMinutes", "priceMinor", "currency"],
        properties: {
          id: { type: "string", format: "uuid" }, salonId: { type: "string", format: "uuid" }, serviceId: { type: "string", format: "uuid" }, customerId: { type: "string", format: "uuid" },
          startsAt: { type: "string", format: "date-time" }, endsAt: { type: "string", format: "date-time" }, status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] },
          serviceName: { type: "string" }, durationMinutes: { type: "integer", minimum: 1 }, priceMinor: { type: "integer", minimum: 1 }, currency: { type: "string", pattern: "^[A-Z]{3}$" },
          customerNote: { type: ["string", "null"] }, cancellationReason: { type: ["string", "null"] }, cancelledAt: { type: ["string", "null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
        },
      },
      BookingResponse: {
        type: "object", additionalProperties: false, required: ["data"],
        properties: { data: { type: "object", additionalProperties: false, required: ["booking"], properties: { booking: { $ref: "#/components/schemas/Booking" } } } },
      },
      WeeklyPeriodWrite: {
        type: "object", additionalProperties: false, required: ["dayOfWeek", "opensAt", "closesAt"],
        properties: { dayOfWeek: { type: "integer", minimum: 0, maximum: 6 }, opensAt: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, closesAt: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" } },
      },
      WeeklyScheduleWrite: { type: "object", additionalProperties: false, required: ["periods"], properties: { periods: { type: "array", items: { $ref: "#/components/schemas/WeeklyPeriodWrite" } } } },
      WeeklyPeriod: {
        allOf: [{ $ref: "#/components/schemas/WeeklyPeriodWrite" }, { type: "object", required: ["id", "salonId", "isActive"], properties: { id: { type: "string", format: "uuid" }, salonId: { type: "string", format: "uuid" }, isActive: { type: "boolean" } } }],
      },
      WeeklyScheduleResponse: { type: "object", required: ["data"], properties: { data: { type: "object", required: ["periods"], properties: { periods: { type: "array", items: { $ref: "#/components/schemas/WeeklyPeriod" } } } } } },
      AuthResponse: {
        type: "object", additionalProperties: false, required: ["data"],
        properties: { data: { type: "object", additionalProperties: false, required: ["user"], properties: { user: { $ref: "#/components/schemas/User" } } } },
      },
      LoginRequest: {
        type: "object", additionalProperties: false, required: ["phone", "password"],
        properties: { phone: { type: "string", pattern: "^\\+?[0-9]{7,15}$" }, password: { type: "string", format: "password" } },
      },
      RegisterRequest: {
        allOf: [
          { $ref: "#/components/schemas/LoginRequest" },
          { type: "object", additionalProperties: false, required: ["firstName", "lastName"], properties: { firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string", format: "email" } } },
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
