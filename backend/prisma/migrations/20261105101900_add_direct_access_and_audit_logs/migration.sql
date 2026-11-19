-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('GRANT', 'REVOKE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_subject_access" ADD COLUMN "granted_by_id" UUID,
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "revoked_by_id" UUID,
ALTER COLUMN "access_type" SET DEFAULT 'ADMIN_GRANT';

-- CreateTable
CREATE TABLE "access_audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "admin_name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "user_name" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "subject_title" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_audit_logs_admin_id_idx" ON "access_audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "access_audit_logs_user_id_idx" ON "access_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "access_audit_logs_subject_id_idx" ON "access_audit_logs"("subject_id");

-- CreateIndex
CREATE INDEX "access_audit_logs_created_at_idx" ON "access_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "access_audit_logs" ADD CONSTRAINT "access_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_audit_logs" ADD CONSTRAINT "access_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_audit_logs" ADD CONSTRAINT "access_audit_logs_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

