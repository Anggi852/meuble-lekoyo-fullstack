import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import apiV1Routes from './routes/apiV1.js';
import { openApiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Agar req.ip akurat untuk rate-limiter saat di-deploy di Render/proxy
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // izinkan preview domain free-tier saat Capstone demo
      },
      credentials: true,
    }),
  );

  // Limit 12mb agar upload multi-foto terkompresi dari dashboard admin berjalan mulus
  app.use(express.json({ limit: '12mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/', (_req, res) => {
    res.json({
      service: "Meuble Le'Koyo Backend API",
      version: '1.0.0',
      docs: '/api-docs',
      health: '/api/v1/health',
    });
  });

  // Dokumentasi interaktif Swagger / OpenAPI
  app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "Swagger API — Meuble Le'Koyo",
    }),
  );

  // REST API v1
  app.use('/api/v1', apiV1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const defaultApp = createApp();
export default defaultApp;