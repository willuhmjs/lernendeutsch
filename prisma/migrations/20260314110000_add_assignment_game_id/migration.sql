-- Add optional gameId to Assignment for quiz-mode assignments
ALTER TABLE "Assignment" ADD COLUMN "gameId" TEXT;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_gameId_fkey" 
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
