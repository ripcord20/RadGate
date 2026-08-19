import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('v1');

  /*
   * `credentials: true` wajib karena refresh token dikirim sebagai cookie HttpOnly.
   * Konsekuensinya origin tidak boleh wildcard, jadi daftarnya dibaca dari konfigurasi.
   */
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173').split(','),
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port);

  new Logger('Bootstrap').log(`RadGate API berjalan di http://localhost:${port}/v1`);
}

void bootstrap();
