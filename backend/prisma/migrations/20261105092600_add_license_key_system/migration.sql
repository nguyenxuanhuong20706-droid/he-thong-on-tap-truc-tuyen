-- DropIndex
DROP INDEX IF EXISTS "user_subject_access_order_id_key";

-- AlterTable
ALTER TABLE "user_subject_access" ADD COLUMN IF NOT EXISTS "license_key_id" UUID,
ALTER COLUMN "access_type" SET DEFAULT 'LICENSE_KEY';

-- CreateTable
CREATE TABLE IF NOT EXISTS "license_keys" (
    "id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_mask" TEXT NOT NULL,
    "duration_days" INTEGER,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "note" TEXT,
    "created_by" TEXT NOT NULL,
    "activated_at" TIMESTAMP(3),
    "activated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "license_key_subjects" (
    "id" UUID NOT NULL,
    "license_key_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,

    CONSTRAINT "license_key_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "license_redemptions" (
    "id" UUID NOT NULL,
    "license_key_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "duration_days" INTEGER,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "license_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "license_keys_key_hash_key" ON "license_keys"("key_hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_keys_key_hash_idx" ON "license_keys"("key_hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_keys_is_used_idx" ON "license_keys"("is_used");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_keys_is_revoked_idx" ON "license_keys"("is_revoked");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_key_subjects_license_key_id_idx" ON "license_key_subjects"("license_key_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_key_subjects_subject_id_idx" ON "license_key_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "license_key_subjects_license_key_id_subject_id_key" ON "license_key_subjects"("license_key_id", "subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_redemptions_user_id_idx" ON "license_redemptions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "license_redemptions_license_key_id_idx" ON "license_redemptions"("license_key_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_subject_access_is_active_idx" ON "user_subject_access"("is_active");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'license_keys_activated_by_user_id_fkey') THEN
        ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_activated_by_user_id_fkey" FOREIGN KEY ("activated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'license_key_subjects_license_key_id_fkey') THEN
        ALTER TABLE "license_key_subjects" ADD CONSTRAINT "license_key_subjects_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "license_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'license_key_subjects_subject_id_fkey') THEN
        ALTER TABLE "license_key_subjects" ADD CONSTRAINT "license_key_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'license_redemptions_license_key_id_fkey') THEN
        ALTER TABLE "license_redemptions" ADD CONSTRAINT "license_redemptions_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "license_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'license_redemptions_user_id_fkey') THEN
        ALTER TABLE "license_redemptions" ADD CONSTRAINT "license_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subject_access_license_key_id_fkey') THEN
        ALTER TABLE "user_subject_access" ADD CONSTRAINT "user_subject_access_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "license_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

