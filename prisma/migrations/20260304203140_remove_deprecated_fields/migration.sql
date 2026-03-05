/*
  Warnings:

  - You are about to drop the column `cefrLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hasOnboarded` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cefrLevel",
DROP COLUMN "hasOnboarded";
