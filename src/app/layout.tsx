import type { Metadata } from "next";
import { Inter, JetBrains_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CustomCursor } from "@/components/custom-cursor";
import { AuthSessionProvider } from "@/components/session-provider";
import { DevTierUnlock } from "@/components/dev-tier-unlock";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
// Classic Garamond serif for hero / section headings — formal, elegant, authoritative.
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sponsoratlas.app"),
  title: {
    default: "The Sponsor Finder · Find UK Employers That Actually Sponsor Visas",
    template: "%s · The Sponsor Finder",
  },
  description:
    "126,000+ UK Skilled Worker sponsors indexed with real hiring signals, CoS activity and salary compatibility. Stop applying blindly to weak sponsors.",
  keywords: [
    "UK visa sponsorship", "Skilled Worker visa", "sponsor licence", "Certificate of Sponsorship",
    "Health and Care visa", "UK jobs visa sponsorship",
  ],
  openGraph: {
    title: "The Sponsor Finder · UK Visa Sponsorship Intelligence",
    description: "Real hiring signals from 126,000+ UK sponsors. No more guessing.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} ${ebGaramond.variable} font-sans`}>
        {/* Dev-only: auto-unlock Pro+ for local testing. Never runs in production. */}
        {process.env.NODE_ENV !== "production" && <DevTierUnlock />}
        <AuthSessionProvider>
          <ToastProvider>
            <CustomCursor />
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
