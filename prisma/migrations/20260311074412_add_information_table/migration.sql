-- CreateTable
CREATE TABLE "Information" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "hostId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationDetail" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "informationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "InformationDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Information" ADD CONSTRAINT "Information_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationDetail" ADD CONSTRAINT "InformationDetail_informationId_fkey" FOREIGN KEY ("informationId") REFERENCES "Information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
