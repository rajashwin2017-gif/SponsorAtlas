import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | The Sponsor Finder",
  description: "How The Sponsor Finder uses cookies and similar technologies.",
};

const LAST_UPDATED = "11 July 2026";
const COMPANY = "The Sponsor Finder";
const EMAIL = "support@thesponsorfinder.com";

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10">

        <Section title="1. What are cookies?">
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They are widely
            used to make websites work, improve performance, and provide information to the site owner.
          </p>
        </Section>

        <Section title="2. How we use cookies">
          <p>
            {COMPANY} uses a minimal set of cookies. We do <strong>not</strong> use advertising cookies,
            third-party tracking cookies, or analytics cookies that identify you personally.
          </p>
        </Section>

        <Section title="3. Cookies we set">
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-foreground">Cookie name</th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground">Purpose</th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground">Type</th>
                  <th className="text-left py-2 font-medium text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <CookieRow
                  name="__Secure-next-auth.session-token"
                  purpose="Keeps you signed in between page loads. Contains an encrypted reference to your session."
                  type="Essential"
                  duration="30 days"
                />
                <CookieRow
                  name="__Host-next-auth.csrf-token"
                  purpose="Protects against Cross-Site Request Forgery (CSRF) attacks on form submissions."
                  type="Essential"
                  duration="Session"
                />
                <CookieRow
                  name="__Secure-next-auth.callback-url"
                  purpose="Remembers where to redirect you after sign-in."
                  type="Essential"
                  duration="Session"
                />
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            All cookies we set are marked <code>HttpOnly</code> (not accessible to JavaScript) and{" "}
            <code>Secure</code> (only sent over HTTPS), and use <code>SameSite=Lax</code> to prevent CSRF.
          </p>
        </Section>

        <Section title="4. Third-party cookies">
          <p>
            <strong>Stripe</strong> — When you go through a payment checkout, Stripe may set cookies on their
            hosted checkout pages to prevent fraud and remember your session. These are governed by{" "}
            <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">
              Stripe's Privacy Policy
            </a>
            .
          </p>
          <p>
            <strong>Google</strong> — If you sign in with Google, Google's OAuth flow may set cookies on Google's
            own domain. These are governed by{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google's Privacy Policy
            </a>
            .
          </p>
          <p>
            We do <strong>not</strong> embed any advertising networks, social media trackers, or third-party
            analytics tools on our pages.
          </p>
        </Section>

        <Section title="5. Essential cookies and consent">
          <p>
            The cookies we set are strictly necessary for the Service to function — without them you cannot sign
            in or remain authenticated. Under UK GDPR and PECR, strictly necessary cookies do not require your
            consent. We do not set any non-essential cookies that would require a consent banner.
          </p>
        </Section>

        <Section title="6. Managing cookies">
          <p>
            You can control and delete cookies through your browser settings. Please note that disabling cookies
            will prevent you from signing in to {COMPANY}. Common browser guides:
          </p>
          <ul>
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </Section>

        <Section title="7. Changes to this policy">
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an
            updated "Last updated" date.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            If you have any questions about our use of cookies, contact us at{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
          <p>
            See also our <Link href="/privacy">Privacy Policy</Link> and{" "}
            <Link href="/terms">Terms of Service</Link>.
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
      <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-red-600 [&_a]:underline-offset-2 [&_a]:hover:underline">
        {children}
      </div>
    </section>
  );
}

function CookieRow({
  name, purpose, type, duration,
}: {
  name: string; purpose: string; type: string; duration: string;
}) {
  return (
    <tr>
      <td className="py-3 pr-4 font-mono text-xs text-foreground align-top">{name}</td>
      <td className="py-3 pr-4 align-top">{purpose}</td>
      <td className="py-3 pr-4 align-top">
        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {type}
        </span>
      </td>
      <td className="py-3 align-top">{duration}</td>
    </tr>
  );
}
