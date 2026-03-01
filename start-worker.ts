import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function start() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB for Worker");

        // Dynamically import the worker logic so it registers after DB connects
        import('./lib/worker').then(({ initWorker, initWhatsappWorker }) => {
            console.log("Starting BulkMailer BullMQ Workers...");
            initWorker();
            initWhatsappWorker();
        });

    } catch (error) {
        console.error("Worker failed to start", error);
        process.exit(1);
    }
}

start();
