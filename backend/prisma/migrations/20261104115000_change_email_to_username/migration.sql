-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "email",
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockout_until" TIMESTAMP(3),
ADD COLUMN "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

