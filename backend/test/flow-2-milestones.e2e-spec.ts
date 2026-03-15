import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './jest-e2e-setup';
import {
  setupContractScenario, getContract,
  startMilestone, submitMilestone, approveMilestone, requestRevision,
} from './helpers';

describe('Flow 2 — Complete Milestone Cycle', () => {
  let app: INestApplication;
  let companyToken: string;
  let devToken: string;
  let contractId: string;
  let milestones: Array<{ id: string; title: string; status: string }>;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);

    // Setup: company + project + developer + proposal + contract with 5 milestones
    const scenario = await setupContractScenario(app);
    companyToken = scenario.company.access_token;
    devToken = scenario.developer.access_token;
    contractId = scenario.contract.id;
    milestones = scenario.contract.milestones;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Milestone 1: normal flow (start → submit → approve) ─────────────

  it('should start milestone 1', async () => {
    await startMilestone(app, devToken, contractId, milestones[0].id);

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[0].status).toBe('IN_PROGRESS');
  });

  it('should not allow company to start a milestone', async () => {
    await request(app.getHttpServer())
      .patch(`/api/contracts/${contractId}/milestones/${milestones[1].id}/start`)
      .set('Authorization', `Bearer ${companyToken}`)
      .expect(403);
  });

  it('should submit milestone 1 with delivery', async () => {
    await submitMilestone(app, devToken, contractId, milestones[0].id, {
      deliveryNote: 'Design completed',
      deliveryLink: 'https://figma.com/design-v1',
    });

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[0].status).toBe('SUBMITTED');
  });

  it('should approve milestone 1 (→ PAID)', async () => {
    await approveMilestone(app, companyToken, contractId, milestones[0].id);

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[0].status).toBe('PAID');
    // Contract should still be ACTIVE (not all milestones paid)
    expect(contract.status).toBe('ACTIVE');
  });

  // ─── Milestone 2: revision flow (start → submit → revision → resubmit → approve)

  it('should start and submit milestone 2', async () => {
    await startMilestone(app, devToken, contractId, milestones[1].id);
    await submitMilestone(app, devToken, contractId, milestones[1].id);

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[1].status).toBe('SUBMITTED');
  });

  it('should request revision of milestone 2', async () => {
    await requestRevision(app, companyToken, contractId, milestones[1].id, 'The color scheme needs adjustment');

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[1].status).toBe('REVISION_REQUESTED');
  });

  it('should not allow approving a milestone in REVISION_REQUESTED state', async () => {
    await request(app.getHttpServer())
      .patch(`/api/contracts/${contractId}/milestones/${milestones[1].id}/approve`)
      .set('Authorization', `Bearer ${companyToken}`)
      .expect(400);
  });

  it('should resubmit milestone 2 after revision', async () => {
    await submitMilestone(app, devToken, contractId, milestones[1].id, {
      deliveryNote: 'Colors updated',
      deliveryLink: 'https://figma.com/design-v2',
    });

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[1].status).toBe('SUBMITTED');
  });

  it('should approve milestone 2 after resubmission', async () => {
    await approveMilestone(app, companyToken, contractId, milestones[1].id);

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.milestones[1].status).toBe('PAID');
  });

  // ─── Milestones 3, 4, 5: fast-forward to completion ──────────────────

  it('should complete milestones 3, 4, 5 and auto-complete the contract', async () => {
    for (const ms of milestones.slice(2)) {
      await startMilestone(app, devToken, contractId, ms.id);
      await submitMilestone(app, devToken, contractId, ms.id);
      await approveMilestone(app, companyToken, contractId, ms.id);
    }

    const contract = await getContract(app, companyToken, contractId);
    expect(contract.status).toBe('COMPLETED');

    contract.milestones.forEach((m) => {
      expect(m.status).toBe('PAID');
    });
  });

  it('should have moved the project to COMPLETED', async () => {
    const contract = await getContract(app, companyToken, contractId);
    const projectId = (contract.project as any)?.id ?? (contract as any).projectId;

    const res = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');
  });

  // ─── Review after completion ──────────────────────────────────────────

  it('should allow company to review the developer', async () => {
    await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/review`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ rating: 5, comment: 'Excellent work!' })
      .expect(201);
  });

  it('should allow developer to review the company', async () => {
    await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/review`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ rating: 4, comment: 'Good communication' })
      .expect(201);
  });

  it('should not allow duplicate reviews', async () => {
    await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/review`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ rating: 3, comment: 'Trying again' })
      .expect(500);
  });
});
