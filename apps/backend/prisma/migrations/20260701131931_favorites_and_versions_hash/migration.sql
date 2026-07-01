-- Add versionsHash as nullable first so we can backfill before enforcing NOT NULL.
ALTER TABLE "Comparison" ADD COLUMN "versionsHash" TEXT;

-- pgcrypto provides digest() for SHA-1 hashing. IF NOT EXISTS keeps the
-- migration idempotent across environments that already have the extension.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backfill versionsHash from sorted versionIds of each Comparison's items.
-- ORDER BY inside string_agg guarantees a deterministic hash regardless of
-- ComparisonItem insertion order; matches the Node fallback (which sorts
-- explicitly) so both paths produce identical hashes.
UPDATE "Comparison" c
SET "versionsHash" = encode(digest(
  COALESCE(
    (SELECT string_agg(ci."versionId", ',' ORDER BY ci."versionId")
     FROM "ComparisonItem" ci WHERE ci."comparisonId" = c.id),
    ''
  ),
  'sha1'
), 'hex')
WHERE c."versionsHash" IS NULL;

-- Promote versionsHash to NOT NULL now that every row has a value.
ALTER TABLE "Comparison" ALTER COLUMN "versionsHash" SET NOT NULL;

-- Enforce uniqueness of (userId, versionsHash) so the same set of versions
-- cannot be saved twice for the same user.
CREATE UNIQUE INDEX "Comparison_userId_versionsHash_key" ON "Comparison"("userId", "versionsHash");

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_modelId_key" ON "Favorite"("userId", "modelId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
