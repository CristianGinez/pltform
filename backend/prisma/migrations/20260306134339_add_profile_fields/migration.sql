-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "clientRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "clientReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "painDescription" TEXT,
ADD COLUMN     "paymentMethods" TEXT[],
ADD COLUMN     "ruc" TEXT;

-- AlterTable
ALTER TABLE "Developer" ADD COLUMN     "cycle" TEXT,
ADD COLUMN     "ruc" TEXT,
ADD COLUMN     "specialtyBadges" TEXT[],
ADD COLUMN     "trustPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "university" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warrantyDays" INTEGER;
