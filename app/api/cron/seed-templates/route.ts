import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

const PREBUILT_TEMPLATES = [
    {
        name: "Welcome Email",
        description: "Warm welcome for new subscribers or customers",
        type: "EMAIL",
        isGlobal: true,
        emailDesign: {
            assets: [],
            styles: [],
            pages: [{
                component: {
                    type: 'wrapper',
                    components: [
                        { type: 'text', content: '<h1 style="color:#000;">Welcome aboard! 🎉</h1>', attributes: { style: 'text-align: center; padding: 20px;' } },
                        { type: 'text', content: '<p>Hi {{firstName}},</p><p>We are excited to have you as part of our community.</p>', attributes: { style: 'padding: 20px;' } },
                        { type: 'link', content: 'Get Started', attributes: { href: '#', style: 'display: inline-block; background: #667eea; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px;' } },
                        { type: 'text', content: '<p style="color:#9ca3af;font-size:12px;text-align:center;">To stop receiving emails, <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>' }
                    ]
                }
            }]
        },
    },
    {
        name: "Special Offer",
        description: "Promotional email with a discount or limited-time deal",
        type: "EMAIL",
        isGlobal: true,
        emailDesign: {
            assets: [], styles: [], pages: [{
                component: { type: 'wrapper', components: [
                    { type: 'text', content: '<h2 style="color:#ff6b35;text-align:center;margin-top:20px;">⏰ Limited Time Offer</h2>' },
                    { type: 'text', content: '<h1 style="color:#1f2937;text-align:center;font-size:42px;">30% OFF</h1>' },
                    { type: 'text', content: '<p style="text-align:center;">Everything in our store — this weekend only!</p>' },
                    { type: 'text', content: '<p style="text-align:center;">Coupon Code: <strong>SAVE30</strong></p>' },
                    { type: 'link', content: 'Shop Now', attributes: { href: '#', style: 'display: block; width: fit-content; margin: 20px auto; background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;' } }
                ]}
            }]
        },
    },
    {
        name: "Monthly Newsletter",
        description: "Clean newsletter layout for monthly updates and content",
        type: "EMAIL",
        isGlobal: true,
        emailDesign: {
            assets: [], styles: [], pages: [{
                component: { type: 'wrapper', components: [
                    { type: 'text', content: '<h2>What\'s new this month 🚀</h2><p>Hi {{firstName}}, here\'s your curated update.</p>' },
                    { type: 'text', content: '<h3>🎯 New Feature Released</h3><p>We shipped something you asked for.</p>' }
                ]}
            }]
        },
    },
    {
        name: "Announcement",
        description: "Big news or launch announcement",
        type: "EMAIL",
        isGlobal: true,
        emailDesign: {
            assets: [], styles: [], pages: [{
                component: { type: 'wrapper', components: [
                    { type: 'text', content: '<h1 style="text-align:center;color:#0ea5e9;">We\'re Launching Something New</h1>' },
                    { type: 'text', content: '<p style="text-align:center;">Hi {{firstName}}, you get early access!</p>' }
                ]}
            }]
        },
    },
    {
        name: "Follow-Up",
        description: "Friendly follow-up to re-engage inactive contacts",
        type: "EMAIL",
        isGlobal: true,
        emailDesign: {
            assets: [], styles: [], pages: [{
                component: { type: 'wrapper', components: [
                    { type: 'text', content: '<h1 style="text-align:center">Hey {{firstName}}, we miss you!</h1>' },
                    { type: 'text', content: '<p style="text-align:center">It\'s been a while. Come back and get 20% off.</p>' }
                ]}
            }]
        },
    },
];

/**
 * POST /api/cron/seed-templates
 * Seeds the 5 pre-built global email templates into MongoDB.
 * Call once after first deploy or run locally.
 * Protected by CRON_SECRET env var.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        let created = 0;
        let skipped = 0;

        for (const tmpl of PREBUILT_TEMPLATES) {
            const existing = await Template.findOne({ name: tmpl.name, isGlobal: true });
            if (existing) {
                skipped++;
                continue;
            }
            await Template.create(tmpl);
            created++;
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${created} templates, skipped ${skipped} already existing.`,
            created,
            skipped,
        });
    } catch (error) {
        console.error("[SEED_TEMPLATES]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
