import { wrapEmailHtml } from "./email-html";

/**
 * The single authoritative set of global starter templates ("the gallery").
 * Consumed by the cron seeder (force reseed) and the templates GET lazy-seed.
 *
 * Authoring rules — bodies must round-trip through the TipTap SimpleEmailEditor:
 * only h1/h2, p (optionally style="text-align:center"), strong/em, ul/li,
 * blockquote, hr, img src, plain <a href>, {{firstName}}/{{email}} tokens, and
 * CTA buttons using the exact markup SimpleEmailEditor's addButton() inserts.
 * No tables, no divs.
 */

export interface GalleryTemplateDef {
    name: string;
    description: string;
    category: string;
    defaultSubject: string;
    body: string;
}

const button = (label: string, href = "https://example.com") =>
    `<p style="text-align:center"><a href="${href}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">${label}</a></p>`;

export const GALLERY_TEMPLATES: GalleryTemplateDef[] = [
    {
        name: "Welcome Email",
        description: "Greet new signups and point them to their first step.",
        category: "welcome",
        defaultSubject: "Welcome aboard — here's what's next",
        body: `<h1>Welcome, {{firstName}}! 👋</h1>
<p>We're thrilled to have you with us. You've just joined a community that's serious about getting things done — and we want to make sure you get off to a great start.</p>
<p>Here's what you can do right now:</p>
<ul><li><strong>Complete your profile</strong> — it takes less than a minute</li><li><strong>Explore the dashboard</strong> — everything lives there</li><li><strong>Reach out anytime</strong> — just reply to this email</li></ul>
${button("Get Started")}
<p>If you have any questions, simply hit reply. A real human reads every message.</p>
<p>Cheers,<br>The Team</p>`,
    },
    {
        name: "Product Launch",
        description: "Announce a new product or feature with a strong call to action.",
        category: "launch",
        defaultSubject: "Introducing our newest release 🚀",
        body: `<h1 style="text-align:center">Something new is here 🚀</h1>
<p>Hi {{firstName}},</p>
<p>We've been building something we can't wait for you to try. Today, it's finally live.</p>
<h2>What's new</h2>
<ul><li><strong>Faster than ever</strong> — everything loads in a blink</li><li><strong>Simpler workflow</strong> — fewer clicks, more results</li><li><strong>Built on your feedback</strong> — you asked, we listened</li></ul>
${button("See What's New")}
<hr>
<p><em>Early birds get the best view — the first 100 users to try it get priority support.</em></p>`,
    },
    {
        name: "Sale / Special Offer",
        description: "Drive purchases with a limited-time discount.",
        category: "sale",
        defaultSubject: "A special offer, just for you",
        body: `<h1 style="text-align:center">Just for you, {{firstName}} 🎁</h1>
<p style="text-align:center"><strong>Save 25% on everything — this week only.</strong></p>
<p>We don't do this often. For the next 7 days, everything in our catalog is 25% off — no minimums, no fine print.</p>
<blockquote>Use code <strong>SAVE25</strong> at checkout.</blockquote>
${button("Shop the Sale")}
<p style="text-align:center"><em>Offer ends Sunday at midnight. Don't sleep on it.</em></p>`,
    },
    {
        name: "Monthly Newsletter",
        description: "A clean roundup layout for regular updates.",
        category: "newsletter",
        defaultSubject: "Your monthly roundup",
        body: `<h1>This Month's Roundup</h1>
<p>Hi {{firstName}}, here's everything worth knowing from the past month — in two minutes or less.</p>
<h2>📈 Highlights</h2>
<ul><li>Milestone one worth celebrating</li><li>A feature update your workflow will love</li><li>Community spotlight: what others are building</li></ul>
<h2>📚 Worth a read</h2>
<p>Our most popular article this month: <a href="https://example.com">How to get twice the results in half the time</a>.</p>
<hr>
${button("Read the Full Update")}
<p><em>Thanks for being with us — see you next month!</em></p>`,
    },
    {
        name: "Event Invite",
        description: "Invite contacts to a webinar, meetup or launch event.",
        category: "event",
        defaultSubject: "You're invited — save your seat",
        body: `<h1 style="text-align:center">You're invited 🎟️</h1>
<p>Hi {{firstName}},</p>
<p>We're hosting something special, and we'd love to see you there.</p>
<h2>The details</h2>
<ul><li><strong>What:</strong> Live session + Q&amp;A</li><li><strong>When:</strong> Thursday, 5:00 PM</li><li><strong>Where:</strong> Online — link after registration</li></ul>
${button("Save My Seat")}
<p style="text-align:center"><em>Seats are limited — first come, first served.</em></p>`,
    },
    {
        name: "Follow-up / Re-engagement",
        description: "Win back contacts who went quiet.",
        category: "follow-up",
        defaultSubject: "Quick follow-up — still interested?",
        body: `<h1>Still there, {{firstName}}?</h1>
<p>It's been a while since we last heard from you — and we wanted to check in.</p>
<p>A lot has changed since your last visit:</p>
<ul><li>New features that save serious time</li><li>A smoother, faster experience</li><li>More ways to get value from day one</li></ul>
${button("Pick Up Where You Left Off")}
<p>Not interested anymore? No hard feelings — the unsubscribe link below always works. But we'd love one more chance to impress you.</p>`,
    },
    {
        name: "Festival Greeting",
        description: "A warm seasonal wish with an optional offer.",
        category: "festival",
        defaultSubject: "Season's greetings from all of us 🎉",
        body: `<h1 style="text-align:center">Season's Greetings! 🎉</h1>
<p style="text-align:center">Dear {{firstName}},</p>
<p style="text-align:center">Wishing you and your loved ones joy, warmth and prosperity this festive season. Thank you for being part of our journey this year — it means the world to us.</p>
<hr>
<p style="text-align:center">As a small token of appreciation, here's a festive treat:</p>
${button("Unwrap Your Gift")}
<p style="text-align:center"><em>With gratitude,<br>The Team</em></p>`,
    },
];

/** Maps a gallery definition to a Template document shape ready for insertMany. */
export function toTemplateDoc(def: GalleryTemplateDef) {
    return {
        name: def.name,
        description: def.description,
        category: def.category,
        defaultSubject: def.defaultSubject,
        type: "EMAIL" as const,
        isGlobal: true,
        htmlContent: wrapEmailHtml(def.body),
        // The unwrapped body loads straight into the TipTap editor
        emailDesign: { editor: "tiptap", content: def.body },
    };
}
