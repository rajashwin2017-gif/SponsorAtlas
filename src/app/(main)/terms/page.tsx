import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | The Sponsor Finder",
  description: "Terms and conditions for using The Sponsor Finder platform.",
};

const LAST_UPDATED = "11 July 2026";
const COMPANY = "The Sponsor Finder";
const EMAIL = "support@thesponsorfinder.com";
const URL = "https://thesponsorfinder.com";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 max-w-none">

        <Section title="1. Agreement to these terms">
          <p>
            By accessing or using {COMPANY} ("<strong>the Service</strong>") at <a href={URL}>{URL}</a>, you agree
            to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
          <p>
            We may update these Terms at any time. Continued use of the Service after changes are posted
            constitutes your acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="2. Description of the Service">
          <p>
            {COMPANY} provides a search and research platform that aggregates publicly available UK visa
            sponsorship data from the Home Office licensed sponsor register. The Service also provides:
          </p>
          <ul>
            <li>Live job listings sourced from employer ATS platforms (Greenhouse, Lever, Workable)</li>
            <li>Sponsorship fit scoring tools</li>
            <li>SOC code and salary going-rate data</li>
            <li>Saved sponsors and job alert features (Pro and Pro Plus subscribers)</li>
          </ul>
        </Section>

        <Section title="3. Important disclaimer">
          <p>
            <strong>
              {COMPANY} is an informational research platform only. We do not provide immigration advice, legal
              advice, or employment advice.
            </strong>
          </p>
          <ul>
            <li>
              We do <strong>not</strong> guarantee that any sponsor will offer you employment or sponsorship.
            </li>
            <li>
              Sponsor data is sourced from public UK government records (Home Office register) and may not reflect
              real-time changes. Always verify information directly with the employer.
            </li>
            <li>
              Job listings are fetched live from employer ATS platforms. We do not guarantee their accuracy,
              availability, or that any role offers visa sponsorship.
            </li>
            <li>
              Salary going-rate figures are based on publicly published Home Office guidance and are indicative
              only — not legal or financial advice.
            </li>
          </ul>
          <p>
            If you need immigration or legal advice, please consult a qualified solicitor or OISC-regulated
            immigration adviser.
          </p>
        </Section>

        <Section title="4. Account registration">
          <ul>
            <li>You must be at least 16 years old to create an account.</li>
            <li>You are responsible for maintaining the security of your password.</li>
            <li>You must provide accurate and truthful information when registering.</li>
            <li>
              You are responsible for all activity that occurs under your account. Notify us immediately at{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a> if you suspect unauthorised access.
            </li>
          </ul>
        </Section>

        <Section title="5. Subscriptions and billing">
          <h3>Plans</h3>
          <p>
            We offer Free, Pro and Pro Plus subscription plans. Paid plans are billed monthly or annually in GBP
            via Stripe. Prices are shown inclusive of any applicable taxes.
          </p>
          <h3>Cancellation</h3>
          <p>
            You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the end
            of your current billing period — you retain access until then. We do not offer refunds for partial
            billing periods.
          </p>
          <h3>Refunds</h3>
          <p>
            Refunds are issued at our discretion. If you believe you have been charged in error, contact us within
            14 days at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
          <h3>Price changes</h3>
          <p>
            We reserve the right to change subscription prices. We will give you at least 30 days' notice of any
            price increase. If you do not wish to continue at the new price, you may cancel before the change takes
            effect.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, crawl, or systematically download data from the Service using automated tools</li>
            <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
            <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure</li>
            <li>Interfere with or disrupt the Service or servers connected to it</li>
            <li>Reproduce, distribute, or resell data from the Service without our written permission</li>
            <li>Use the Service to harass, abuse, or harm any person</li>
            <li>Impersonate any person or entity</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate your account immediately if you breach these terms.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p>
            The Service, including its design, software, and content (excluding data sourced from the UK
            government under the Open Government Licence), is owned by {COMPANY} and protected by copyright and
            other intellectual property laws.
          </p>
          <p>
            UK government sponsor register data is used under the{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Government Licence v3.0
            </a>
            .
          </p>
          <p>
            You may use the Service for your personal, non-commercial job search and research purposes only. You
            may not reproduce or redistribute content from the Service without our prior written consent.
          </p>
        </Section>

        <Section title="8. Third-party services">
          <p>
            The Service integrates with third-party services including Stripe (payments) and Google (OAuth
            sign-in). Your use of those services is governed by their respective terms and privacy policies.
            We are not responsible for the content or practices of third-party websites or services linked from
            the Service.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the fullest extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of or inability to use the Service,
            including but not limited to loss of earnings, loss of data, or failure to obtain visa sponsorship.
          </p>
          <p>
            Our total liability to you for any claim arising from these Terms or your use of the Service shall not
            exceed the amount you paid to us in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These Terms are governed by and construed in accordance with the laws of England and Wales. Any
            disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For any questions about these Terms, contact us at:{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>
            See also our <Link href="/privacy">Privacy Policy</Link> and{" "}
            <Link href="/cookies">Cookie Policy</Link>.
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-red-600 [&_a]:underline-offset-2 [&_a]:hover:underline [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
