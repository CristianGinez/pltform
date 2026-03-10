-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSE_MILESTONE_PLAN';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "disputeResolvedComment" TEXT;

-- AlterTable
ALTER TABLE "Developer" ADD COLUMN     "disputeLosses" INTEGER NOT NULL DEFAULT 0;
