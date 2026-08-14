-- AlterTable
ALTER TABLE "saved_responses" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "saved_responses_workspace_id_idx" ON "saved_responses"("workspace_id");

-- CreateIndex
CREATE INDEX "saved_responses_created_by_id_idx" ON "saved_responses"("created_by_id");
