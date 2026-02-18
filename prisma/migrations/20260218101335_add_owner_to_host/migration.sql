/*
  Warnings:

  - Added the required column `ownerId` to the `Host` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
