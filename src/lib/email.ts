import nodemailer from "nodemailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://thesponsorfinder.com";
const BRAND = "The Sponsor Finder";
const FROM = process.env.EMAIL_FROM ?? `${BRAND} <${process.env.GMAIL_USER ?? "noreply@thesponsorfinder.com"}>`;

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// Without GMAIL_USER + GMAIL_APP_PASSWORD (local dev / demo mode) we log the
// email instead of sending, so auth + subscription flows are testable offline.
async function send(to: string, subject: string, html: string, logLabel: string) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[email:${logLabel}] → ${to} | ${subject}`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

// ─── Shared HTML shell ───────────────────────────────────────────────────────
// All inline CSS — email clients don't support external stylesheets.

function emailBase(previewText: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${BRAND}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f4f4f5;">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <a href="${APP_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#dc2626;letter-spacing:-0.5px;">${BRAND}</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px 40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">
                &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                Questions? Email us at
                <a href="mailto:support@thesponsorfinder.com" style="color:#dc2626;text-decoration:none;">support@thesponsorfinder.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;letter-spacing:0.1px;">${label}</a>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0;" />`;
}

const PLAN_LABEL: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro Plus",
};

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "Active sponsorship vacancies",
    "Direct employer application links",
    "Unlimited searches & advanced filtering",
    "Save favourite employers & jobs",
    "Email alerts & notifications",
    "Sponsorship insights",
  ],
  pro_plus: [
    "Everything in Pro",
    "Premium candidate profile",
    "AI CV matching",
    "Interview preparation resources",
    "Priority job alerts & employer recommendations",
    "Priority customer support",
  ],
};

// ─── Email functions ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, verifyUrl: string, name?: string) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = emailBase(
    "Confirm your email to start your job search",
    `<h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#09090b;letter-spacing:-0.5px;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">${greeting}<br/>
    Welcome to ${BRAND}! Please confirm your email address to activate your account and start finding UK sponsorship opportunities.</p>

    <div style="text-align:center;padding:4px 0 32px;">
      ${btn("Confirm email address", verifyUrl)}
    </div>

    ${divider()}
    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
      This link expires in <strong>24 hours</strong>. If the button above doesn't work, paste this URL into your browser:<br/>
      <a href="${verifyUrl}" style="color:#dc2626;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#a1a1aa;">If you didn't create an account, you can safely ignore this email.</p>`
  );

  await send(to, `Verify your ${BRAND} email`, html, "verify-email");
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = emailBase(
    "Reset your password — link expires in 1 hour",
    `<h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#09090b;letter-spacing:-0.5px;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      We received a request to reset your ${BRAND} password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
    </p>

    <div style="text-align:center;padding:4px 0 32px;">
      ${btn("Reset my password", resetUrl)}
    </div>

    ${divider()}
    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
      If the button doesn't work, paste this URL into your browser:<br/>
      <a href="${resetUrl}" style="color:#dc2626;word-break:break-all;">${resetUrl}</a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#a1a1aa;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>`
  );

  await send(to, `Reset your ${BRAND} password`, html, "password-reset");
}

export async function sendSubscriptionEmail(
  to: string,
  opts: {
    name: string | null;
    plan: string;
    interval: "month" | "year";
    amountMinor: number;
    currency: string;
  }
) {
  const planLabel = PLAN_LABEL[opts.plan] ?? opts.plan;
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const intervalLabel = opts.interval === "year" ? "yearly" : "monthly";
  const amount = (opts.amountMinor / 100).toFixed(2);
  const currencySymbol = opts.currency.toUpperCase() === "GBP" ? "£" : opts.currency.toUpperCase() + " ";
  const features = PLAN_FEATURES[opts.plan] ?? [];

  const featureList = features
    .map(
      (f) =>
        `<tr><td style="padding:5px 0;vertical-align:top;">
          <span style="color:#dc2626;font-size:16px;line-height:1;">✓</span>
        </td><td style="padding:5px 0 5px 10px;font-size:14px;color:#3f3f46;">${f}</td></tr>`
    )
    .join("");

  const html = emailBase(
    `You're now on ${BRAND} ${planLabel} — here's what you've unlocked`,
    `<!-- Red accent bar -->
    <div style="background:linear-gradient(135deg,#dc2626,#7f1d1d);border-radius:8px;padding:24px 28px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;">Subscription confirmed</p>
      <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${planLabel} Plan</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">${currencySymbol}${amount} · billed ${intervalLabel}</p>
    </div>

    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#09090b;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      Thank you for choosing ${BRAND} ${planLabel}. Your subscription is now active and everything below is unlocked for you.
    </p>

    <!-- Features -->
    <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;">What you've unlocked</p>
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        ${featureList}
      </table>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      ${btn("Go to my dashboard →", `${APP_URL}/dashboard`)}
    </div>

    ${divider()}
    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
      You can manage your subscription, download invoices, or cancel at any time from your
      <a href="${APP_URL}/dashboard" style="color:#dc2626;text-decoration:none;">dashboard</a>.
      If you have any questions, reply to this email or contact
      <a href="mailto:support@thesponsorfinder.com" style="color:#dc2626;text-decoration:none;">support@thesponsorfinder.com</a>.
    </p>`
  );

  await send(
    to,
    `You're on ${BRAND} ${planLabel} — thank you!`,
    html,
    "subscription-confirmed"
  );
}

export async function sendPlanChangedEmail(
  to: string,
  opts: {
    name: string | null;
    oldPlan: string;
    newPlan: string;
    interval: "month" | "year";
  }
) {
  const newLabel = PLAN_LABEL[opts.newPlan] ?? opts.newPlan;
  const oldLabel = PLAN_LABEL[opts.oldPlan] ?? opts.oldPlan;
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const isUpgrade = opts.newPlan === "pro_plus" && opts.oldPlan === "pro";
  const actionLabel = isUpgrade ? "upgraded" : "switched";

  const html = emailBase(
    `Your plan has been updated to ${BRAND} ${newLabel}`,
    `<h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#09090b;letter-spacing:-0.5px;">
      Plan ${isUpgrade ? "upgrade" : "change"} confirmed
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      ${greeting}<br/>
      You've successfully ${actionLabel} from <strong>${oldLabel}</strong> to <strong>${newLabel}</strong>.
      ${isUpgrade ? "The prorated difference has been charged to your payment method." : "A credit has been applied to your next invoice."}
    </p>

    <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr>
          <td style="font-size:13px;color:#71717a;">Previous plan</td>
          <td style="font-size:14px;font-weight:600;color:#3f3f46;text-align:right;">${oldLabel}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#71717a;padding-top:10px;">New plan</td>
          <td style="font-size:14px;font-weight:700;color:#dc2626;text-align:right;padding-top:10px;">${newLabel}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      ${btn("Go to my dashboard →", `${APP_URL}/dashboard`)}
    </div>

    ${divider()}
    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
      To manage your subscription or view invoices, visit your
      <a href="${APP_URL}/dashboard" style="color:#dc2626;text-decoration:none;">dashboard</a>.
      Questions? Contact <a href="mailto:support@thesponsorfinder.com" style="color:#dc2626;text-decoration:none;">support@thesponsorfinder.com</a>.
    </p>`
  );

  await send(
    to,
    `Your plan has been updated to ${BRAND} ${newLabel}`,
    html,
    "plan-changed"
  );
}
