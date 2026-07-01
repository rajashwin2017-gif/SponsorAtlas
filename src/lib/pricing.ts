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
      "Basic company information",
      "Industry & location filters",
      "Basic search functionality",
      "Limited vacancy views",
      "Publicly available sponsor info",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "£19.99",
    yearlyPrice: "£99.99",
    yearlySaving: "58%",
    highlighted: true,
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    features: [
      "Everything in Free",
      "Active sponsorship vacancies",
      "Direct employer application links",
      "Unlimited searches",
      "Advanced filtering",
      "Save favourite employers & jobs",
      "Email alerts & notifications",
      "Sponsorship insights",
      "Employer activity updates",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro Plus",
    monthlyPrice: "£29.99",
    yearlyPrice: "£149.99",
    yearlySaving: "58%",
    cta: "Go Pro Plus",
    features: [
      "Everything in Pro",
      "Premium candidate profile",
      "CV review tools",
      "AI CV matching",
      "Interview preparation resources",
      "Priority job alerts",
      "Employer recommendations",
      "Application tracking tools",
      "Priority customer support",
      "Early access to new features",
    ],
  },
];
