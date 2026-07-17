import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireUserSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  return session;
}
