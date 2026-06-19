import Link from "next/link";
import { Globe2, ShieldCheck } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/search", label: "Sponsor Search" },
      { href: "/soc-codes", label: "SOC Code Intelligence" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/search", label: "How it works" },
      { href: "/soc-codes", label: "Salary thresholds" },
      { href: "/pricing", label: "Compare plans" },
      { href: "/", label: "Open Government Data" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Privacy" },
      { href: "/", label: "Terms" },
      { href: "/", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-zinc-950 text-zinc-300">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-white">
              <span className="grid size-8 place-items-center rounded-lg bg-red-600 text-white">
                <Globe2 className="size-5" />
              </span>
              Sponsor<span className="text-red-500">Atlas</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">
              UK visa sponsorship intelligence. Find employers with proven sponsorship history and
              real hiring signals.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Persistent legal disclaimer — appears on every page */}
        <div className="mt-12 rounded-xl border border-red-600/30 bg-red-600/[0.08] p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-red-400">Important:</span> SponsorAtlas is an
              informational research platform. We do not provide immigration advice, legal advice, or
              guarantee visa sponsorship or employment. All data is sourced from publicly available UK
              government records under the{" "}
              <a
                href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-white"
              >
                Open Government Licence v3.0
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SponsorAtlas. All rights reserved.</p>
          <p className="tabular">Data last refreshed: 17 June 2026</p>
        </div>
      </div>
    </footer>
  );
}
