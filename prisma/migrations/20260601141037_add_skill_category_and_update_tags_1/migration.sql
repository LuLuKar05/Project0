/*
  Warnings:

  - You are about to drop the column `description` on the `Skill` table. All the data in the column will be lost.

*/
-- AlterTable
 -- Clear existing test rows so we can safely add NOT NULL columns
 DELETE FROM "ContactMessage";

 -- Drop old columns
 ALTER TABLE "ContactMessage" DROP COLUMN "firstName";
 ALTER TABLE "ContactMessage" DROP COLUMN "lastName";

 -- Add new required columns
 ALTER TABLE "ContactMessage" ADD COLUMN "name" TEXT NOT NULL;
 ALTER TABLE "ContactMessage" ADD COLUMN "org"  TEXT NOT NULL;
 ALTER TABLE "ContactMessage" ADD COLUMN "type" TEXT NOT NULL;
