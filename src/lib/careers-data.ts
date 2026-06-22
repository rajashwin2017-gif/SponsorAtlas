/**
 * Careers portal lookup for UK visa sponsors.
 *
 * Keys are normalised company names (uppercase, stripped of Ltd/LLP/PLC etc.)
 * so they can be matched against sponsor organisationName from the register.
 *
 * type "greenhouse"  → fetch live jobs from Greenhouse Boards API (no auth)
 * type "lever"       → fetch live jobs from Lever Postings API (no auth)
 * type "workable"    → fetch live jobs from Workable API (no auth)
 * type "nhs"         → link to NHS Jobs search for the trust
 * type "url"         → direct link to the company's careers page
 */

export type AtsType = "greenhouse" | "lever" | "workable" | "nhs" | "url";

export interface CareersEntry {
  type: AtsType;
  /** Greenhouse board token, Lever company slug, or Workable account slug */
  token?: string;
  /** Direct URL for "url" and "nhs" types */
  url?: string;
  /** Display name override */
  displayName?: string;
}

// ── Key normalisation ────────────────────────────────────────────────────────

// Only strip legal entity suffixes — NOT descriptive words like "UK", "Services", "Technologies"
// so "Amazon UK Services Ltd" → "AMAZON UK SERVICES", not "AMAZON"
const STRIP_SUFFIXES =
  /\s+(ltd|llp|plc|limited|llc|inc|corp|corporation|holding|holdings|national association|foundation trust|nhs trust|nhs foundation trust)\b\.?/gi;

