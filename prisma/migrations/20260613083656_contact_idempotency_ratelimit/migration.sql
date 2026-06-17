/*
  Warnings:

  - A unique constraint covering the columns `[requestId]` on the table `ContactMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "requestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ContactMessage_requestId_key" ON "ContactMessage"("requestId");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_ipHash_idx" ON "ContactMessage"("createdAt", "ipHash");
