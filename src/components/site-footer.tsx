import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Instagram, Facebook, MapPin, Mail } from "lucide-react";
import { FooterBackToTop } from "@/components/footer-back-to-top";

const ADMIN_LOGIN_URL = "/admin-login";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Sponsor Search" },
  { href: "/jobs", label: "Job Board" },
  { href: "/soc-codes", label: "SOC Codes" },
  { href: "/pricing", label: "Pricing" },
];

const SOCIAL = [
  { href: "https://www.instagram.com/thesponsorfinder?igsh=bzl0dms0dWY1eDUx&utm_source=qr", label: "Instagram", icon: Instagram },
  { href: "https://www.facebook.com/people/The-Sponsor-Finder/61591567151804/?mibextid=wwXIfr&rdid=VerZBJVfsneaFJNX&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AqS1q1Wj4%2F%3Fmibextid%3DwwXIfr%26ref%3D1", label: "Facebook", icon: Facebook },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-zinc-950 text-zinc-300">
      <div className="container relative z-10 pt-16 pb-28 md:pb-[11vw]">
        {/* Top: brand + columns */}
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-white">
              <Image src="/logo-mark.png" alt="The Sponsor Finder" width={32} height={30} className="size-8 w-auto" />
              The Sponsor<span className="text-red-500"> Finder</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              UK visa sponsorship intelligence. Find employers with proven sponsorship history and
              real hiring signals.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-white">Contact Us</h3>
            <address className="mt-5 space-y-3 text-sm not-italic text-zinc-400">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                United Kingdom
              </p>
              <p>
                <a href="mailto:hello@thesponsorfinder.app" className="flex items-center gap-2.5 font-medium text-white transition-colors hover:text-red-400">
                  <Mail className="size-4 shrink-0 text-red-500" aria-hidden="true" />
                  hello@thesponsorfinder.app
                </a>
              </p>
            </address>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-white">Quick Links</h3>
            <ul className="mt-5 space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-white">Social</h3>
            <ul className="mt-5 space-y-3">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    <s.icon className="size-4 text-zinc-500 transition-colors group-hover:text-red-500" aria-hidden="true" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Persistent legal disclaimer — appears on every page */}
        <div className="mt-12 rounded-xl border border-red-600/30 bg-red-600/[0.08] p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-red-400">Important:</span> The Sponsor Finder is an
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

        {/* Divider + bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} The Sponsor Finder. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
            <a href={ADMIN_LOGIN_URL} className="flex items-center gap-1.5 transition-colors hover:text-white">
              <ShieldCheck className="size-3.5" /> Admin Login
            </a>
          </nav>
        </div>
      </div>

      {/* Oversized watermark wordmark — scales to fit the width so the full name always shows */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 1200 160" className="w-full translate-y-[8%]" role="presentation" focusable="false">
          <text
            x="600"
            y="120"
            textAnchor="middle"
            textLength="1160"
            lengthAdjust="spacingAndGlyphs"
            fontSize="128"
            fontWeight="700"
            fill="rgba(255,255,255,0.05)"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The Sponsor Finder
          </text>
        </svg>
      </div>

      <FooterBackToTop />
    </footer>
  );
}
