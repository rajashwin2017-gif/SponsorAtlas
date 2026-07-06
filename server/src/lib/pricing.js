// Mirrors src/lib/pricing.ts in the Next.js app — kept in sync manually
// since these are two separate deployments of the same product.
const PLANS = [
  { id: "pro", monthlyPrice: "£19.99", yearlyPrice: "£99.99" },
  { id: "pro_plus", monthlyPrice: "£29.99", yearlyPrice: "£149.99" },
];

module.exports = { PLANS };
