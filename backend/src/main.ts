import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/' });

  const allowedOrigins = [
    'http://localhost:3000',
    /\.vercel\.app$/,
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Pltform API')
    .setDescription('API para la plataforma de conexión negocios-developers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Sync project status with contract status for any stale data
  const prisma = app.get(PrismaService);
  const stale = await prisma.contract.findMany({
    where: { status: { in: ['CANCELLED', 'COMPLETED'] }, project: { status: 'IN_PROGRESS' } },
    select: { projectId: true, status: true },
  });
  for (const c of stale) {
    await prisma.project.update({
      where: { id: c.projectId },
      data: { status: c.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED' },
    });
  }
  const logger = app.get(Logger);
  if (stale.length > 0) logger.warn(`[startup] Synced ${stale.length} project(s) to match contract status`);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`Swagger docs:    http://localhost:${port}/api/docs`);
}
bootstrap();