export function normaliseCompanyName(name: string): string {
  return name
    .toUpperCase()
    .replace(STRIP_SUFFIXES, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Lookup table ─────────────────────────────────────────────────────────────
// Entries are keyed by normalised name (run through normaliseCompanyName above).

const CAREERS_TABLE: Record<string, CareersEntry> = {
  // ── NHS / Healthcare ──────────────────────────────────────────────────────
  "HEALTH EDUCATION ENGLAND": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Health+Education+England",
    displayName: "Health Education England",
  },
  "GUYS AND ST THOMAS": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Guy%27s+and+St+Thomas%27+NHS+Foundation+Trust",
  },
  "MANCHESTER UNIVERSITY": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Manchester+University+NHS+Foundation+Trust",
  },
  "KINGS COLLEGE HOSPITAL": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=King%27s+College+Hospital+NHS+Foundation+Trust",
  },
  "ROYAL FREE LONDON": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Royal+Free+London+NHS+Foundation+Trust",
  },
  "NOTTINGHAM UNIVERSITY HOSPITALS": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Nottingham+University+Hospitals+NHS+Trust",
  },
  "UNIVERSITY HOSPITALS SUSSEX": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=University+Hospitals+Sussex+NHS+Foundation+Trust",
  },
  "OXFORD UNIVERSITY HOSPITALS": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Oxford+University+Hospitals+NHS+Trust",
  },
  "UNIVERSITY HOSPITALS OF LEICESTER": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=University+Hospitals+of+Leicester+NHS+Trust",
  },
  "BARTS HEALTH NATIONAL HEALTH SERVICE": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Barts+Health+NHS+Trust",
  },
  "UNIVERSITY HOSPITALS BIRMINGHAM": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=University+Hospitals+Birmingham+NHS+Foundation+Trust",
  },
  "MID AND SOUTH ESSEX": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Mid+and+South+Essex+NHS+Foundation+Trust",
  },
  "EAST KENT HOSPITALS UNIVERSITY": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=East+Kent+Hospitals+University+NHS+Foundation+Trust",
  },
  "IMPERIAL COLLEGE HEALTHCARE": {
    type: "nhs",
    url: "https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=Imperial+College+Healthcare+NHS+Trust",
  },
  "NHS EDUCATION FOR SCOTLAND": {
    type: "url",
    url: "https://www.nes.scot.nhs.uk/about-us/jobs/",
  },
  "ELYSIUM HEALTHCARE": {
    type: "url",
    url: "https://www.elysiumhealthcare.co.uk/careers/",
  },
  "BARCHESTER HEALTHCARE": {
    type: "url",
    url: "https://www.barchester.com/jobs",
  },

  // ── Consulting / IT Services ──────────────────────────────────────────────
  "TATA CONSULTANCY SERVICES": {
    type: "url",
    url: "https://www.tcs.com/careers",
    displayName: "Tata Consultancy Services",
  },
  "COGNIZANT WORLDWIDE": {
    type: "url",
    url: "https://careers.cognizant.com/global/en",
    displayName: "Cognizant",
  },
  "ERNST & YOUNG": {
    type: "url",
    url: "https://www.ey.com/en_uk/careers",
    displayName: "EY",
  },
  "ERNST YOUNG": {
    type: "url",
    url: "https://www.ey.com/en_uk/careers",
    displayName: "EY",
  },
  "DELOITTE": {
    type: "url",
    url: "https://www2.deloitte.com/uk/en/careers.html",
    displayName: "Deloitte",
  },
  "PRICEWATERHOUSECOOPERS": {
    type: "url",
    url: "https://www.pwc.co.uk/careers.html",
    displayName: "PwC",
  },
  "KPMG": {
    type: "url",
    url: "https://www.kpmgcareers.co.uk/",
    displayName: "KPMG",
  },
  "KPMG LOCAL HIRES": {
    type: "url",
    url: "https://www.kpmgcareers.co.uk/",
    displayName: "KPMG",
  },
  "ACCENTURE": {
    type: "url",
    url: "https://www.accenture.com/gb-en/careers",
    displayName: "Accenture",
  },
  "ACCENTURE UK": {
    type: "url",
    url: "https://www.accenture.com/gb-en/careers",
    displayName: "Accenture",
  },
  "CAPGEMINI": {
    type: "url",
    url: "https://www.capgemini.com/gb-en/careers/",
    displayName: "Capgemini",
  },
  "CAPGEMINI UK": {
    type: "url",
    url: "https://www.capgemini.com/gb-en/careers/",
    displayName: "Capgemini",
  },
  "INFOSYS": {
    type: "url",
    url: "https://www.infosys.com/careers/",
    displayName: "Infosys",
  },
  "WIPRO": {
    type: "url",
    url: "https://careers.wipro.com/",
    displayName: "Wipro",
  },
  "HCL": {
    type: "url",
    url: "https://www.hcltech.com/careers",
    displayName: "HCL Technologies",
  },
  "THOUGHTWORKS": {
    type: "greenhouse",
    token: "thoughtworks",
    displayName: "Thoughtworks",
  },

  // ── Financial Services ─────────────────────────────────────────────────────
  "JPMORGAN CHASE BANK": {
    type: "url",
    url: "https://careers.jpmorgan.com/global/en/home",
    displayName: "JPMorgan Chase",
  },
  "GOLDMAN SACHS INTERNATIONAL": {
    type: "url",
    url: "https://www.goldmansachs.com/careers/",
    displayName: "Goldman Sachs",
  },
  "BARCLAYS": {
    type: "url",
    url: "https://search.jobs.barclays/",
    displayName: "Barclays",
  },
  "HSBC": {
    type: "url",
    url: "https://www.hsbc.com/careers",
    displayName: "HSBC",
  },
  "LLOYDS BANK": {
    type: "url",
    url: "https://jobs.lloydsbankinggroup.com/",
    displayName: "Lloyds Banking Group",
  },
  "STANDARD CHARTERED": {
    type: "url",
    url: "https://scb.taleo.net/careersection/jobsearch.ftl",
    displayName: "Standard Chartered",
  },
  "DEUTSCHE BANK": {
    type: "url",
    url: "https://careers.db.com/explore-the-bank/search-open-positions/",
    displayName: "Deutsche Bank",
  },
  "CITIBANK": {
    type: "url",
    url: "https://jobs.citi.com/",
    displayName: "Citi",
  },
  "MORGAN STANLEY": {
    type: "url",
    url: "https://www.morganstanley.com/people-opportunities/jobs/search-jobs",
    displayName: "Morgan Stanley",
  },
  "MONZO BANK": {
    type: "greenhouse",
    token: "monzo",
    displayName: "Monzo",
  },

  // ── Big Tech ──────────────────────────────────────────────────────────────
  "AMAZON UK SERVICES": {
    type: "url",
    url: "https://www.amazon.jobs/en-gb/search",
    displayName: "Amazon UK",
  },
  "AMAZON": {
    type: "url",
    url: "https://www.amazon.jobs/en-gb/search",
    displayName: "Amazon",
  },
  "FACEBOOK UK": {
    type: "url",
    url: "https://www.metacareers.com/jobs?offices[0]=London%2C+UK",
    displayName: "Meta (Facebook)",
  },
  "GOOGLE": {
    type: "url",
    url: "https://careers.google.com/jobs/results/?location=United+Kingdom",
    displayName: "Google",
  },
  "MICROSOFT": {
    type: "url",
    url: "https://careers.microsoft.com/us/en/search-results?keywords=&location=United+Kingdom",
    displayName: "Microsoft",
  },
  "APPLE": {
    type: "url",
    url: "https://jobs.apple.com/en-gb/search",
    displayName: "Apple",
  },

  // ── Fast-growth UK tech / startups ─────────────────────────────────────────
  "WAYVE": {
    type: "greenhouse",
    token: "wayve",
    displayName: "Wayve",
  },
  "SKYSCANNER": {
    type: "greenhouse",
    token: "skyscanner",
    displayName: "Skyscanner",
  },
  "FORM3": {
    type: "greenhouse",
    token: "form3",
    displayName: "Form3",
  },
  "CLEO AI": {
    type: "greenhouse",
    token: "cleo",
    displayName: "Cleo",
  },
  "REVOLUT": {
    type: "url",
    url: "https://www.revolut.com/careers/",
    displayName: "Revolut",
  },
  "DELIVEROO": {
    type: "url",
    url: "https://careers.deliveroo.co.uk/",
    displayName: "Deliveroo",
  },
  "WISE PAYMENTS": {
    type: "url",
    url: "https://wise.com/gb/careers",
    displayName: "Wise",
  },
  "OCADO": {
    type: "url",
    url: "https://www.ocadogroup.com/careers/",
    displayName: "Ocado",
  },
  "JUST EAT": {
    type: "url",
    url: "https://careers.justeattakeaway.com/global/en",
    displayName: "Just Eat",
  },

  // ── Pharma / Life Sciences ─────────────────────────────────────────────────
  "ASTRAZENECA": {
    type: "url",
    url: "https://careers.astrazeneca.com/search-jobs?location=United%20Kingdom",
    displayName: "AstraZeneca",
  },
  "GLAXOSMITHKLINE": {
    type: "url",
    url: "https://careers.gsk.com/en-gb/jobs",
    displayName: "GSK",
  },
  "PFIZER": {
    type: "url",
    url: "https://www.pfizer.com/about/careers/search",
    displayName: "Pfizer",
  },
  "JOHNSON JOHNSON": {
    type: "url",
    url: "https://jobs.jnj.com/?search=&location=United+Kingdom",
    displayName: "Johnson & Johnson",
  },

  // ── Retail / Hospitality ───────────────────────────────────────────────────
  "TESCO": {
    type: "url",
    url: "https://www.tesco-careers.com/",
    displayName: "Tesco",
  },
  "MARKS AND SPENCER": {
    type: "url",
    url: "https://careers.marksandspencer.com/",
    displayName: "M&S",
  },
  "SAINSBURYS": {
    type: "url",
    url: "https://jobs.sainsburys.co.uk/",
    displayName: "Sainsbury's",
  },
  "PRIMARK STORES": {
    type: "url",
    url: "https://primark.avature.net/careers",
    displayName: "Primark",
  },
  "MARRIOTT HOTELS": {
    type: "url",
    url: "https://jobs.marriott.com/marriott/jobs?locationName=United+Kingdom",
    displayName: "Marriott Hotels",
  },
  "HILTON UK": {
    type: "url",
    url: "https://jobs.hilton.com/en/search?locationCodes=GBR",
    displayName: "Hilton",
  },
  "IHG": {
    type: "url",
    url: "https://careers.ihg.com/search-jobs",
    displayName: "IHG Hotels",
  },

  // ── Professional / Other ─────────────────────────────────────────────────
  "ROLLS ROYCE": {
    type: "url",
    url: "https://careers.rolls-royce.com/gb/en/search-results",
    displayName: "Rolls-Royce",
  },
  "BAE SYSTEMS": {
    type: "url",
    url: "https://www.baesystems.com/en/careers",
    displayName: "BAE Systems",
  },
  "BT": {
    type: "url",
    url: "https://careers.bt.com/",
    displayName: "BT Group",
  },
  "VODAFONE": {
    type: "url",
    url: "https://careers.vodafone.com/search/?q=&locationsearch=United+Kingdom",
    displayName: "Vodafone",
  },
  "JLL": {
    type: "url",
    url: "https://jll.wd1.myworkdayjobs.com/JLL/jobs",
    displayName: "JLL",
  },
  "CBRE": {
    type: "url",
    url: "https://cbre.referrals.selectminds.com/",
    displayName: "CBRE",
  },
};

// ── Lookup function ──────────────────────────────────────────────────────────

/**
 * Find the careers entry for a sponsor by trying progressively shorter
 * normalised key matches.
 */
export function lookupCareers(organisationName: string): CareersEntry | null {
  const norm = normaliseCompanyName(organisationName);

  // Exact match
  if (CAREERS_TABLE[norm]) return CAREERS_TABLE[norm];

  // Check if any key is contained in the normalised name
  for (const key of Object.keys(CAREERS_TABLE)) {
    if (norm.startsWith(key) || norm.includes(key)) {
      return CAREERS_TABLE[key];
    }
  }

  // Build a fallback "Google it" URL for NHS Trusts
  if (
    organisationName.toLowerCase().includes("nhs") ||
    organisationName.toLowerCase().includes("hospital") ||
    organisationName.toLowerCase().includes("health") ||
    organisationName.toLowerCase().includes("trust")
  ) {
    const encoded = encodeURIComponent(organisationName);
    return {
      type: "nhs",
      url: `https://www.jobs.nhs.uk/candidate/search?keyword=&organisation=${encoded}`,
    };
  }

  return null;
}
