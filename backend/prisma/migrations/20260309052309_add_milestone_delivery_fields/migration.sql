-- AlterEnum
ALTER TYPE "MilestoneStatus" ADD VALUE 'REVISION_REQUESTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MILESTONE_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'MILESTONE_REVISION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'MILESTONE_PAID';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_COMPLETED';

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "deliveryLink" TEXT,
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);
