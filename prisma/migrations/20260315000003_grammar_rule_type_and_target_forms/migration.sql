-- Add ruleType and targetForms to GrammarRule.
-- ruleType: snake_case category string (nullable — older rows without it still work).
-- targetForms: string array of surface forms for the lesson LLM to produce.
--   Defaults to empty array so existing rows don't need backfilling to be valid.
ALTER TABLE "GrammarRule" ADD COLUMN "ruleType" TEXT;
ALTER TABLE "GrammarRule" ADD COLUMN "targetForms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
