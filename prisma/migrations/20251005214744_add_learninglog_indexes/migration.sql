-- CreateTable
CREATE TABLE "LearningLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reflection" TEXT NOT NULL,
    "tags" TEXT[],
    "timeSpent" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningLog_createdAt_id_idx" ON "LearningLog"("createdAt", "id");

-- CreateIndex
CREATE INDEX "LearningLog_title_idx" ON "LearningLog"("title");

-- CreateIndex
CREATE INDEX "LearningLog_reflection_idx" ON "LearningLog"("reflection");
