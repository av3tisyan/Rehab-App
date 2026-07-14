import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global input validation at the system boundary.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // CORS for the tablet/web client (tighten origins per environment).
  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix('api');

  // OpenAPI — drives the generated typed client for the web app.
  const config = new DocumentBuilder()
    .setTitle('Rehab Clinic API')
    .setDescription('Patients, episodes, encounters, assessments, and comparison reporting.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port} (docs at /api/docs)`);
}

void bootstrap();
