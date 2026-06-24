import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const app = await NestFactory.create(AppModule, {
    cors: corsOrigins?.length ? { origin: corsOrigins, credentials: true } : true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const swaggerEnabled = process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const swagger = new DocumentBuilder()
      .setTitle('DreamTwin API')
      .setDescription('AI 分身关系预演 · MVP v0.1')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, doc);
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}${swaggerEnabled ? '  ·  swagger /docs' : ''}`);
}

void bootstrap();
