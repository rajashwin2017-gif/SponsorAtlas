export type PostCategory = "success_story" | "question" | "tip" | "warning";

export interface CommunityPost {
  id: string;
  authorName: string;
  authorCountry: string;
  authorRole: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  replies: number;
  isVerified: boolean;
  createdAt: string; // ISO
  sponsoredDate?: string;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post_001",
    authorName: "Aisha K.",
    authorCountry: "Nigeria",
    authorRole: "Software Engineer",
    category: "success_story",
    title: "Got sponsored by a London fintech in 3 months — here's exactly what I did",
    content:
      "I moved from Lagos with a student visa and had 6 months to find a sponsor. The key insight: most job boards don't filter by active sponsors. I used SponsorAtlas to shortlist 12 companies with CoS activity >20 in 2025, then cross-referenced their LinkedIn job posts. Of those 12, 9 were actually hiring. I applied to all 9, got 4 interviews and 1 offer. Certificate of Sponsorship issued in 8 days. The whole process took 11 weeks from first application to BRP card. Happy to answer questions.",
    tags: ["fintech", "software-engineer", "london", "nigeria", "3-months"],
    upvotes: 847,
    replies: 134,
    isVerified: true,
    createdAt: "2026-05-14T10:22:00Z",
    sponsoredDate: "Apr 2026",
  },
  {
    id: "post_002",
    authorName: "Rahul M.",
    authorCountry: "India",
    authorRole: "Data Analyst",
    category: "question",
    title: "B-rated sponsor — is it worth applying?",
    content:
      "Found a company I really like but they're B-rated on the register. Their CoS activity is decent (around 15 in 2025) and they have a live job that matches my background. Is the B-rating a deal-breaker or should I still apply? I understand B-rating means they're under scrutiny but still licensed. Any real experiences with B-rated sponsors?",
    tags: ["b-rated", "risk", "data-analyst"],
    upvotes: 312,
    replies: 67,
    isVerified: false,
    createdAt: "2026-06-01T08:45:00Z",
  },
  {
    id: "post_003",
    authorName: "Maria S.",
    authorCountry: "Brazil",
    authorRole: "Registered Nurse",
    category: "tip",
    title: "Health & Care visa: target NHS Trusts with high CoS numbers — they process fastest",
    content:
      "After applying to 30+ healthcare organisations, I noticed a pattern: NHS Trusts that issued 50+ CoS in 2025 tend to have dedicated international recruitment teams. They process applications faster and have HR staff who actually understand the visa process. Smaller care homes often want to sponsor but don't know how, leading to delays. Filter by Health & Care route + CoS >50 + NHS Trust in the name. Also check if they're on the CQC register — outstanding or good ratings correlate with better sponsor support.",
    tags: ["health-and-care", "nhs", "nursing", "healthcare"],
    upvotes: 589,
    replies: 89,
    isVerified: true,
    createdAt: "2026-04-22T14:30:00Z",
    sponsoredDate: "Mar 2026",
  },
  {
    id: "post_004",
    authorName: "James O.",
    authorCountry: "Ghana",
    authorRole: "Civil Engineer",
    category: "warning",
    title: "Warning: Company offered sponsorship but had 0 CoS in 3 years — almost got scammed",
    content:
      "I received what looked like a legitimate job offer with visa sponsorship. The company was on the licensed sponsor register, which gave me false confidence. But when I checked their CoS activity here, they had zero certificates issued in 2023, 2024, or 2025. When I asked them about this, they became evasive and eventually asked me to pay £2,000 for 'visa processing fees' upfront. Never pay for visa sponsorship. Legitimate sponsors bear the costs themselves. Always verify CoS activity before getting excited about an offer.",
    tags: ["scam", "warning", "0-cos", "engineering"],
    upvotes: 1204,
    replies: 203,
    isVerified: false,
    createdAt: "2026-05-30T16:15:00Z",
  },
  {
    id: "post_005",
    authorName: "Priya N.",
    authorCountry: "India",
    authorRole: "Chartered Accountant",
    category: "success_story",
    title: "Finance sector sponsorship — Edinburgh over London was the right call",
    content:
      "Everyone told me London is the only option for finance. I searched specifically for Edinburgh finance sponsors and found far less competition. Applied to 6 sponsors — 3 responded positively and 2 gave me interviews. Got an offer from an asset management firm in Edinburgh. Salary is £48k vs the £52k I would have targeted in London, but rent is £900 vs £2,200 for the same quality flat. Net savings: £400/month. Don't sleep on regional cities for finance roles.",
    tags: ["finance", "edinburgh", "accountant", "regional"],
    upvotes: 445,
    replies: 78,
    isVerified: true,
    createdAt: "2026-03-18T11:00:00Z",
    sponsoredDate: "Feb 2026",
  },
  {
    id: "post_006",
    authorName: "Chen W.",
    authorCountry: "China",
    authorRole: "AI/ML Engineer",
    category: "tip",
    title: "Scale-up visa sponsors are underrated — 3x acceptance rate vs Skilled Worker",
    content:
      "I applied through both routes simultaneously. Scale-up sponsors had fewer applicants, seemed more willing to take risks on international candidates, and the interview process was faster. The salary threshold is the same but Scale-up sponsors tend to move quicker on hiring decisions. The main risk is they're earlier-stage companies. I checked their CoS activity and recent funding rounds (Crunchbase + Companies House) to verify they were stable. Ended up joining a Series B AI startup in Cambridge.",
    tags: ["scale-up", "ai-ml", "cambridge", "startup"],
    upvotes: 678,
    replies: 112,
    isVerified: true,
    createdAt: "2026-02-10T09:30:00Z",
    sponsoredDate: "Jan 2026",
  },
  {
    id: "post_007",
    authorName: "Fatima A.",
    authorCountry: "Pakistan",
    authorRole: "UX Designer",
    category: "question",
    title: "SOC 3421 (Graphic Designer) vs 2137 (Web Designer) — which should I target?",
    content:
      "I do UX/product design work. My portfolio includes both visual design and interaction design. The going rate for SOC 2137 is £41,600 vs £31,200 for 3421. I want to target sponsors correctly but I'm not sure which code applies. My current salary in Pakistan is equivalent to about £28k. Would I qualify for SOC 2137 if I negotiate hard? Or should I be realistic and target 3421 first?",
    tags: ["ux-design", "soc-code", "salary-threshold", "3421", "2137"],
    upvotes: 234,
    replies: 56,
    isVerified: false,
    createdAt: "2026-06-10T13:45:00Z",
  },
  {
    id: "post_008",
    authorName: "Emmanuel B.",
    authorCountry: "Cameroon",
    authorRole: "Construction Project Manager",
    category: "success_story",
    title: "Construction sector: CSCS card + PMP got me sponsored within 8 weeks",
    content:
      "Construction sponsors were surprisingly responsive. I had my CSCS Gold card (project manager level) and PMP certification. I targeted companies with 10+ CoS issued in construction and a rating of A. Sent tailored emails explaining my specific credentials rather than just submitting through job portals. 3 out of 8 emails led to interviews. The company that sponsored me hired me within 3 weeks of first contact — they'd been struggling to find a qualified PM for 4 months.",
    tags: ["construction", "cscs", "project-manager", "direct-outreach"],
    upvotes: 392,
    replies: 61,
    isVerified: true,
    createdAt: "2026-04-05T08:00:00Z",
    sponsoredDate: "Mar 2026",
  },
];

export function filterPosts(category: PostCategory | "all", q: string): CommunityPost[] {
  return COMMUNITY_POSTS.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return (
        p.title.toLowerCase().includes(n) ||
        p.content.toLowerCase().includes(n) ||
        p.tags.some((t) => t.includes(n)) ||
        p.authorRole.toLowerCase().includes(n)
      );
    }
    return true;
  });
}
