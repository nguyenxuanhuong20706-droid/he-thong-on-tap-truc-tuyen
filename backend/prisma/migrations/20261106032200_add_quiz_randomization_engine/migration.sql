-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "shuffle_options" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quiz_attempts" ADD COLUMN "status" "AttemptStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "snapshot" JSONB,
ADD COLUMN "draft_answers" JSONB,
ADD COLUMN "submitted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quiz_answers" ADD COLUMN "selected_option_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_lesson_id_status_idx" ON "quiz_attempts"("user_id", "lesson_id", "status");

-- Partial Unique Index: 1 user chỉ có tối đa 1 attempt IN_PROGRESS cho 1 bài học
CREATE UNIQUE INDEX "quiz_attempts_user_lesson_in_progress_key" ON "quiz_attempts"("user_id", "lesson_id") WHERE status = 'IN_PROGRESS';

