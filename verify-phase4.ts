import "dotenv/config";
import { addEmailJob } from "./lib/queue";
import { initWorker } from "./lib/worker";
import { connectDB } from "./lib/db";
import { Campaign } from "./models/Campaign";
import { ContactList, Contact } from "./models/Contact";
import mongoose from "mongoose";

async function runVerification() {
    console.log("🚀 Starting Phase 4 Verification...");

    try {
        await connectDB();
        console.log("✅ 1. Database connected");

        // Start Worker
        const worker = initWorker();
        console.log("✅ 2. Worker initialized");

        // Setup Test Data
        let testWorkspaceId = new mongoose.Types.ObjectId();

        const list = await ContactList.create({
            name: "Test Verification List",
            workspaceId: testWorkspaceId,
            contactCount: 1
        });

        const contact = await Contact.create({
            email: "test@example.com",
            firstName: "Tester",
            listId: list._id,
            status: "ACTIVE"
        });

        const campaign = await Campaign.create({
            name: "Verification Campaign",
            subject: "Verify Phase 4 Works!",
            htmlContent: "<h1>Hello {{firstName}}!</h1><p>This is a verification test.</p>",
            fromName: "BulkMailer Test",
            fromEmail: "test@bulkmailer.com",
            workspaceId: testWorkspaceId,
            recipientListId: list._id,
            status: "DRAFT"
        });

        console.log("✅ 3. Test data created");

        // Enqueue Job
        console.log("⏳ 4. Enqueueing job...");
        await addEmailJob({
            campaignId: campaign._id.toString(),
            contactId: contact._id.toString(),
            recipientEmail: contact.email,
            recipientName: contact.firstName
        });

        console.log("✅ 5. Job added to queue. Waiting for worker to process...");

        // Wait a bit for worker to process
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verify Results
        const updatedCampaign = await Campaign.findById(campaign._id);
        console.log(`📊 Campaign status: ${updatedCampaign?.status}`);
        console.log(`📊 Sent count: ${updatedCampaign?.sentCount}`);

        if (updatedCampaign?.sentCount === 1) {
            console.log("🎉 SUCCESS: Phase 4 verified!");
        } else {
            console.log("❌ FAILURE: Job was not processed or failed.");
        }

        // Cleanup
        await Campaign.findByIdAndDelete(campaign._id);
        await Contact.findByIdAndDelete(contact._id);
        await ContactList.findByIdAndDelete(list._id);
        console.log("🧹 Cleanup complete.");

        await worker.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

runVerification();
