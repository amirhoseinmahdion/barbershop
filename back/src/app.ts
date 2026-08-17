import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

export interface AppOptions {
  frontendOrigin: string;
  readinessCheck: () => Promise<void>;
}

export function createApp({ frontendOrigin, readinessCheck }: AppOptions): Express {
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

  app.use((_request: Request, response: Response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
      },
    });
  });

  return app;
}
