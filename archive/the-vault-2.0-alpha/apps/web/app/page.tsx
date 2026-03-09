import { redirect } from "next/navigation";

import { SignInButton } from "@/components/auth-buttons";
import { auth } from "@/lib/auth";
import {
  getMissingSetupItems,
  getPrimaryAuthMode,
  isDatabaseConfigured,
} from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.defaultVaultId) {
    redirect(`/workspace/${session.user.defaultVaultId}`);
  }

  const authMode = getPrimaryAuthMode();
  const authReady = authMode !== "none";
  const dbReady = isDatabaseConfigured();
  const missingItems = getMissingSetupItems();

  return (
    <main className="landing-shell">
      <section className="landing-panel">
        <div className="eyebrow-row">
          <p className="eyebrow">The Vault 2.0-alpha</p>
          <span className="status-pill">Persistent workspace</span>
        </div>
        <h1>The Vault</h1>
        <p className="lede">
          The next step is not a platform explosion. It is a durable, source-aware
          connectome workspace with identity, private vault ownership, and a
          protected 3D graph surface.
        </p>

        <div className="card-grid">
          <article className="info-card">
            <h2>Built now</h2>
            <ul>
              <li>GitHub sign-in scaffold</li>
              <li>Personal workspace bootstrap</li>
              <li>Private vault ownership</li>
              <li>PostgreSQL-backed identity model</li>
            </ul>
          </article>
          <article className="info-card">
            <h2>Protected next</h2>
            <ul>
              <li>3D connectome remains the main surface</li>
              <li>Obsidian continuity stays intact</li>
              <li>AI remains reviewed, cited, and auditable</li>
              <li>No collaboration or billing creep in alpha</li>
            </ul>
          </article>
        </div>

        <div className="callout">
          <div>
            <strong>Current setup status</strong>
            <p>
              {authMode === "github" && dbReady
                ? "GitHub auth and PostgreSQL configuration look ready. Sign in to bootstrap your personal workspace."
                : authMode === "local" && dbReady
                  ? "GitHub OAuth is not configured, but local development sign-in is enabled for localhost."
                  : "Finish the required environment setup before using sign-in."}
            </p>
          </div>
          <SignInButton
            disabled={!authReady || !dbReady}
            label={authMode === "local" ? "Continue locally" : "Continue with GitHub"}
            provider={authMode === "local" ? "dev-local" : "github"}
          />
        </div>

        {!authReady || !dbReady ? (
          <section className="setup-panel">
            <h2>Missing environment variables</h2>
            <p>
              Copy <code>apps/web/.env.example</code> to <code>apps/web/.env.local</code>,
              then fill these values:
            </p>
            <ul className="missing-list">
              {missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="setup-footnote">
              After setting <code>DATABASE_URL</code>, run <code>npm run db:init</code>.
            </p>
            {authMode === "local" ? (
              <p className="setup-footnote">
                Local development sign-in is active because GitHub OAuth is still unset.
              </p>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
