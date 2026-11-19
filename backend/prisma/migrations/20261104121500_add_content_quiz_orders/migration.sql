-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REJECTED');

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_subject_access" ADD COLUMN     "order_id" UUID;

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "lesson_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "question_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "unanswered_count" INTEGER NOT NULL DEFAULT 0,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "selected_key" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "transfer_note" TEXT,
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "transaction_code" TEXT,
    "confirmed_by" TEXT,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_subject_id_idx" ON "lessons"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_subject_id_slug_key" ON "lessons"("subject_id", "slug");

-- CreateIndex
CREATE INDEX "questions_lesson_id_idx" ON "questions"("lesson_id");

-- CreateIndex
CREATE INDEX "questions_subject_id_idx" ON "questions"("subject_id");

-- CreateIndex
CREATE INDEX "options_question_id_idx" ON "options"("question_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_subject_id_idx" ON "quiz_attempts"("subject_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_lesson_id_idx" ON "quiz_attempts"("lesson_id");

-- CreateIndex
CREATE INDEX "quiz_answers_attempt_id_idx" ON "quiz_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "quiz_answers_question_id_idx" ON "quiz_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_subject_id_idx" ON "orders"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subject_access_order_id_key" ON "user_subject_access"("order_id");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subject_access" ADD CONSTRAINT "user_subject_access_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

