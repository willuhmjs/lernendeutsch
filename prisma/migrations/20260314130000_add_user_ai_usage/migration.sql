-- CreateTable
CREATE TABLE "UserAiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "goodWillTokens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserAiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAiUsage_userId_date_idx" ON "UserAiUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserAiUsage_userId_date_key" ON "UserAiUsage"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserAiUsage" ADD CONSTRAINT "UserAiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
