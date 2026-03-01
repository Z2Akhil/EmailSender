import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
    try {
        await connectDB();

        // In a real application, you would query Stripe API for real payment history:
        // const payments = await stripe.charges.list({ limit: 100 });

        // Since we are simulating, we will calculate estimated revenue from active users in the DB
        const users: any[] = await User.find({ plan: { $in: ["STARTER", "PRO"] } }, "name email plan createdAt");

        let totalRevenue = 0;
        let basicCount = 0;
        let proCount = 0;

        const simulatedPayments = users.map(user => {
            const plan = user.plan;
            const amount = plan === "PRO" ? 99 : 29;
            totalRevenue += amount;

            if (plan === "PRO") proCount++;
            else if (plan === "BASIC") basicCount++;

            return {
                _id: `inv_${Math.random().toString(36).substr(2, 9)}`,
                user: {
                    name: user.name,
                    email: user.email,
                },
                plan,
                amount,
                status: "paid",
                date: user.createdAt, // Simulating the payment date as the join date for now
            };
        });

        // Sort latest first
        simulatedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            metrics: {
                totalRevenue,
                basicSubscribers: basicCount,
                proSubscribers: proCount,
            },
            history: simulatedPayments
        });

    } catch (error) {
        console.error("Error fetching admin revenue:", error);
        return NextResponse.json(
            { error: "Failed to fetch revenue data" },
            { status: 500 }
        );
    }
}
