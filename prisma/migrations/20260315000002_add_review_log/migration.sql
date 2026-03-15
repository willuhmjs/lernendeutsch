-- CreateTable: ReviewLog
-- Stores one row per FSRS review event for the weight optimizer.
-- Automatically pruned to a 30-day rolling window by the maintenance
-- job in src/lib/server/maintenance.ts (fired on user traffic in hooks.server.ts).
CREATE TABLE "ReviewLog" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "itemId"        TEXT NOT NULL,
    "itemType"      TEXT NOT NULL,
    "rating"        INTEGER NOT NULL,
    "elapsedDays"   DOUBLE PRECISION NOT NULL,
    "scheduledDays" DOUBLE PRECISION NOT NULL,
    "stability"     DOUBLE PRECISION NOT NULL,
    "difficulty"    DOUBLE PRECISION NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- Index for per-user queries (optimizer reads by userId)
CREATE INDEX "ReviewLog_userId_createdAt_idx" ON "ReviewLog"("userId", "createdAt");

-- Index for bulk pruning by date
CREATE INDEX "ReviewLog_createdAt_idx" ON "ReviewLog"("createdAt");

-- Foreign key
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
