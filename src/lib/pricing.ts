export interface Plan {
  id: "free" | "pro" | "pro_plus";
  name: string;
  price: string;
  period: string;
  tagline: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "forever",
    tagline: "Test the waters. No card required.",
    cta: "Start free",
    features: [
      "5 sponsor checks / month",
      "5 salary checks / month",
      "5 SOC code lookups / month",
      "Basic sponsor info",
      "A-rated filter",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "£9.99",
    period: "/month",
    tagline: "For serious job seekers targeting strong sponsors.",
    highlighted: true,
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    features: [
      "Everything in Free",
      "Unlimited searches",
      "Hiring likelihood signals",
      "CoS activity data (2022–2026)",
      "Live job checks",
      "Weekly Opportunity Alerts",
      "Suggested roles & SOC matching",
      "Save & compare sponsors",
      "AI Sponsorship Fit (10/month)",
      "3 free CV reviews",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: "£19.99",
    period: "/month",
    tagline: "Power users, recruiters and relocation advisers.",
    cta: "Go Pro+",
    features: [
      "Everything in Pro",
      "CSV export",
      "Bulk fit checks (20/day)",
      "Priority support",
      "Early access to new features",
    ],
  },
];
