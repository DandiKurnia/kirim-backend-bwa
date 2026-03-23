/*
  Warnings:

  - You are about to drop the column `email` on the `branches` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "branches_email_key";

-- AlterTable
ALTER TABLE "branches" DROP COLUMN "email";
