import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getExportArtifactForUser } from "@/lib/export";

type VaultExportArtifactRouteProps = {
  params: Promise<{
    vaultId: string;
    exportRunId: string;
  }>;
};

export async function GET(_request: Request, { params }: VaultExportArtifactRouteProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vaultId, exportRunId } = await params;

  try {
    const artifact = await getExportArtifactForUser(session.user.id, vaultId, exportRunId);

    if (!artifact) {
      return NextResponse.json({ error: "Export artifact not found." }, { status: 404 });
    }

    return new NextResponse(artifact.buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${artifact.archiveName}"`,
        "Content-Length": String(artifact.buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export artifact download failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
