import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Bootstrap a full NestJS app for e2e testing.
 * Uses the real AppModule — no mocking.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  // Apply the same global pipes as main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.init();
  return app;
}

/**
 * Truncate all tables in the test database.
 * Called before each test suite to ensure a clean state.
 * Uses TRUNCATE CASCADE which is fast and handles FK constraints.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Review",
      "ContractMessage",
      "Notification",
      "Milestone",
      "Contract",
      "Proposal",
      "Project",
      "Developer",
      "Company",
      "User"
    CASCADE
  `);
}
