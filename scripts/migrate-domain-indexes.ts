/**
 * Drops the legacy globally-unique `domainName_1` index left over from the SES
 * identity model, so two workspaces can track the same domain.
 *
 *   npx tsx scripts/migrate-domain-indexes.ts          # report only
 *   npx tsx scripts/migrate-domain-indexes.ts --fix    # drop it
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LEGACY_INDEX = "domainName_1";

async function main() {
    const fix = process.argv.includes("--fix");
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");

    await mongoose.connect(uri);
    const collection = mongoose.connection.collection("domains");
    const indexes = await collection.indexes();

    const legacy = indexes.find((i) => i.name === LEGACY_INDEX);
    if (!legacy) {
        console.log(`No "${LEGACY_INDEX}" index present — nothing to do.`);
    } else if (!fix) {
        console.log(`Found legacy index "${LEGACY_INDEX}". Re-run with --fix to drop it.`);
    } else {
        await collection.dropIndex(LEGACY_INDEX);
        console.log(`Dropped "${LEGACY_INDEX}".`);
    }

    console.log("Current indexes:", (await collection.indexes()).map((i) => i.name).join(", "));
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
