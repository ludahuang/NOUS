import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      workspaceId: string;
      defaultVaultId: string;
    };
  }

  interface User {
    id: string;
    workspaceId: string;
    defaultVaultId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string;
    defaultVaultId?: string;
  }
}
