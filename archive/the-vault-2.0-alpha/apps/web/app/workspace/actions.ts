"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  acceptAiRunForUser,
  processAiRun,
  queueLinkSuggestionForUser,
  queueNoteSummaryForUser,
  rejectAiRunForUser,
} from "@/lib/ai";
import { processExportRun, queueVaultExportForUser } from "@/lib/export";
import { processImportRun, queueMarkdownImportForUser } from "@/lib/import";
import { shouldRunJobsInline } from "@/lib/env";
import { requireUserSession } from "@/lib/session";
import { saveVaultNoteForUser } from "@/lib/notes";
import { createVaultForUser } from "@/lib/workspace";

export async function createVaultAction(formData: FormData) {
  const session = await requireUserSession();
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    throw new Error("Vault name is required.");
  }

  const vault = await createVaultForUser(session.user.id, name);
  revalidatePath("/workspace");
  redirect(`/workspace/${vault.id}`);
}

export async function saveVaultNoteAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const folderPath = String(formData.get("folderPath") || "").trim();
  const markdown = String(formData.get("markdown") || "");
  const editSummary = String(formData.get("editSummary") || "").trim();

  if (!vaultId) {
    throw new Error("Vault is required.");
  }

  const note = await saveVaultNoteForUser(session.user.id, {
    vaultId,
    noteId: noteId || null,
    title,
    folderPath: folderPath || null,
    markdown,
    editSummary: editSummary || null,
  });

  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${note.noteId}`);
}

export async function importVaultAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();

  if (!vaultId) {
    throw new Error("Vault is required.");
  }

  const rawFiles = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const relativePaths = (() => {
    const raw = String(formData.get("filePaths") || "[]");

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((value) => String(value || "")) : [];
    } catch {
      return [];
    }
  })();

  if (!rawFiles.length) {
    redirect(`/workspace/${vaultId}`);
  }

  const files = await Promise.all(
    rawFiles.map(async (file, index) => ({
      name: file.name,
      relativePath: relativePaths[index] || file.name,
      markdown: await file.text(),
    })),
  );

  const queued = await queueMarkdownImportForUser(session.user.id, vaultId, files);
  const processed = shouldRunJobsInline()
    ? await processImportRun(queued.importRunId)
    : null;
  revalidatePath(`/workspace/${vaultId}`);

  const params = new URLSearchParams({
    importRunId: queued.importRunId,
  });

  if (processed?.preferredNoteId) {
    params.set("noteId", processed.preferredNoteId);
  }

  redirect(`/workspace/${vaultId}?${params.toString()}`);
}

export async function queueVaultExportAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();
  const mode = String(formData.get("mode") || "").trim();

  if (!vaultId) {
    throw new Error("Vault is required.");
  }

  const queued = await queueVaultExportForUser(session.user.id, vaultId);
  await (shouldRunJobsInline() ? processExportRun(queued.exportRunId) : Promise.resolve(null));
  revalidatePath(`/workspace/${vaultId}`);

  const params = new URLSearchParams({
    exportRunId: queued.exportRunId,
  });

  if (noteId) {
    params.set("noteId", noteId);
  }

  if (mode === "new") {
    params.set("mode", "new");
  }

  redirect(`/workspace/${vaultId}?${params.toString()}`);
}

export async function requestNoteSummaryAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();

  if (!vaultId || !noteId) {
    throw new Error("Vault and note are required.");
  }

  const queued = await queueNoteSummaryForUser(session.user.id, vaultId, noteId);
  await (shouldRunJobsInline() ? processAiRun(queued.aiRunId) : Promise.resolve(null));
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${noteId}&aiRunId=${queued.aiRunId}`);
}

export async function acceptNoteSummaryAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const aiRunId = String(formData.get("aiRunId") || "").trim();

  if (!vaultId || !aiRunId) {
    throw new Error("Vault and AI run are required.");
  }

  const accepted = await acceptAiRunForUser(session.user.id, vaultId, aiRunId);
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${accepted.noteId}&aiRunId=${aiRunId}`);
}

export async function rejectNoteSummaryAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();
  const aiRunId = String(formData.get("aiRunId") || "").trim();

  if (!vaultId || !noteId || !aiRunId) {
    throw new Error("Vault, note, and AI run are required.");
  }

  await rejectAiRunForUser(session.user.id, vaultId, aiRunId);
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${noteId}`);
}

export async function requestLinkSuggestionAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();

  if (!vaultId || !noteId) {
    throw new Error("Vault and note are required.");
  }

  const queued = await queueLinkSuggestionForUser(session.user.id, vaultId, noteId);
  await (shouldRunJobsInline() ? processAiRun(queued.aiRunId) : Promise.resolve(null));
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${noteId}&linkRunId=${queued.aiRunId}`);
}

export async function acceptLinkSuggestionAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const aiRunId = String(formData.get("aiRunId") || "").trim();

  if (!vaultId || !aiRunId) {
    throw new Error("Vault and AI run are required.");
  }

  const accepted = await acceptAiRunForUser(session.user.id, vaultId, aiRunId);
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${accepted.noteId}&linkRunId=${aiRunId}`);
}

export async function rejectLinkSuggestionAction(formData: FormData) {
  const session = await requireUserSession();
  const vaultId = String(formData.get("vaultId") || "").trim();
  const noteId = String(formData.get("noteId") || "").trim();
  const aiRunId = String(formData.get("aiRunId") || "").trim();

  if (!vaultId || !noteId || !aiRunId) {
    throw new Error("Vault, note, and AI run are required.");
  }

  await rejectAiRunForUser(session.user.id, vaultId, aiRunId);
  revalidatePath(`/workspace/${vaultId}`);
  redirect(`/workspace/${vaultId}?noteId=${noteId}`);
}
