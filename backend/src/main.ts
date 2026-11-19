import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix: all routes start with /api (e.g. /api/auth, /api/health)
  app.setGlobalPrefix('api');

  // Use cookie-parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // Input validation & sanitation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configured for cross-domain frontend (GitHub Pages / Localhost)
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. server-to-server, curl, healthcheck)
      if (!origin) return callback(null, true);

      // Check against explicit allowed origins whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development mode, allow standard localhost addresses
      if (!isProduction) {
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
      }

      // In production, strictly reject any origin not explicitly whitelisted
      return callback(
        new Error(`CORS blocked: Origin "${origin}" is not permitted by CORS policy.`),
        false,
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Refresh-Token'],
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`Backend server is running on: http://localhost:${port}/api`);
}

// Start application
await bootstrap();

