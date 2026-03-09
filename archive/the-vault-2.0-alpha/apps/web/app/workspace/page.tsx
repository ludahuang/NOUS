import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/session";
import { getWorkspaceOverviewForUser } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function WorkspaceIndexPage() {
  const session = await requireUserSession();
  const overview = await getWorkspaceOverviewForUser(session.user.id);

  if (overview?.vaults[0]) {
    redirect(`/workspace/${overview.vaults[0].id}`);
  }

  return (
    <main className="workspace-empty-state">
      <div className="empty-card">
        <p className="eyebrow">Workspace</p>
        <h1>No private vaults yet</h1>
        <p>
          Your personal workspace is provisioned, but there is no vault to open.
          Create one from the authenticated workspace flow.
        </p>
      </div>
    </main>
  );
}
