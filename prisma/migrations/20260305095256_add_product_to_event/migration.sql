/*
  Warnings:

  - Added the required column `productId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "productId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- No overlapping
ALTER TABLE "Event"
ADD CONSTRAINT "event_no_overlap"
EXCLUDE USING gist (
  "productId" WITH =,
  "timeRange" WITH &&
)