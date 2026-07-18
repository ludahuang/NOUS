import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

import {
  isDatabaseConfigured,
  isGithubAuthConfigured,
  isLocalDevAuthEnabled,
  requireEnv,
} from "@/lib/env";
import { ensureUserProvisioned } from "@/lib/workspace";

function getProviders() {
  if (isGithubAuthConfigured()) {
    return [
      GitHubProvider({
        clientId: requireEnv("GITHUB_ID"),
        clientSecret: requireEnv("GITHUB_SECRET"),
      }),
    ];
  }

  if (!isLocalDevAuthEnabled()) {
    return [];
  }

  return [
    CredentialsProvider({
      id: "dev-local",
      name: "Local Development",
      credentials: {},
      async authorize() {
        if (!isDatabaseConfigured()) {
          return null;
        }

        const email =
          process.env.DEV_LOCAL_AUTH_EMAIL || "mini@local.the-vault";
        const name =
          process.env.DEV_LOCAL_AUTH_NAME || "Local Developer";
        const provisioned = await ensureUserProvisioned({
          provider: "dev-local",
          providerAccountId: email,
          email,
          name,
          image: null,
        });

        return {
          id: provisioned.userId,
          email,
          name,
          workspaceId: provisioned.workspaceId,
          defaultVaultId: provisioned.defaultVaultId,
        };
      },
    }),
  ];
}

export const authOptions: NextAuthOptions = {
  providers: getProviders(),
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "dev-local") {
        return Boolean(user.id && user.workspaceId && user.defaultVaultId);
      }

      if (!account?.provider || !account.providerAccountId || !user.email) {
        return false;
      }

      if (!isDatabaseConfigured()) {
        return false;
      }

      const provisioned = await ensureUserProvisioned({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        email: user.email,
        name: user.name,
        image: user.image,
      });

      user.id = provisioned.userId;
      user.workspaceId = provisioned.workspaceId;
      user.defaultVaultId = provisioned.defaultVaultId;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.workspaceId = user.workspaceId;
        token.defaultVaultId = user.defaultVaultId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.workspaceId && token.defaultVaultId) {
        session.user.id = token.userId;
        session.user.workspaceId = token.workspaceId;
        session.user.defaultVaultId = token.defaultVaultId;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
