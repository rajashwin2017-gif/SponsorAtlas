export interface Plan {
  id: "free" | "pro" | "pro_plus";
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlySaving: string;
  tagline?: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: "£0",
    yearlyPrice: "£0",
    yearlySaving: "0%",
    cta: "Start free",
    features: [
      "Sponsor licence holder directory",
      "3 sample sponsors unlocked",
      "Top 3 rankings per category",
      "3 live job listings",
      "Industry filters",
      "Publicly available sponsor info",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "£17.99",
    yearlyPrice: "£89.99",
    yearlySaving: "58%",
    cta: "Upgrade to Pro",
    features: [
      "Everything in Free",
      "Unlock 30 sponsors of your choice",
      "Top 30 rankings per category",
      "30 live job listings",
      "City & region filters",
      "Sponsor Strength & Opportunity scores",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro Plus",
    monthlyPrice: "£19.99",
    yearlyPrice: "£99.99",
    yearlySaving: "58%",
    highlighted: true,
    badge: "Best Value",
    cta: "Go Pro Plus",
    features: [
      "Everything in Pro",
      "Unlock all 126,000+ sponsors",
      "Full rankings, every category",
      "Unlimited job listings",
      "CSV export",
      "AI Fit Score for every sponsor",
      "Priority support",
    ],
  },
];
