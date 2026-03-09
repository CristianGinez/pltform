-- CreateTable
CREATE TABLE "ContractMessage" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractMessage_contractId_createdAt_idx" ON "ContractMessage"("contractId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContractMessage" ADD CONSTRAINT "ContractMessage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractMessage" ADD CONSTRAINT "ContractMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
