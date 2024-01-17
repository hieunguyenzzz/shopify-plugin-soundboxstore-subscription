-- CreateTable
CREATE TABLE "RentingOptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "percent" INTEGER,
    "months" INTEGER
);
