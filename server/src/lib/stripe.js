const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// price -> (plan, interval), built from the four Stripe Price IDs in .env.
const PRICE_MAP = {};
if (process.env.STRIPE_PRICE_PRO_MONTHLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_MONTHLY] = { plan: "pro", interval: "month" };
}
if (process.env.STRIPE_PRICE_PRO_YEARLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_YEARLY] = { plan: "pro", interval: "year" };
}
if (process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY] = { plan: "pro_plus", interval: "month" };
}
if (process.env.STRIPE_PRICE_PRO_PLUS_YEARLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_PLUS_YEARLY] = { plan: "pro_plus", interval: "year" };
}

function priceIdFor(plan, yearly) {
  const key =
    plan === "pro"
      ? yearly
        ? "STRIPE_PRICE_PRO_YEARLY"
        : "STRIPE_PRICE_PRO_MONTHLY"
      : yearly
      ? "STRIPE_PRICE_PRO_PLUS_YEARLY"
      : "STRIPE_PRICE_PRO_PLUS_MONTHLY";
  return process.env[key];
}

function planFromPriceId(priceId) {
  return PRICE_MAP[priceId];
}

module.exports = { stripe, priceIdFor, planFromPriceId };
