import { INestApplication } from '@nestjs/common';
import request from 'supertest';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthResult {
  access_token: string;
  user: { id: string; email: string; role: string };
}

interface ProjectResult {
  id: string;
  title: string;
  status: string;
}

interface ProposalResult {
  id: string;
  status: string;
  contractId?: string;
}

interface ContractResult {
  id: string;
  status: string;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    amount: number;
    order: number;
  }>;
  project?: {
    id?: string;
    title: string;
    status: string;
    company?: { userId: string };
    proposals?: Array<{ developer?: { userId: string } }>;
  };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function registerCompany(
  app: INestApplication,
  overrides?: { email?: string; name?: string; password?: string },
): Promise<AuthResult> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: overrides?.email ?? `company-${Date.now()}@test.com`,
      password: overrides?.password ?? 'TestPass123!',
      role: 'COMPANY',
      name: overrides?.name ?? 'Test Company',
    })
    .expect(201);
  return res.body;
}

export async function registerDeveloper(
  app: INestApplication,
  overrides?: { email?: string; name?: string; password?: string },
): Promise<AuthResult> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: overrides?.email ?? `dev-${Date.now()}@test.com`,
      password: overrides?.password ?? 'TestPass123!',
      role: 'DEVELOPER',
      name: overrides?.name ?? 'Test Developer',
    })
    .expect(201);
  return res.body;
}

export async function registerAdmin(
  app: INestApplication,
  overrides?: { email?: string; password?: string },
): Promise<AuthResult> {
  // Admin registration isn't exposed via API, so we create directly via Prisma
  const { PrismaService } = await import('../src/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  const bcrypt = await import('bcryptjs');

  const email = overrides?.email ?? `admin-${Date.now()}@test.com`;
  const password = overrides?.password ?? 'AdminPass123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' },
  });

  // Login to get a token
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  return res.body;
}

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);
  return res.body;
}

// ─── Project helpers ──────────────────────────────────────────────────────────

export async function createProject(
  app: INestApplication,
  token: string,
  overrides?: Partial<{
    title: string;
    description: string;
    budget: number;
    skills: string[];
    category: string;
  }>,
): Promise<ProjectResult> {
  const res = await request(app.getHttpServer())
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: overrides?.title ?? 'Test Project for E-commerce Platform',
      description: overrides?.description
        ?? 'We need a complete e-commerce solution with payment integration, inventory management, and customer dashboard. This is a detailed description that meets the minimum length requirement for project creation.',
      budget: overrides?.budget ?? 5000,
      skills: overrides?.skills ?? ['React', 'Node.js'],
      category: overrides?.category ?? 'E-commerce',
    })
    .expect(201);
  return res.body;
}

export async function publishProject(
  app: INestApplication,
  token: string,
  projectId: string,
): Promise<ProjectResult> {
  const res = await request(app.getHttpServer())
    .patch(`/api/projects/${projectId}/publish`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  return res.body;
}

// ─── Proposal helpers ─────────────────────────────────────────────────────────

export async function createProposal(
  app: INestApplication,
  token: string,
  projectId: string,
  overrides?: Partial<{ coverLetter: string; budget: number; timeline: number }>,
): Promise<ProposalResult> {
  const res = await request(app.getHttpServer())
    .post(`/api/proposals/project/${projectId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      coverLetter: overrides?.coverLetter
        ?? 'I have extensive experience building similar platforms. I have worked on multiple e-commerce projects with React and Node.js. I can deliver this within the proposed timeline with high quality.',
      budget: overrides?.budget ?? 4500,
      timeline: overrides?.timeline ?? 30,
    })
    .expect(201);
  return res.body;
}

export async function acceptProposal(
  app: INestApplication,
  token: string,
  proposalId: string,
): Promise<ProposalResult & { contractId: string }> {
  const res = await request(app.getHttpServer())
    .patch(`/api/proposals/${proposalId}/accept`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  return res.body;
}

// ─── Contract helpers ─────────────────────────────────────────────────────────

export async function getContract(
  app: INestApplication,
  token: string,
  contractId: string,
): Promise<ContractResult> {
  const res = await request(app.getHttpServer())
    .get(`/api/contracts/${contractId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  return res.body;
}

// ─── Milestone shorthand helpers ──────────────────────────────────────────────

export async function startMilestone(
  app: INestApplication,
  token: string,
  contractId: string,
  milestoneId: string,
) {
  return request(app.getHttpServer())
    .patch(`/api/contracts/${contractId}/milestones/${milestoneId}/start`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
}

export async function submitMilestone(
  app: INestApplication,
  token: string,
  contractId: string,
  milestoneId: string,
  dto?: { deliveryNote?: string; deliveryLink?: string },
) {
  return request(app.getHttpServer())
    .patch(`/api/contracts/${contractId}/milestones/${milestoneId}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .send(dto ?? { deliveryNote: 'Completed', deliveryLink: 'https://example.com/delivery' })
    .expect(200);
}

export async function approveMilestone(
  app: INestApplication,
  token: string,
  contractId: string,
  milestoneId: string,
) {
  return request(app.getHttpServer())
    .patch(`/api/contracts/${contractId}/milestones/${milestoneId}/approve`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
}

export async function requestRevision(
  app: INestApplication,
  token: string,
  contractId: string,
  milestoneId: string,
  reason?: string,
) {
  return request(app.getHttpServer())
    .patch(`/api/contracts/${contractId}/milestones/${milestoneId}/request-revision`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: reason ?? 'Needs changes to the design' })
    .expect(200);
}

// ─── Complete setup: creates company + project + developer + proposal + contract ─

export async function setupContractScenario(app: INestApplication) {
  const company = await registerCompany(app);
  const project = await createProject(app, company.access_token);
  await publishProject(app, company.access_token, project.id);

  const developer = await registerDeveloper(app);
  const proposal = await createProposal(app, developer.access_token, project.id);
  const accepted = await acceptProposal(app, company.access_token, proposal.id);

  const contract = await getContract(app, company.access_token, accepted.contractId);

  return { company, developer, project, proposal: accepted, contract };
}
