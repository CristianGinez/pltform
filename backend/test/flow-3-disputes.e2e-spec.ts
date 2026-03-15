import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './jest-e2e-setup';
import {
  setupContractScenario, registerAdmin, getContract,
  startMilestone, submitMilestone,
} from './helpers';

describe('Flow 3 — Dispute System', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 3a: Dispute resolved in favor of developer ─────────────────────

  describe('Outcome: dev_wins', () => {
    let companyToken: string;
    let devToken: string;
    let contractId: string;
    let milestones: Array<{ id: string }>;
    let adminToken: string;

    beforeAll(async () => {
      await cleanDatabase(app);

      const scenario = await setupContractScenario(app);
      companyToken = scenario.company.access_token;
      devToken = scenario.developer.access_token;
      contractId = scenario.contract.id;
      milestones = scenario.contract.milestones;

      const admin = await registerAdmin(app);
      adminToken = admin.access_token;

      // Developer starts and submits milestone 1
      await startMilestone(app, devToken, contractId, milestones[0].id);
      await submitMilestone(app, devToken, contractId, milestones[0].id);
    });

    it('should not allow opening a dispute without reason', async () => {
      await request(app.getHttpServer())
        .post(`/api/contracts/${contractId}/dispute`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ reason: 'short' })
        .expect(400);
    });

    it('should open a dispute', async () => {
      await request(app.getHttpServer())
        .post(`/api/contracts/${contractId}/dispute`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ reason: 'Company is not responding to submitted milestones for weeks' })
        .expect(201);

      const contract = await getContract(app, companyToken, contractId);
      expect(contract.status).toBe('DISPUTED');
    });

    it('should show the dispute in admin list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/contracts/disputed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((c: { id: string }) => c.id === contractId);
      expect(found).toBeDefined();
    });

    it('should not allow non-admin to resolve dispute', async () => {
      await request(app.getHttpServer())
        .patch(`/api/contracts/${contractId}/resolve`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ outcome: 'dev_wins' })
        .expect(403);
    });

    it('should resolve dispute in favor of developer', async () => {
      await request(app.getHttpServer())
        .patch(`/api/contracts/${contractId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'dev_wins', adminComment: 'Company failed to respond within 7 days' })
        .expect(200);

      const contract = await getContract(app, companyToken, contractId);

      // Submitted milestone should now be PAID
      expect(contract.milestones[0].status).toBe('PAID');

      // Contract should be ACTIVE (not all milestones paid) or COMPLETED
      expect(['ACTIVE', 'COMPLETED']).toContain(contract.status);
    });
  });

  // ─── 3b: Dispute resolved in favor of company ────────────────────────

  describe('Outcome: company_wins', () => {
    let companyToken: string;
    let devToken: string;
    let contractId: string;
    let milestones: Array<{ id: string }>;
    let adminToken: string;

    beforeAll(async () => {
      await cleanDatabase(app);

      const scenario = await setupContractScenario(app);
      companyToken = scenario.company.access_token;
      devToken = scenario.developer.access_token;
      contractId = scenario.contract.id;
      milestones = scenario.contract.milestones;

      const admin = await registerAdmin(app);
      adminToken = admin.access_token;

      // Start milestone but don't submit — company opens dispute
      await startMilestone(app, devToken, contractId, milestones[0].id);
    });

    it('should open dispute by company', async () => {
      await request(app.getHttpServer())
        .post(`/api/contracts/${contractId}/dispute`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ reason: 'Developer has been unresponsive for 3 weeks and missed all deadlines' })
        .expect(201);
    });

    it('should resolve dispute in favor of company', async () => {
      await request(app.getHttpServer())
        .patch(`/api/contracts/${contractId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'company_wins', adminComment: 'Developer was unresponsive' })
        .expect(200);

      const contract = await getContract(app, companyToken, contractId);
      expect(contract.status).toBe('CANCELLED');
    });
  });

  // ─── 3c: Dispute resolved by mutual cancellation ─────────────────────

  describe('Outcome: mutual', () => {
    let companyToken: string;
    let contractId: string;
    let adminToken: string;

    beforeAll(async () => {
      await cleanDatabase(app);

      const scenario = await setupContractScenario(app);
      companyToken = scenario.company.access_token;
      contractId = scenario.contract.id;

      const admin = await registerAdmin(app);
      adminToken = admin.access_token;
    });

    it('should open and resolve as mutual cancellation', async () => {
      await request(app.getHttpServer())
        .post(`/api/contracts/${contractId}/dispute`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ reason: 'Project requirements have changed significantly, no longer need this' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/contracts/${contractId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'mutual', adminComment: 'Both parties agree to cancel' })
        .expect(200);

      const contract = await getContract(app, companyToken, contractId);
      expect(contract.status).toBe('CANCELLED');
    });
  });
});
