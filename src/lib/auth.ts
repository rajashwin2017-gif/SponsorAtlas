import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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

    // Email + password credentials (demo mode — no DB required)
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // In production: look up user in DB + verify bcrypt hash.
        // In demo mode: accept any email with password length >= 6.
        if (credentials.password.length < 6) return null;

        return {
          id: `demo_${Buffer.from(credentials.email).toString("base64").slice(0, 8)}`,
          email: credentials.email,
          name: credentials.email.split("@")[0],
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subscriptionTier = token.subscriptionTier ?? "free";
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
};
