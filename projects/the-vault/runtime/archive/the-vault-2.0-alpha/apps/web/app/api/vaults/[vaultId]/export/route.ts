import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createVaultExportArchiveForUser } from "@/lib/export";

type VaultExportRouteProps = {
  params: Promise<{
    vaultId: string;
  }>;
};

export async function GET(_request: Request, { params }: VaultExportRouteProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vaultId } = await params;

  try {
    const archive = await createVaultExportArchiveForUser(session.user.id, vaultId);

    return new NextResponse(archive.buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${archive.archiveName}"`,
        "Content-Length": String(archive.buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vault export failed.";
    const status = message === "Vault not found." ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
