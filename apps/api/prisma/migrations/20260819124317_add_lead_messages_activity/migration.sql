-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "lead_id" TEXT,
ALTER COLUMN "ticket_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "lead_id" TEXT,
ALTER COLUMN "ticket_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
