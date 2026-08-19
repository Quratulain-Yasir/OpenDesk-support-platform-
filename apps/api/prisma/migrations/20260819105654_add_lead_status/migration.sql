-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'NEW';
