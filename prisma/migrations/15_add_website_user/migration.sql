-- CreateTable
CREATE TABLE "website_user" (
    "website_user_id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "website_user_pkey" PRIMARY KEY ("website_user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_user_website_user_id_key" ON "website_user"("website_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_website_id_user_id_key" ON "website_user"("website_id", "user_id");

-- CreateIndex
CREATE INDEX "website_user_website_id_idx" ON "website_user"("website_id");

-- CreateIndex
CREATE INDEX "website_user_user_id_idx" ON "website_user"("user_id");

-- Backfill direct website access from legacy team-owned websites.
INSERT INTO "website_user" ("website_user_id", "website_id", "user_id", "created_at", "updated_at")
SELECT gen_random_uuid(), w."website_id", tu."user_id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "website" w
JOIN "team_user" tu ON tu."team_id" = w."team_id"
WHERE w."team_id" IS NOT NULL
  AND w."deleted_at" IS NULL
  AND w."created_by" IS DISTINCT FROM tu."user_id"
ON CONFLICT ("website_id", "user_id") DO NOTHING;

-- Give legacy team-owned websites a direct owner so they remain visible without teams.
UPDATE "website" w
SET "user_id" = COALESCE(
    w."created_by",
    (
      SELECT tu."user_id"
      FROM "team_user" tu
      WHERE tu."team_id" = w."team_id"
        AND tu."role" = 'team-owner'
      ORDER BY tu."created_at" ASC
      LIMIT 1
    ),
    (
      SELECT tu."user_id"
      FROM "team_user" tu
      WHERE tu."team_id" = w."team_id"
      ORDER BY tu."created_at" ASC
      LIMIT 1
    )
  )
WHERE w."team_id" IS NOT NULL
  AND w."user_id" IS NULL;

DELETE FROM "website_user" wu
USING "website" w
WHERE wu."website_id" = w."website_id"
  AND wu."user_id" = w."user_id";
