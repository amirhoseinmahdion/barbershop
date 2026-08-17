import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import type { Environment } from "./config/env.js";
import type { DatabaseConnection } from "./database/client.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createAdminSalonRouter, createProfileRouter, createPublicSalonRouter } from "./modules/salons/salon.routes.js";
import { openApiDocument } from "./openapi.js";
import { AppError } from "./shared/errors/app-error.js";

export interface AppOptions {
  frontendOrigin: string;
  readinessCheck: () => Promise<void>;
  database?: DatabaseConnection["database"];
  environment?: Environment;
}

export function createApp({ frontendOrigin, readinessCheck, database, environment }: AppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        callback(null, requestOrigin === undefined || requestOrigin === frontendOrigin);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api-docs.json", (_request: Request, response: Response) => {
    response.status(200).json(openApiDocument);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Hair Salon Platform API",
      swaggerOptions: {
        displayRequestDuration: true,
        persistAuthorization: true,
      },
    }),
  );

  app.get("/health/live", (_request: Request, response: Response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/ready", async (_request: Request, response: Response) => {
    try {
      await readinessCheck();
      response.status(200).json({ status: "ready", database: "connected" });
    } catch {
      response.status(503).json({ status: "not_ready", database: "unavailable" });
    }
  });

  if (database && environment) {
    app.use("/api/v1", (request, _response, next) => {
      const origin = request.get("origin");
      if (request.method !== "GET" && origin && origin !== frontendOrigin) {
        return next(new AppError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed."));
      }
      next();
    });
    app.use("/api/v1/auth", createAuthRouter(database, environment));
    app.use("/api/v1/users", createProfileRouter(database, environment));
    app.use("/api/v1/admin", createAdminSalonRouter(database, environment));
    app.use("/api/v1/salons", createPublicSalonRouter(database));
  }

  app.use((_request: Request, response: Response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
      },
    });
  });

  app.use((error: unknown, _request: Request, response: Response, next: express.NextFunction) => {
    void next;
    if (error instanceof ZodError) {
      response.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted data is invalid.",
          details: error.flatten(),
        },
      });
      return;
    }
    if (error instanceof AppError) {
      response.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }
    const databaseError = error as { code?: string; cause?: { code?: string } };
    const databaseCode = databaseError?.code ?? databaseError?.cause?.code;
    if (databaseCode === "23505") {
      response.status(409).json({
        error: { code: "RESOURCE_CONFLICT", message: "The resource already exists.", details: null },
      });
      return;
    }
    response.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", details: null },
    });
  });

  return app;
}
