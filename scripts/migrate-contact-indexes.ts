/**
 * One-off migration for the shared email/WhatsApp contact format.
 *
 *   npx tsx scripts/migrate-contact-indexes.ts          # report only
 *   npx tsx scripts/migrate-contact-indexes.ts --fix    # apply
 *
 * What it does:
 *   1. Drops the legacy `email_1_listId_1` unique index, which rejects every
 *      email-less (WhatsApp-only) contact because it treats their missing
 *      email as a single shared null.
 *   2. Reports contacts sharing a WhatsApp number inside the same list — the
 *      new partial unique index cannot build while those exist. With --fix,
 *      the number is cleared on all but the oldest contact of each group
 *      (nothing is deleted).
 *   3. Rebuilds the indexes declared on the Contact schema.
 *
 * Everything is scoped per contact list; no cross-workspace writes.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes("--fix");

if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local or .env");
}

async function main() {
    await mongoose.connect(MONGODB_URI as string);
    console.log(`Connected. Mode: ${APPLY ? "APPLY" : "DRY RUN (pass --fix to apply)"}\n`);

    const { Contact } = await import("../models/Contact");
    const collection = Contact.collection;

    // 1 — drop the legacy index
    const indexes = await collection.indexes();
    const legacy = indexes.find(
        (i) => i.name === "email_1_listId_1" || (i.unique && !i.partialFilterExpression && i.key?.email === 1 && i.key?.listId === 1)
    );
    if (legacy) {
        console.log(`Legacy unique index found: ${legacy.name}`);
        if (APPLY) {
            await collection.dropIndex(legacy.name!);
            console.log("  → dropped");
        }
    } else {
        console.log("No legacy email+listId unique index present.");
    }

    // 2 — duplicate WhatsApp numbers within a list
    const dupes = await collection
        .aggregate<{ _id: { listId: mongoose.Types.ObjectId; whatsappNumber: string }; ids: mongoose.Types.ObjectId[] }>([
            { $match: { whatsappNumber: { $type: "string", $ne: "" } } },
            { $sort: { createdAt: 1, _id: 1 } },
            { $group: { _id: { listId: "$listId", whatsappNumber: "$whatsappNumber" }, ids: { $push: "$_id" } } },
            { $match: { "ids.1": { $exists: true } } },
        ])
        .toArray();

    if (dupes.length === 0) {
        console.log("\nNo duplicate WhatsApp numbers within a list.");
    } else {
        const losers = dupes.flatMap((d) => d.ids.slice(1));
        console.log(`\n${dupes.length} duplicated WhatsApp number(s) across lists, affecting ${losers.length} contact(s).`);
        for (const d of dupes.slice(0, 10)) {
            console.log(`  list ${d._id.listId} → ${d._id.whatsappNumber} (${d.ids.length}x)`);
        }
        if (dupes.length > 10) console.log(`  …and ${dupes.length - 10} more`);

        if (APPLY) {
            const res = await collection.updateMany(
                { _id: { $in: losers } },
                { $unset: { whatsappNumber: "", whatsappOptIn: "" } }
            );
            console.log(`  → cleared whatsappNumber on ${res.modifiedCount} contact(s) (kept the oldest of each group)`);
        }
    }

    // 3 — rebuild schema indexes
    if (APPLY) {
        console.log("\nSyncing indexes…");
        const dropped = await Contact.syncIndexes();
        console.log(`  → done (dropped: ${JSON.stringify(dropped)})`);
    }

    await mongoose.disconnect();
    console.log(APPLY ? "\nMigration complete." : "\nDry run complete — nothing was changed.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
