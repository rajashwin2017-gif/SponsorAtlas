import type { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "The Sponsor Finder API",
    version: "1.0.0",
    description:
      "REST API for The Sponsor Finder — UK visa sponsorship search platform. " +
      "Most endpoints require an authenticated session (cookie-based NextAuth). " +
      "Admin endpoints additionally require the ADMIN role.",
    contact: { email: "support@thesponsorfinder.com" },
  },
  servers: [
    { url: "https://thesponsorfinder.com", description: "Production" },
    { url: "http://localhost:3000", description: "Local development" },
  ],
  tags: [
    { name: "Auth", description: "Registration, email verification, password reset" },
    { name: "Sponsors", description: "Search and browse licensed UK visa sponsors" },
    { name: "Jobs", description: "Live job listings from employer ATS platforms" },
    { name: "Plans", description: "Subscription plan catalogue" },
    { name: "Fit Check", description: "AI-powered sponsorship fit scoring" },
    { name: "SOC Codes", description: "UK Standard Occupational Classification codes" },
    { name: "User", description: "Authenticated user profile and saved sponsors" },
    { name: "Billing", description: "Stripe subscriptions, invoices and billing portal" },
    { name: "Admin", description: "Admin-only management endpoints (ADMIN role required)" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "__Secure-next-auth.session-token",
        description: "NextAuth session cookie set after sign-in",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      Sponsor: {
        type: "object",
        properties: {
          id: { type: "string" },
          organisationName: { type: "string" },
          town: { type: "string" },
          county: { type: "string" },
          industryCategory: { type: "string" },
          licenceStatus: { type: "string", enum: ["Active", "Suspended", "Revoked"] },
          routeOfSponsor: { type: "string" },
          totalCosSince2020: { type: "integer" },
          hiringLikelihoodScore: { type: "integer", minimum: 0, maximum: 100 },
          lastUpdated: { type: "string", format: "date" },
        },
      },
      JobListing: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          location: { type: "string" },
          department: { type: "string" },
          employmentType: { type: "string" },
          applyUrl: { type: "string", format: "uri" },
          postedAt: { type: "string", format: "date-time" },
        },
      },
      Plan: {
        type: "object",
        properties: {
          planId: { type: "string", example: "pro" },
          name: { type: "string", example: "Pro" },
          tagline: { type: "string", nullable: true },
          badge: { type: "string", nullable: true },
          highlighted: { type: "boolean" },
          monthlyPriceMinor: { type: "integer", description: "Price in pence (GBP × 100)" },
          yearlyPriceMinor: { type: "integer" },
          features: { type: "array", items: { type: "string" } },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          image: { type: "string", nullable: true },
          role: { type: "string", enum: ["MEMBER", "ADMIN"] },
          emailVerified: { type: "string", format: "date-time", nullable: true },
          subscriptionTier: { type: "string", enum: ["free", "pro", "pro_plus"] },
          subscriptionStatus: { type: "string" },
          monthlyChecksUsed: { type: "integer" },
          monthlyChecksLimit: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Subscription: {
        type: "object",
        properties: {
          tier: { type: "string" },
          status: { type: "string" },
          plan: { type: "string", nullable: true },
          interval: { type: "string", enum: ["month", "year"], nullable: true },
          currentPeriodEnd: { type: "string", format: "date-time", nullable: true },
          cancelAtPeriodEnd: { type: "boolean" },
          hasBillingAccount: { type: "boolean" },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string" },
          amount: { type: "integer" },
          currency: { type: "string" },
          status: { type: "string" },
          hostedInvoiceUrl: { type: "string", nullable: true },
          pdfUrl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      FitResult: {
        type: "object",
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          salaryMatch: { type: "boolean" },
          gapAnalysis: { type: "string" },
          breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "integer" },
                max: { type: "integer" },
              },
            },
          },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                town: { type: "string" },
                score: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },

  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Smith" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", minLength: 6, example: "securePass123" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created — verification email sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/auth/verify-email": {
      get: {
        tags: ["Auth"],
        summary: "Verify email address (link from email)",
        parameters: [
          { in: "query", name: "token", required: true, schema: { type: "string" } },
          { in: "query", name: "email", required: true, schema: { type: "string" } },
        ],
        responses: {
          "302": { description: "Redirects to /login?verify=success or /login?verify=expired" },
        },
      },
    },

    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend email verification link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Email sent if account exists and is unverified" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },

    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reset email sent if account exists (always 200 to prevent enumeration)" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },

    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Set a new password using a reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password updated" },
          "400": { description: "Token invalid or expired" },
        },
      },
    },

    // ── Sponsors ──────────────────────────────────────────────────────────────
    "/api/sponsors": {
      get: {
        tags: ["Sponsors"],
        summary: "Search and filter UK visa sponsors",
        parameters: [
          { in: "query", name: "q", schema: { type: "string" }, description: "Free-text search" },
          { in: "query", name: "industry", schema: { type: "string" }, description: "Filter by industry (repeatable)" },
          { in: "query", name: "city", schema: { type: "string" }, description: "Filter by city (repeatable)" },
          { in: "query", name: "route", schema: { type: "string" }, description: "Filter by sponsor route (repeatable)" },
          { in: "query", name: "tier", schema: { type: "string" }, description: "Filter by licence tier (repeatable)" },
          { in: "query", name: "activity", schema: { type: "string" }, description: "Filter by hiring activity level" },
          { in: "query", name: "aRated", schema: { type: "string", enum: ["1"] }, description: "Only A-rated sponsors" },
          { in: "query", name: "minCos", schema: { type: "integer" }, description: "Minimum CoS issued since 2020" },
          {
            in: "query", name: "sort",
            schema: { type: "string", enum: ["relevance", "cos", "strength", "opportunity", "az"] },
          },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 12, maximum: 50 } },
        ],
        responses: {
          "200": {
            description: "Paginated sponsor list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Sponsor" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                    meta: {
                      type: "object",
                      properties: {
                        industries: { type: "array", items: { type: "string" } },
                        cities: { type: "array", items: { type: "string" } },
                        routes: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Jobs ──────────────────────────────────────────────────────────────────
    "/api/jobs/{sponsorId}": {
      get: {
        tags: ["Jobs"],
        summary: "Get live job listings for a specific sponsor",
        parameters: [
          { in: "path", name: "sponsorId", required: true, schema: { type: "string" } },
          { in: "query", name: "keyword", schema: { type: "string" }, description: "Filter jobs by keyword" },
        ],
        responses: {
          "200": {
            description: "Job listings for this sponsor",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sponsorId: { type: "string" },
                    companyName: { type: "string" },
                    source: { type: "string", enum: ["greenhouse", "lever", "workable", "nhs", "url", "none"] },
                    careersUrl: { type: "string", nullable: true },
                    jobs: { type: "array", items: { $ref: "#/components/schemas/JobListing" } },
                    totalJobs: { type: "integer" },
                  },
                },
              },
            },
          },
          "404": { description: "Sponsor not found" },
        },
      },
    },

    // ── Plans ─────────────────────────────────────────────────────────────────
    "/api/plans": {
      get: {
        tags: ["Plans"],
        summary: "List all active subscription plans",
        responses: {
          "200": {
            description: "Array of active plans ordered by display order",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Plan" } },
              },
            },
          },
        },
      },
    },

    // ── SOC Codes ─────────────────────────────────────────────────────────────
    "/api/soc-codes": {
      get: {
        tags: ["SOC Codes"],
        summary: "Search UK Standard Occupational Classification codes",
        parameters: [
          { in: "query", name: "q", schema: { type: "string" }, description: "Search by code, title or industry" },
        ],
        responses: {
          "200": {
            description: "Matching SOC codes with going rates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          socCode: { type: "string", example: "2136" },
                          occupationTitle: { type: "string" },
                          goingRate2026: { type: "number" },
                          lowerRate2026: { type: "number" },
                          industryCategory: { type: "string" },
                        },
                      },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Fit Check ─────────────────────────────────────────────────────────────
    "/api/fit-check": {
      post: {
        tags: ["Fit Check"],
        summary: "Score how well a user fits a sponsor's profile",
        description: "Requires authentication. Rate limited to 30 requests per hour per user.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sponsorId", "jobTitle", "desiredSalary"],
                properties: {
                  sponsorId: { type: "string" },
                  jobTitle: { type: "string", example: "Software Engineer" },
                  yearsExperience: { type: "integer", example: 3 },
                  desiredSalary: { type: "integer", example: 45000, description: "Annual salary in GBP" },
                  location: { type: "string", example: "London" },
                  industry: { type: "string", example: "Technology" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Fit score and analysis", content: { "application/json": { schema: { $ref: "#/components/schemas/FitResult" } } } },
          "401": { description: "Not authenticated" },
          "422": { description: "Missing required fields" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },

    // ── User ──────────────────────────────────────────────────────────────────
    "/api/user/profile": {
      get: {
        tags: ["User"],
        summary: "Get authenticated user's profile",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
          "401": { description: "Not authenticated" },
        },
      },
      patch: {
        tags: ["User"],
        summary: "Update user profile",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 100 },
                  alertFrequency: { type: "string", enum: ["daily", "weekly", "none"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated profile" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/user/saved-sponsors": {
      get: {
        tags: ["User"],
        summary: "Get user's saved sponsors",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "List of saved sponsor IDs",
            content: { "application/json": { schema: { type: "object", properties: { savedIds: { type: "array", items: { type: "string" } } } } } },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/user/saved-sponsors/{sponsorId}": {
      put: {
        tags: ["User"],
        summary: "Save a sponsor",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "sponsorId", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Sponsor saved" },
          "401": { description: "Not authenticated" },
        },
      },
      delete: {
        tags: ["User"],
        summary: "Remove a saved sponsor",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "sponsorId", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Sponsor removed" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ── Billing ───────────────────────────────────────────────────────────────
    "/api/user/subscription": {
      get: {
        tags: ["Billing"],
        summary: "Get current subscription status",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Subscription details", content: { "application/json": { schema: { $ref: "#/components/schemas/Subscription" } } } },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/user/subscription/cancel": {
      post: {
        tags: ["Billing"],
        summary: "Cancel subscription at end of billing period",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Cancellation scheduled",
            content: { "application/json": { schema: { type: "object", properties: { cancelAtPeriodEnd: { type: "boolean" } } } } },
          },
          "400": { description: "No active subscription" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/user/subscription/reactivate": {
      post: {
        tags: ["Billing"],
        summary: "Reactivate a subscription pending cancellation",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Cancellation reversed" },
          "400": { description: "No subscription pending cancellation" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/user/invoices": {
      get: {
        tags: ["Billing"],
        summary: "List invoices for the authenticated user",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Invoice list",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Invoice" } } } },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/stripe/checkout": {
      post: {
        tags: ["Billing"],
        summary: "Create a Stripe Checkout session",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["plan"],
                properties: {
                  plan: { type: "string", enum: ["pro", "pro_plus"], example: "pro" },
                  yearly: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Stripe hosted checkout URL",
            content: { "application/json": { schema: { type: "object", properties: { url: { type: "string", format: "uri" } } } } },
          },
          "400": { description: "Invalid plan" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/stripe/change-plan": {
      post: {
        tags: ["Billing"],
        summary: "Switch plan for an existing active subscription",
        description: "Updates the subscription in-place to avoid creating a second subscription (which would cause double billing). Upgrades charge a prorated difference immediately.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["plan"],
                properties: {
                  plan: { type: "string", enum: ["pro", "pro_plus"] },
                  yearly: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Plan changed", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, plan: { type: "string" }, interval: { type: "string" } } } } } },
          "400": { description: "No active subscription" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    "/api/stripe/portal": {
      post: {
        tags: ["Billing"],
        summary: "Open Stripe customer billing portal",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Portal session URL",
            content: { "application/json": { schema: { type: "object", properties: { url: { type: "string", format: "uri" } } } } },
          },
          "400": { description: "No billing account" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Platform-wide statistics",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "User counts, revenue estimates and recent activity" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users",
        security: [{ sessionCookie: [] }],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" }, description: "Search by name or email" },
          { in: "query", name: "role", schema: { type: "string", enum: ["MEMBER", "ADMIN"] } },
          { in: "query", name: "status", schema: { type: "string", enum: ["active", "suspended"] } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated user list" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/users/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a user's role or status",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string", enum: ["MEMBER", "ADMIN"] },
                  status: { type: "string", enum: ["active", "suspended"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User updated" },
          "400": { description: "Cannot demote/suspend own account" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/payments": {
      get: {
        tags: ["Admin"],
        summary: "List all payments",
        security: [{ sessionCookie: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Paginated payment list" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/payments/{id}/refund": {
      post: {
        tags: ["Admin"],
        summary: "Issue a refund for a payment",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, description: "Payment ID" }],
        responses: {
          "200": { description: "Refund issued" },
          "403": { description: "Admin role required" },
          "404": { description: "Payment not found" },
        },
      },
    },

    "/api/admin/subscriptions": {
      get: {
        tags: ["Admin"],
        summary: "List all subscriptions",
        security: [{ sessionCookie: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Paginated subscription list" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/plans": {
      get: {
        tags: ["Admin"],
        summary: "List all plans including inactive ones",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "All plans" },
          "403": { description: "Admin role required" },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new plan",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Plan" },
            },
          },
        },
        responses: {
          "201": { description: "Plan created" },
          "403": { description: "Admin role required" },
        },
      },
    },

    "/api/admin/plans/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a plan",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Plan" } } },
        },
        responses: {
          "200": { description: "Plan updated" },
          "403": { description: "Admin role required" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a plan",
        security: [{ sessionCookie: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Plan deleted" },
          "403": { description: "Admin role required" },
        },
      },
    },
  },
};
