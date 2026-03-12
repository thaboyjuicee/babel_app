CREATE TABLE "Token" (
    "id" TEXT PRIMARY KEY,
    "mint" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Token_createdAt_idx" ON "Token"("createdAt");

CREATE TABLE "TokenSnapshot" (
    "id" TEXT PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "tradeCount" INTEGER NOT NULL,
    "buyerCount" INTEGER NOT NULL,
    "feeValue" DOUBLE PRECISION NOT NULL,
    "rawData" JSONB,
    CONSTRAINT "TokenSnapshot_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE
);

CREATE INDEX "TokenSnapshot_tokenId_capturedAt_idx" ON "TokenSnapshot"("tokenId", "capturedAt");

CREATE TABLE "TokenRanking" (
    "id" TEXT PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "babelScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "rankDelta" INTEGER NOT NULL,
    "momentumLabel" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TokenRanking_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE
);

CREATE INDEX "TokenRanking_bucket_rank_idx" ON "TokenRanking"("bucket", "rank");
CREATE INDEX "TokenRanking_tokenId_computedAt_idx" ON "TokenRanking"("tokenId", "computedAt");
