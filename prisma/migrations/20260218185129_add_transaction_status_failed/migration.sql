-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'FAILED';

ALTER TABLE "Transaction"
DROP CONSTRAINT "transaction_no_overlap";

ALTER TABLE "Transaction"
ADD CONSTRAINT "transaction_no_overlap"
EXCLUDE USING gist (
  "productId" WITH =,
  "reservedTime" WITH &&
)
WHERE (status = 'PAID');