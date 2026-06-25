-- CreateTable
CREATE TABLE "Rehearsal" (
    "key" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rehearsal_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Rehearsal_nodeId_idx" ON "Rehearsal"("nodeId");
