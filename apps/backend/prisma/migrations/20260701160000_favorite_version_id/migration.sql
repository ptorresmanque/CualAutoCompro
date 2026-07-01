-- Add Favorite.versionId to scope favorites to a specific version.

-- Step 1: add the column nullable so the existing rows survive.
ALTER TABLE "Favorite" ADD COLUMN "versionId" TEXT;

-- Step 2: backfill each existing favorite with the cheapest version of its model
-- (matches the convention used by ModelsService: versions ordered by priceClp asc).
UPDATE "Favorite" f
SET "versionId" = sub.vid
FROM (
  SELECT DISTINCT ON (f2.id) f2.id AS fid, v.id AS vid
  FROM "Favorite" f2
  JOIN "Version" v ON v."modelId" = f2."modelId"
  WHERE f2."versionId" IS NULL
  ORDER BY f2.id, v."priceClp" ASC
) sub
WHERE f.id = sub.fid;

-- Step 3: if any favorite still has a null versionId (model with zero versions),
-- delete it. Unreachable in practice but defensive.
DELETE FROM "Favorite" WHERE "versionId" IS NULL;

-- Step 4: promote to NOT NULL.
ALTER TABLE "Favorite" ALTER COLUMN "versionId" SET NOT NULL;

-- Step 5: replace the old uniqueness scope. The previous @@unique([userId, modelId])
-- is being replaced by @@unique([userId, versionId]). Prisma will emit both
-- the DROP and the CREATE UNIQUE INDEX in the next migration step, but we
-- do it explicitly here to keep the order deterministic.
DROP INDEX IF EXISTS "Favorite_userId_modelId_key";
CREATE UNIQUE INDEX "Favorite_userId_versionId_key" ON "Favorite"("userId", "versionId");
CREATE INDEX "Favorite_modelId_idx" ON "Favorite"("modelId");

-- Step 6: add the FK from Favorite.versionId to Version.id (Cascade).
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_versionId_fkey"
  FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;