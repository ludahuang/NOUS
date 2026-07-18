import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getVaultGraphSnapshotForUser } from "@/lib/notes";

type VaultGraphRouteProps = {
  params: Promise<{
    vaultId: string;
  }>;
};

export async function GET(request: Request, { params }: VaultGraphRouteProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vaultId } = await params;
  const url = new URL(request.url);
  const selectedNoteId = url.searchParams.get("selectedNoteId") || "";
  const snapshot = await getVaultGraphSnapshotForUser(
    session.user.id,
    vaultId,
    selectedNoteId,
  );

  if (!snapshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
