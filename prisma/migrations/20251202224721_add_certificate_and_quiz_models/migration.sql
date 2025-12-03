-- CreateTable
CREATE TABLE "TrainingCertificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "timeLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "TrainingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuizAttempt" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_certificateId_key" ON "TrainingCertificate"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_cleanerId_key" ON "TrainingCertificate"("cleanerId");

-- CreateIndex
CREATE INDEX "TrainingCertificate_certificateId_idx" ON "TrainingCertificate"("certificateId");

-- CreateIndex
CREATE INDEX "TrainingCertificate_cleanerId_idx" ON "TrainingCertificate"("cleanerId");

-- CreateIndex
CREATE INDEX "TrainingCertificate_status_idx" ON "TrainingCertificate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingQuiz_lessonId_key" ON "TrainingQuiz"("lessonId");

-- CreateIndex
CREATE INDEX "TrainingQuiz_lessonId_idx" ON "TrainingQuiz"("lessonId");

-- CreateIndex
CREATE INDEX "TrainingQuiz_isActive_idx" ON "TrainingQuiz"("isActive");

-- CreateIndex
CREATE INDEX "TrainingQuestion_quizId_idx" ON "TrainingQuestion"("quizId");

-- CreateIndex
CREATE INDEX "TrainingQuestion_quizId_order_idx" ON "TrainingQuestion"("quizId", "order");

-- CreateIndex
CREATE INDEX "TrainingQuizAttempt_cleanerId_idx" ON "TrainingQuizAttempt"("cleanerId");

-- CreateIndex
CREATE INDEX "TrainingQuizAttempt_quizId_idx" ON "TrainingQuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "TrainingQuizAttempt_lessonId_idx" ON "TrainingQuizAttempt"("lessonId");

-- CreateIndex
CREATE INDEX "TrainingQuizAttempt_passed_idx" ON "TrainingQuizAttempt"("passed");

-- CreateIndex
CREATE INDEX "TrainingQuizAttempt_startedAt_idx" ON "TrainingQuizAttempt"("startedAt");

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_cleanerId_User_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_cleanerId_TrainingStatus_fkey" FOREIGN KEY ("cleanerId") REFERENCES "TrainingStatus"("cleanerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuiz" ADD CONSTRAINT "TrainingQuiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TrainingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuestion" ADD CONSTRAINT "TrainingQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuizAttempt" ADD CONSTRAINT "TrainingQuizAttempt_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuizAttempt" ADD CONSTRAINT "TrainingQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
