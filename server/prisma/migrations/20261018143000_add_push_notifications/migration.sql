-- AlterTable
ALTER TABLE "Project" ADD COLUMN "domain" TEXT;

-- CreateEnum
CREATE TYPE "PushStatus" AS ENUM ('queued', 'sending', 'retry', 'sent', 'failed');

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PushStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushNotification_projectId_requestId_key" ON "PushNotification"("projectId", "requestId");
CREATE INDEX "PushNotification_projectId_userId_createdAt_idx" ON "PushNotification"("projectId", "userId", "createdAt");
CREATE INDEX "PushNotification_status_updatedAt_idx" ON "PushNotification"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
