import Link from "next/link";
import {
  Mail,
  Users,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Upload CSV/Excel files, organize contacts into lists, and manage unsubscribes automatically.",
  },
  {
    icon: Mail,
    title: "Campaign Builder",
    description:
      "Design beautiful emails with pre-built templates and personalization tags like {{first_name}}.",
  },
  {
    icon: Zap,
    title: "Bulk Sending Engine",
    description:
      "Send thousands of emails reliably with SendGrid/SES integration and background job queues.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track open rates, click rates, bounces, and unsubscribes with real-time charts.",
  },
  {
    icon: Shield,
    title: "GDPR Compliant",
    description:
      "Auto-inject unsubscribe links, manage suppression lists, and stay legally compliant.",
  },
  {
    icon: Star,
    title: "Scheduled Sending",
    description:
      "Schedule campaigns for the perfect time and let BulkMailer handle the rest.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    contacts: "500 contacts",
    emails: "1,000 emails/mo",
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    contacts: "2,500 contacts",
    emails: "15,000 emails/mo",
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/month",
    contacts: "10,000 contacts",
    emails: "100,000 emails/mo",
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    contacts: "50,000 contacts",
    emails: "Unlimited emails",
    cta: "Start Free Trial",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BulkMailer</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple, affordable email marketing
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Send bulk emails{" "}
            <span className="text-blue-600">without the complexity</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            BulkMailer is the affordable Mailchimp alternative for small businesses. Upload your contacts, pick a template, and send — it&apos;s that simple.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-700 font-medium px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Sign in to your account
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Free forever • No credit card required • 1,000 emails/month
          </p>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Emails Sent", value: "2.4M", color: "text-blue-600" },
                { label: "Avg Open Rate", value: "28.3%", color: "text-green-600" },
                { label: "Campaigns", value: "1,240", color: "text-purple-600" },
                { label: "Contacts", value: "89K", color: "text-orange-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run email campaigns
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              All the tools you need in one simple platform — no bloat, no confusion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-500">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 border ${plan.highlight
                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200"
                    : "bg-white border-gray-200"
                  }`}
              >
                <div className={`text-sm font-medium mb-4 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <div className="mt-4 space-y-2 mb-6">
                  {[plan.contacts, plan.emails].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${plan.highlight ? "text-blue-200" : "text-green-500"}`} />
                      <span className={`text-sm ${plan.highlight ? "text-blue-100" : "text-gray-600"}`}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/signup"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to grow your audience?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of businesses sending smarter emails with BulkMailer.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Mail className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">BulkMailer</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BulkMailer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
