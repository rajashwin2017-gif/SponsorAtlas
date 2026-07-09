import type { Metadata } from "next";
import { ShieldCheck, Ban, CalendarPlus, Lock } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free, Pro (£17.99/mo) and Pro Plus (£19.99/mo) plans for UK visa sponsorship intelligence.",
};

const FAQS = [
  { q: "Do I need a credit card to start?", a: "No. The Free plan requires no card and gives you access to the sponsor directory, basic company information, and public sponsor info with no time limit." },
  { q: "Can I cancel anytime?", a: "Yes. Subscriptions are month-to-month with no long-term contract. Cancel from your dashboard and you keep Pro access until the period ends." },
  { q: "Where does your data come from?", a: "The sponsor register is published by the UK Home Office under the Open Government Licence v3.0. We enrich it with hiring and CoS-activity signals." },
  { q: "Is this immigration advice?", a: "No. The Sponsor Finder is an informational research tool. We don't provide legal or immigration advice, or guarantee sponsorship or employment." },
];

export default function PricingPage() {
  return (
    <div className="container py-14">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="emerald" className="mx-auto mb-4">Simple pricing</Badge>
        <h1 className="font-display text-4xl tracking-tight">Choose your plan</h1>
        <p className="mt-4 text-muted-foreground">
          Start free, upgrade when you need hiring signals and AI fit scoring. Cancel anytime.
        </p>
      </div>

      <div className="mt-12">
        <PricingCards />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Lock className="size-4 text-red-600" /> Secure checkout</span>
        <span className="flex items-center gap-1.5"><Ban className="size-4 text-red-600" /> Cancel anytime</span>
        <span className="flex items-center gap-1.5"><CalendarPlus className="size-4 text-red-600" /> No long-term contract</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-red-600" /> GDPR compliant</span>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-display text-2xl tracking-tight">Frequently asked questions</h2>
        <dl className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="surface-card p-5">
              <dt className="font-heading text-sm font-semibold">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
