-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "name" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "address" SET DEFAULT '';
