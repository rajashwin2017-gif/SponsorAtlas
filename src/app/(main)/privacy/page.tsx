import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | The Sponsor Finder",
  description: "How The Sponsor Finder collects, uses and protects your personal data.",
};

const LAST_UPDATED = "11 July 2026";
const COMPANY = "The Sponsor Finder";
const EMAIL = "support@thesponsorfinder.com";
const URL = "https://thesponsorfinder.com";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-zinc dark:prose-invert mt-10 max-w-none">

        <Section title="1. Who we are">
          <p>
            {COMPANY} ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") operates the website at{" "}
            <a href={URL}>{URL}</a> (the "<strong>Service</strong>"). We are the data controller for the personal
            information we collect about you.
          </p>
          <p>
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <h3>Account information</h3>
          <ul>
            <li>Name and email address (when you register)</li>
            <li>Profile picture (if you sign in with Google)</li>
            <li>Password (stored as a secure hash — we never store your password in plain text)</li>
          </ul>
          <h3>Subscription and billing</h3>
          <ul>
            <li>Subscription plan, billing interval and payment status</li>
            <li>Payment card details are handled entirely by Stripe — we never see or store your card number</li>
            <li>Invoice history</li>
          </ul>
          <h3>Usage data</h3>
          <ul>
            <li>Sponsors you save or view</li>
            <li>Fit checks you run and the inputs you provide</li>
            <li>Job alert preferences</li>
            <li>IP address and browser type (for security and rate limiting)</li>
          </ul>
          <h3>Communications</h3>
          <ul>
            <li>Emails you send to our support address</li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <p>We use your data to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>Process subscription payments via Stripe</li>
            <li>Deliver the features of the Service (search, fit checks, saved sponsors, job alerts)</li>
            <li>Send transactional emails (email verification, password reset, subscription confirmations)</li>
            <li>Protect against fraud and abuse (rate limiting, security monitoring)</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data to third parties. We do not use your data for
            automated profiling that produces legal or similarly significant effects.
          </p>
        </Section>

        <Section title="4. Legal basis for processing (UK GDPR)">
          <ul>
            <li>
              <strong>Contract</strong> — processing necessary to provide the Service you signed up for (account
              management, subscriptions, job alerts).
            </li>
            <li>
              <strong>Legitimate interests</strong> — security monitoring, fraud prevention, improving the Service.
            </li>
            <li>
              <strong>Legal obligation</strong> — where we are required to process data by law.
            </li>
            <li>
              <strong>Consent</strong> — for optional cookies and marketing communications (where applicable).
            </li>
          </ul>
        </Section>

        <Section title="5. Data sharing">
          <p>We share your data only with the following categories of recipients:</p>
          <ul>
            <li>
              <strong>Stripe</strong> — payment processing. Stripe is PCI-DSS compliant. See{" "}
              <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">
                Stripe's Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Google</strong> — if you choose to sign in with Google, your Google profile is shared with us
              under Google's OAuth flow.
            </li>
            <li>
              <strong>Hosting infrastructure</strong> — our server and database providers who process data on our
              behalf under data processing agreements.
            </li>
            <li>
              <strong>Law enforcement</strong> — if required by applicable law or a valid legal request.
            </li>
          </ul>
        </Section>

        <Section title="6. Data retention">
          <p>
            We retain your account data for as long as your account is active. If you delete your account, we will
            delete or anonymise your personal data within 30 days, except where we are required to retain it for
            legal or financial compliance purposes (e.g. invoices are retained for 7 years under UK tax law).
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>Under UK GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Rectification</strong> — ask us to correct inaccurate data</li>
            <li><strong>Erasure</strong> — ask us to delete your data ("right to be forgotten")</li>
            <li><strong>Restriction</strong> — ask us to limit how we process your data</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Object</strong> — object to processing based on legitimate interests</li>
            <li><strong>Withdraw consent</strong> — at any time, where processing is based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We will respond within 30 days.
          </p>
          <p>
            You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
              ico.org.uk
            </a>
            .
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use essential cookies to keep you signed in and protect against CSRF attacks. For full details see
            our <Link href="/cookies">Cookie Policy</Link>.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We use industry-standard security measures including HTTPS, password hashing (bcrypt), and secure
            session tokens. No method of transmission over the internet is 100% secure; we cannot guarantee
            absolute security but we take reasonable steps to protect your data.
          </p>
        </Section>

        <Section title="10. Children">
          <p>
            The Service is not directed at children under the age of 16. We do not knowingly collect personal data
            from children. If you believe a child has provided us with personal data, please contact us and we will
            delete it.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email
            or by posting a notice on the Service. The "Last updated" date at the top of this page reflects the
            most recent revision.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            {COMPANY}
            <br />
            Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <br />
            Website: <a href={URL}>{URL}</a>
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
      <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
