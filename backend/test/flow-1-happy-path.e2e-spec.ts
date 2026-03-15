import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './jest-e2e-setup';
import {
  registerCompany, registerDeveloper, login,
  createProject, publishProject,
  createProposal, acceptProposal, getContract,
} from './helpers';

describe('Flow 1 — Happy Path: Registration → Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── State shared across tests in this suite ───────────────────────────

  let companyToken: string;
  let companyUserId: string;
  let devToken: string;
  let projectId: string;
  let proposalId: string;
  let contractId: string;

  // ─── Registration ─────────────────────────────────────────────────────

  it('should register a company', async () => {
    const result = await registerCompany(app, {
      email: 'acme@test.com',
      name: 'Acme Corp',
    });

    expect(result.access_token).toBeDefined();
    expect(result.user.role).toBe('COMPANY');
    expect(result.user.email).toBe('acme@test.com');

    companyToken = result.access_token;
    companyUserId = result.user.id;
  });

  it('should register a developer', async () => {
    const result = await registerDeveloper(app, {
      email: 'dev@test.com',
      name: 'Juan Developer',
    });

    expect(result.access_token).toBeDefined();
    expect(result.user.role).toBe('DEVELOPER');

    devToken = result.access_token;
  });

  it('should not allow duplicate email registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'acme@test.com', password: 'TestPass123!', role: 'COMPANY', name: 'Duplicate' })
      .expect(409);
  });

  it('should login with correct credentials', async () => {
    const result = await login(app, 'acme@test.com', 'TestPass123!');
    expect(result.access_token).toBeDefined();
    expect(result.user.email).toBe('acme@test.com');
  });

  it('should reject login with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'acme@test.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('should return user profile via /auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${companyToken}`)
      .expect(200);

    expect(res.body.email).toBe('acme@test.com');
    expect(res.body.role).toBe('COMPANY');
    expect(res.body.company).toBeDefined();
    expect(res.body.company.name).toBe('Acme Corp');
  });

  // ─── Project creation ─────────────────────────────────────────────────

  it('should create a project in DRAFT status', async () => {
    const project = await createProject(app, companyToken);

    expect(project.id).toBeDefined();
    expect(project.status).toBe('DRAFT');

    projectId = project.id;
  });

  it('should not allow developer to create a project', async () => {
    await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Unauthorized Project Test',
        description: 'A very long description that should meet the minimum length requirement for project creation in the platform.',
        budget: 1000,
      })
      .expect(403);
  });

  it('should publish the project (DRAFT → OPEN)', async () => {
    const project = await publishProject(app, companyToken, projectId);
    expect(project.status).toBe('OPEN');
  });

  it('should show the project in public listing', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/projects')
      .expect(200);

    const found = res.body.find((p: { id: string }) => p.id === projectId);
    expect(found).toBeDefined();
    expect(found.status).toBe('OPEN');
  });

  // ─── Proposal ─────────────────────────────────────────────────────────

  it('should allow developer to submit a proposal', async () => {
    const proposal = await createProposal(app, devToken, projectId);

    expect(proposal.id).toBeDefined();
    expect(proposal.status).toBe('PENDING');

    proposalId = proposal.id;
  });

  it('should not allow company to submit a proposal', async () => {
    await request(app.getHttpServer())
      .post(`/api/proposals/project/${projectId}`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        coverLetter: 'I am a company not a developer. This should fail validation. Adding extra text to meet the minimum length requirement for the cover letter field.',
        budget: 4000,
        timeline: 20,
      })
      .expect(403);
  });

  it('should not allow duplicate proposal from same developer', async () => {
    await request(app.getHttpServer())
      .post(`/api/proposals/project/${projectId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        coverLetter: 'Another attempt to submit a proposal for the same project. This should be rejected as a conflict because a proposal already exists from this developer.',
        budget: 4000,
        timeline: 20,
      })
      .expect(409);
  });

  // ─── Accept proposal → Contract creation ──────────────────────────────

  it('should accept the proposal and create a contract', async () => {
    const result = await acceptProposal(app, companyToken, proposalId);

    expect(result.status).toBe('ACCEPTED');
    expect(result.contractId).toBeDefined();

    contractId = result.contractId;
  });

  it('should have created a contract with 5 milestones', async () => {
    const contract = await getContract(app, companyToken, contractId);

    expect(contract.status).toBe('ACTIVE');
    expect(contract.milestones).toHaveLength(5);

    // Milestones should be ordered and all PENDING
    contract.milestones.forEach((m, i) => {
      expect(m.order).toBe(i + 1);
      expect(m.status).toBe('PENDING');
    });

    // Milestone amounts should sum to the proposal budget (4500)
    const totalAmount = contract.milestones.reduce((sum, m) => sum + Number(m.amount), 0);
    expect(totalAmount).toBe(4500);
  });

  it('should have moved the project to IN_PROGRESS', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('should have generated notifications', async () => {
    // Developer should have received PROPOSAL_ACCEPTED notification
    const devNotifs = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${devToken}`)
      .expect(200);

    const acceptedNotif = devNotifs.body.find(
      (n: { type: string }) => n.type === 'PROPOSAL_ACCEPTED',
    );
    expect(acceptedNotif).toBeDefined();
  });
});
