-- CreateTable
CREATE TABLE "Dataset" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL,
    "columnCount" INTEGER NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "trustScore" DOUBLE PRECISION,
    "duplicateRowCount" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Column" (
    "id" SERIAL NOT NULL,
    "datasetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "inferredType" TEXT NOT NULL,
    "sensitivityTag" TEXT NOT NULL DEFAULT 'none',
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "missingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invalidCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
