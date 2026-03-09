-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'EVENT');

-- AlterTable
ALTER TABLE "ContractMessage" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';
