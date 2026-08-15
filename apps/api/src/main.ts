import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS: localhost + deployed frontend dono allow karo
  const frontendUrl = (configService.get('FRONTEND_URL') as string) || '';

  const allowedOrigins = ['http://localhost:3000'];

  if (frontendUrl) {
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    if (!allowedOrigins.includes(cleanUrl)) {
      allowedOrigins.push(cleanUrl);
    }
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = parseInt((configService.get('PORT') as string) || '4000', 10);
  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
