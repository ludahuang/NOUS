"use client";

import { useTransition } from "react";
import { signIn, signOut } from "next-auth/react";

type SignInButtonProps = {
  disabled?: boolean;
  provider?: string;
  label?: string;
};

export function SignInButton({
  disabled = false,
  provider = "github",
  label,
}: SignInButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="primary-button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(() => {
          void signIn(
            provider,
            provider === "dev-local"
              ? {
                  callbackUrl: "/workspace",
                  redirect: true,
                }
              : {
                  callbackUrl: "/workspace",
                },
          );
        });
      }}
      type="button"
    >
      {pending ? "Connecting…" : label || "Continue with GitHub"}
    </button>
  );
}

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="ghost-button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void signOut({
            callbackUrl: "/",
          });
        });
      }}
      type="button"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
