-- DropForeignKey
ALTER TABLE "TokenRanking" DROP CONSTRAINT "TokenRanking_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "TokenSnapshot" DROP CONSTRAINT "TokenSnapshot_tokenId_fkey";

-- AddForeignKey
ALTER TABLE "TokenSnapshot" ADD CONSTRAINT "TokenSnapshot_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRanking" ADD CONSTRAINT "TokenRanking_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
