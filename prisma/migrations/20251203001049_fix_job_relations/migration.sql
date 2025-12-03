-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedCleanerId_fkey" FOREIGN KEY ("assignedCleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
