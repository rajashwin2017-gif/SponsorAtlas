import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth — only enabled when env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // No account, or an OAuth-only account with no password set.
        if (!user || !user.password) return null;
        if (user.status === "suspended") return null;

        const valid = await verifyPassword(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
          subscriptionTier: user.subscriptionTier,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      // Google sign-ins upsert a user record so they get the same role/tier
      // fields and dashboard experience as credentials-based accounts.
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          create: {
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
            emailVerified: new Date(), // Google has already verified this address
          },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });
        user.id = existing.id;
        user.role = existing.role;
        user.status = existing.status;
        user.subscriptionTier = existing.subscriptionTier;
        user.emailVerified = existing.emailVerified;
      }

      if (user.status === "suspended") return false;

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role!;
        token.status = user.status!;
        token.subscriptionTier = user.subscriptionTier!;
        token.emailVerified = user.emailVerified ? new Date(user.emailVerified).toISOString() : null;
      }

      // Re-sync from DB on explicit session refresh (e.g. after profile/plan
      // changes) so role/tier updates don't require a full re-login.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id } });
        if (fresh) {
          token.role = fresh.role;
          token.status = fresh.status;
          token.subscriptionTier = fresh.subscriptionTier;
          token.emailVerified = fresh.emailVerified ? fresh.emailVerified.toISOString() : null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.subscriptionTier = token.subscriptionTier;
      session.user.emailVerified = token.emailVerified;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
};
