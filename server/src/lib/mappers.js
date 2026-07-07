// Converts snake_case DB rows to the camelCase JSON shape the API returns.

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified,
    subscriptionTier: row.subscription_tier,
    subscriptionStatus: row.subscription_status,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    alertFrequency: row.alert_frequency,
    monthlyChecksUsed: row.monthly_checks_used,
    monthlyChecksLimit: row.monthly_checks_limit,
    createdAt: row.created_at,
  };
}

function mapSubscription(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan,
    interval: row.interval,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    createdAt: row.created_at,
    user: row.user_name !== undefined ? { id: row.user_id, name: row.user_name, email: row.user_email } : undefined,
  };
}

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    user: row.user_name !== undefined ? { id: row.user_id, name: row.user_name, email: row.user_email } : undefined,
  };
}

function mapInvoice(row) {
  if (!row) return null;
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    hostedInvoiceUrl: row.hosted_invoice_url,
    pdfUrl: row.pdf_url,
    createdAt: row.created_at,
  };
}

module.exports = { mapUser, mapSubscription, mapPayment, mapInvoice };
