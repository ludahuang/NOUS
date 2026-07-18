import { randomUUID } from "node:crypto";

import { query, withTransaction } from "@/lib/db";
import { saveVaultNoteForUser } from "@/lib/notes";

type NoteAiInputRow = {
  vault_id: string;
  note_id: string;
  title: string;
  folder_path: string;
  relative_path: string;
  markdown: string;
  excerpt: string;
  tags: string[];
  source_type: string | null;
  source_url: string | null;
  source_title: string | null;
};

type NoteLinkCandidateRow = {
  id: string;
  title: string;
  relative_path: string;
  folder_path: string;
  excerpt: string;
  tags: string[];
  source_type: string | null;
  source_url: string | null;
  source_title: string | null;
};

type AiRunRow = {
  id: string;
  vault_id: string;
  note_id: string;
  requested_by_user_id: string;
  action: string;
  status: string;
  review_status: string;
  provider: string;
  model: string;
  prompt_text: string;
  input_markdown: string;
  output_markdown: string;
  citations_json: unknown;
  metadata_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
  reviewed_at: Date | null;
  accepted_revision_id: string | null;
};

type AiRunSummaryRow = AiRunRow & {
  note_title?: string;
};

export type AiCitation = {
  label: string;
  url: string;
  sourceType: "note" | "source_document";
  reason: string;
};

export type AiRunSummary = {
  id: string;
  noteId: string;
  noteTitle: string;
  action: string;
  status: string;
  reviewStatus: string;
  provider: string;
  model: string;
  outputMarkdown: string;
  citations: AiCitation[];
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  reviewedAt: string | null;
  acceptedRevisionId: string | null;
};

type SummaryGenerationResult = {
  provider: string;
  model: string;
  outputMarkdown: string;
  citations: AiCitation[];
  metadata: Record<string, unknown>;
};

type LinkSuggestion = {
  title: string;
  relativePath: string;
  reason: string;
  url: string;
  sourceType: "note" | "source_document";
  score: number;
};

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripMarkdown(value: string) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/^---[\s\S]*?---\s*/m, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g, (_match, target, alias) => alias || target)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/[*_>#|]/g, " ")
      .replace(/\n+/g, " "),
  );
}

function takeSentences(value: string, limit: number) {
  const sentences = normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);

  return sentences.slice(0, limit);
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function extractExistingLinks(markdown: string) {
  const wikiLinks = [...String(markdown || "").matchAll(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|[^[\]]+)?\]\]/g)]
    .map((match) => normalizeWhitespace(match[1]));
  const markdownLinks = [...String(markdown || "").matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !/^[a-z]+:/i.test(href) && !href.startsWith("#"))
    .map((href) => {
      const withoutFragment = href.replace(/#.*$/, "").replace(/\.(md|markdown)$/i, "");
      const lastSegment = withoutFragment.split("/").filter(Boolean).pop() || withoutFragment;
      return normalizeWhitespace(lastSegment.replace(/[_-]+/g, " "));
    });

  return uniqueValues([...wikiLinks, ...markdownLinks]);
}

function normalizeLookupKey(value: string) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.(md|markdown)$/i, "")
      .replace(/[_-]+/g, " "),
  ).toLowerCase();
}

function tokenize(value: string) {
  return uniqueValues(
    normalizeWhitespace(stripMarkdown(value))
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 4),
  );
}

function buildPrompt(note: NoteAiInputRow) {
  return [
    "Summarize the note into a short reviewed markdown block.",
    "Use only the provided note content and explicit source metadata.",
    "Do not invent facts or citations.",
    `Title: ${note.title}`,
    note.source_title ? `Grounding source: ${note.source_title}` : "Grounding source: private vault note",
    note.source_url ? `Source URL: ${note.source_url}` : "",
    "",
    "Note content:",
    note.markdown,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCitations(note: NoteAiInputRow): AiCitation[] {
  const citations: AiCitation[] = [
    {
      label: note.title,
      url: "",
      sourceType: "note",
      reason: `Canonical note at ${note.relative_path}`,
    },
  ];

  if (note.source_title || note.source_url) {
    citations.push({
      label: note.source_title || note.title,
      url: note.source_url || "",
      sourceType: "source_document",
      reason: note.source_type
        ? `Grounding source captured as ${note.source_type}`
        : "Grounding source document",
    });
  }

  return citations;
}

function buildLocalSummary(note: NoteAiInputRow): SummaryGenerationResult {
  const plainText = stripMarkdown(note.markdown);
  const sentences = takeSentences(plainText, 3);
  const summaryParagraph =
    sentences.join(" ") ||
    `${note.title} is a canonical vault note with source-aware provenance.`;
  const keyThreads = sentences.slice(0, 3);

  const lines = [
    summaryParagraph,
    "",
    "### Key threads",
    ...(keyThreads.length
      ? keyThreads.map((sentence) => `- ${sentence}`)
      : ["- The note needs more content before a richer summary can be generated."]),
  ];

  return {
    provider: "local-dev",
    model: "extractive-summary-v1",
    outputMarkdown: lines.join("\n").trim(),
    citations: buildCitations(note),
    metadata: {
      mode: "extractive-fallback",
      sentenceCount: sentences.length,
    },
  };
}

async function generateSummaryWithOpenAI(note: NoteAiInputRow): Promise<SummaryGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildLocalSummary(note);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You write concise markdown note summaries for a source-aware knowledge workspace. Use only provided content. Do not invent sources. Keep the output under 140 words plus a short bullet list.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt(note),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI summary request failed: ${message}`);
  }

  const data = (await response.json()) as {
    id?: string;
    output_text?: string;
  };
  const outputMarkdown = normalizeWhitespace(data.output_text || "").replace(/\s+\n/g, "\n");

  if (!outputMarkdown) {
    throw new Error("OpenAI summary returned empty output.");
  }

  return {
    provider: "openai",
    model,
    outputMarkdown,
    citations: buildCitations(note),
    metadata: {
      responseId: data.id || "",
    },
  };
}

function buildSummarySection(summaryMarkdown: string, citations: AiCitation[]) {
  const lines = [
    "## AI Summary",
    "",
    summaryMarkdown.trim(),
    "",
    "### Summary Sources",
    ...citations.map((citation) =>
      citation.url
        ? `- ${citation.label} (${citation.sourceType}) - ${citation.reason}. [Open source](${citation.url})`
        : `- ${citation.label} (${citation.sourceType}) - ${citation.reason}.`,
    ),
  ];

  return `${lines.join("\n").trim()}\n`;
}

function buildLinkSuggestionSection(suggestionMarkdown: string, citations: AiCitation[]) {
  const lines = [
    "## AI Suggested Links",
    "",
    suggestionMarkdown.trim(),
    "",
    "### Link Suggestion Sources",
    ...citations.map((citation) =>
      citation.url
        ? `- ${citation.label} (${citation.sourceType}) - ${citation.reason}. [Open source](${citation.url})`
        : `- ${citation.label} (${citation.sourceType}) - ${citation.reason}.`,
    ),
  ];

  return `${lines.join("\n").trim()}\n`;
}

function upsertSummarySection(markdown: string, summaryMarkdown: string, citations: AiCitation[]) {
  const nextSection = buildSummarySection(summaryMarkdown, citations);
  const source = String(markdown || "").trim();
  const pattern = /\n## AI Summary\n[\s\S]*?(?=\n##\s|\n#\s|$)/;

  if (pattern.test(source)) {
    return `${source.replace(pattern, `\n\n${nextSection}`)}\n`;
  }

  return `${source}\n\n${nextSection}`.trim() + "\n";
}

function upsertLinkSuggestionSection(markdown: string, suggestionMarkdown: string, citations: AiCitation[]) {
  const nextSection = buildLinkSuggestionSection(suggestionMarkdown, citations);
  const source = String(markdown || "").trim();
  const pattern = /\n## AI Suggested Links\n[\s\S]*?(?=\n##\s|\n#\s|$)/;

  if (pattern.test(source)) {
    return `${source.replace(pattern, `\n\n${nextSection}`)}\n`;
  }

  return `${source}\n\n${nextSection}`.trim() + "\n";
}

async function getOwnedNoteForAi(userId: string, vaultId: string, noteId: string) {
  const result = await query<NoteAiInputRow>(
    `
      SELECT
        notes.vault_id,
        notes.id AS note_id,
        notes.title,
        notes.folder_path,
        notes.relative_path,
        notes.markdown,
        notes.excerpt,
        notes.tags,
        source_documents.source_type,
        source_documents.source_url,
        source_documents.title AS source_title
      FROM notes
      LEFT JOIN source_documents
        ON source_documents.id = notes.source_document_id
      WHERE notes.id = $1
        AND notes.vault_id = $2
        AND notes.owner_user_id = $3
      LIMIT 1
    `,
    [noteId, vaultId, userId],
  );

  return result.rows[0] || null;
}

async function getLinkSuggestionCandidates(
  userId: string,
  vaultId: string,
  noteId: string,
) {
  const [note, candidatesResult] = await Promise.all([
    getOwnedNoteForAi(userId, vaultId, noteId),
    query<NoteLinkCandidateRow>(
      `
        SELECT
          notes.id,
          notes.title,
          notes.relative_path,
          notes.folder_path,
          notes.excerpt,
          notes.tags,
          source_documents.source_type,
          source_documents.source_url,
          source_documents.title AS source_title
        FROM notes
        LEFT JOIN source_documents
          ON source_documents.id = notes.source_document_id
        WHERE notes.vault_id = $1
          AND notes.owner_user_id = $2
          AND notes.id <> $3
        ORDER BY notes.updated_at DESC
      `,
      [vaultId, userId, noteId],
    ),
  ]);

  return {
    note,
    candidates: candidatesResult.rows,
  };
}

function buildSuggestionCitations(note: NoteAiInputRow, suggestions: LinkSuggestion[]) {
  const citations = buildCitations(note);

  suggestions.forEach((suggestion) => {
    citations.push({
      label: suggestion.title,
      url: suggestion.url,
      sourceType: suggestion.sourceType,
      reason: suggestion.reason,
    });
  });

  return citations;
}

function buildLinkSuggestionReason(
  sharedTags: string[],
  sharedTerms: string[],
  sameFolder: boolean,
) {
  if (sharedTags.length) {
    return `Shares tags ${sharedTags.slice(0, 3).map((tag) => `#${tag}`).join(", ")}.`;
  }

  if (sharedTerms.length) {
    return `Overlaps on concepts: ${sharedTerms.slice(0, 4).join(", ")}.`;
  }

  if (sameFolder) {
    return "Lives in the same folder cluster and extends the same local thread.";
  }

  return "Touches adjacent ideas in the current vault graph.";
}

function buildLocalLinkSuggestions(
  note: NoteAiInputRow,
  candidates: NoteLinkCandidateRow[],
): SummaryGenerationResult {
  const existingLinks = new Set(
    extractExistingLinks(note.markdown).map((value) => normalizeLookupKey(value)),
  );
  const noteTags = new Set((note.tags || []).map((tag) => normalizeLookupKey(tag)));
  const noteTokens = new Set(tokenize(`${note.title} ${note.excerpt} ${note.markdown}`));

  const suggestions = candidates
    .map((candidate) => {
      const candidateLookup = normalizeLookupKey(candidate.title);
      if (existingLinks.has(candidateLookup) || existingLinks.has(normalizeLookupKey(candidate.relative_path))) {
        return null;
      }

      const candidateTags = (candidate.tags || []).map((tag) => normalizeLookupKey(tag));
      const sharedTags = candidateTags.filter((tag) => noteTags.has(tag));
      const candidateTokens = tokenize(`${candidate.title} ${candidate.excerpt}`);
      const sharedTerms = candidateTokens.filter((token) => noteTokens.has(token));
      const sameFolder = normalizeLookupKey(candidate.folder_path) === normalizeLookupKey(note.folder_path);
      const score =
        sharedTags.length * 4 +
        sharedTerms.length * 1.5 +
        (sameFolder ? 1.5 : 0);

      if (score <= 0) {
        return null;
      }

      return {
        title: candidate.title,
        relativePath: candidate.relative_path,
        reason: buildLinkSuggestionReason(sharedTags, sharedTerms, sameFolder),
        url: candidate.source_url || "",
        sourceType: candidate.source_url ? "source_document" : "note",
        score,
      } satisfies LinkSuggestion;
    })
    .filter((item): item is LinkSuggestion => Boolean(item))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 4);

  const outputMarkdown = suggestions.length
    ? suggestions.map((suggestion) => `- [[${suggestion.title}]] - ${suggestion.reason}`).join("\n")
    : "- No high-confidence link suggestions were found for this note yet.";

  return {
    provider: "local-dev",
    model: "heuristic-link-suggestion-v1",
    outputMarkdown,
    citations: buildSuggestionCitations(note, suggestions),
    metadata: {
      mode: "heuristic-fallback",
      suggestions: suggestions.map((suggestion) => ({
        title: suggestion.title,
        relativePath: suggestion.relativePath,
        reason: suggestion.reason,
        score: suggestion.score,
      })),
    },
  };
}

function buildLinkSuggestionPrompt(
  note: NoteAiInputRow,
  suggestions: LinkSuggestion[],
) {
  return [
    "Rewrite the suggested links as concise markdown bullets.",
    "Use only the supplied candidates. Do not add or remove candidates.",
    "Format every line exactly as `- [[Title]] - reason`.",
    "",
    `Current note: ${note.title}`,
    "",
    "Candidates:",
    ...suggestions.map(
      (suggestion) =>
        `- ${suggestion.title}: ${suggestion.reason} (path: ${suggestion.relativePath})`,
    ),
  ].join("\n");
}

async function maybeRefineLinkSuggestionsWithOpenAI(
  note: NoteAiInputRow,
  localResult: SummaryGenerationResult,
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return localResult;
  }

  const rawSuggestions = Array.isArray(localResult.metadata.suggestions)
    ? (localResult.metadata.suggestions as Array<Record<string, unknown>>)
    : [];

  if (!rawSuggestions.length) {
    return localResult;
  }

  const suggestions: LinkSuggestion[] = rawSuggestions
    .map((item) => {
      const title = normalizeWhitespace(String(item.title || ""));
      const relativePath = normalizeWhitespace(String(item.relativePath || ""));
      const reason = normalizeWhitespace(String(item.reason || ""));
      const score = Number(item.score || 0);

      if (!title || !reason) {
        return null;
      }

      return {
        title,
        relativePath,
        reason,
        url: "",
        sourceType: "note" as const,
        score,
      };
    })
    .filter((item): item is Exclude<typeof item, null> => Boolean(item));

  if (!suggestions.length) {
    return localResult;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You rewrite link suggestions for a note-taking app. Use only the supplied candidates. Return only markdown bullets formatted exactly as `- [[Title]] - reason`.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildLinkSuggestionPrompt(note, suggestions),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return localResult;
  }

  const data = (await response.json()) as {
    id?: string;
    output_text?: string;
  };
  const outputMarkdown = String(data.output_text || "").trim();
  const parsedLines = outputMarkdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (
    !parsedLines.length ||
    parsedLines.some((line) => !/^-\s+\[\[[^[\]]+\]\]\s+-\s+.+$/.test(line))
  ) {
    return localResult;
  }

  return {
    ...localResult,
    provider: "openai",
    model,
    outputMarkdown: parsedLines.join("\n"),
    metadata: {
      ...localResult.metadata,
      responseId: data.id || "",
      mode: "model-refined",
    },
  };
}

function parseCitations(value: unknown): AiCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      const label = normalizeWhitespace(String(candidate.label || ""));
      const url = normalizeWhitespace(String(candidate.url || ""));
      const reason = normalizeWhitespace(String(candidate.reason || ""));
      const sourceType =
        candidate.sourceType === "source_document" ? "source_document" : "note";

      if (!label || !reason) {
        return null;
      }

      return {
        label,
        url,
        reason,
        sourceType,
      } satisfies AiCitation;
    })
    .filter((item): item is AiCitation => Boolean(item));
}

function mapAiRunSummary(row: AiRunSummaryRow): AiRunSummary {
  return {
    id: row.id,
    noteId: row.note_id,
    noteTitle:
      normalizeWhitespace(
        String(row.note_title || row.metadata_json?.noteTitle || ""),
      ) || "Untitled note",
    action: row.action,
    status: row.status,
    reviewStatus: row.review_status,
    provider: row.provider,
    model: row.model,
    outputMarkdown: row.output_markdown,
    citations: parseCitations(row.citations_json),
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    acceptedRevisionId: row.accepted_revision_id,
  };
}

async function getAiRunForUser(
  userId: string,
  vaultId: string,
  noteId: string,
  action: string,
  aiRunId?: string | null,
): Promise<AiRunSummary | null> {
  if (!noteId) {
    return null;
  }

  if (aiRunId) {
    const explicit = await query<AiRunRow>(
      `
        SELECT *
        FROM ai_runs
        WHERE id = $1
          AND vault_id = $2
          AND note_id = $3
          AND requested_by_user_id = $4
          AND action = $5
        LIMIT 1
      `,
      [aiRunId, vaultId, noteId, userId, action],
    );

    if (explicit.rows[0]) {
      return mapAiRunSummary(explicit.rows[0]);
    }
  }

  const result = await query<AiRunRow>(
    `
      SELECT *
      FROM ai_runs
      WHERE vault_id = $1
        AND note_id = $2
        AND requested_by_user_id = $3
        AND action = $4
        AND review_status <> 'rejected'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [vaultId, noteId, userId, action],
  );

  return result.rows[0] ? mapAiRunSummary(result.rows[0]) : null;
}

export async function queueNoteSummaryForUser(userId: string, vaultId: string, noteId: string) {
  const note = await getOwnedNoteForAi(userId, vaultId, noteId);

  if (!note) {
    throw new Error("Note not found.");
  }

  const aiRunId = randomUUID();
  const promptText = buildPrompt(note);

  await query(
    `
      INSERT INTO ai_runs (
        id,
        vault_id,
        note_id,
        requested_by_user_id,
        action,
        status,
        review_status,
        prompt_text,
        input_markdown,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'note_summary',
        'queued',
        'pending',
        $5,
        $6,
        $7::jsonb
      )
    `,
    [
      aiRunId,
      vaultId,
      noteId,
      userId,
      promptText,
      note.markdown,
      JSON.stringify({
        noteTitle: note.title,
        sourceTitle: note.source_title || "",
      }),
    ],
  );

  return {
    aiRunId,
    noteId,
  };
}

export async function queueLinkSuggestionForUser(
  userId: string,
  vaultId: string,
  noteId: string,
) {
  const input = await getLinkSuggestionCandidates(userId, vaultId, noteId);

  if (!input.note) {
    throw new Error("Note not found.");
  }

  const localSuggestions = buildLocalLinkSuggestions(input.note, input.candidates);
  const aiRunId = randomUUID();

  await query(
    `
      INSERT INTO ai_runs (
        id,
        vault_id,
        note_id,
        requested_by_user_id,
        action,
        status,
        review_status,
        prompt_text,
        input_markdown,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'link_suggestion',
        'queued',
        'pending',
        $5,
        $6,
        $7::jsonb
      )
    `,
    [
      aiRunId,
      vaultId,
      noteId,
      userId,
      buildLinkSuggestionPrompt(
        input.note,
        Array.isArray(localSuggestions.metadata.suggestions)
          ? (localSuggestions.metadata.suggestions as Array<Record<string, unknown>>)
              .map((item) => ({
                title: normalizeWhitespace(String(item.title || "")),
                relativePath: normalizeWhitespace(String(item.relativePath || "")),
                reason: normalizeWhitespace(String(item.reason || "")),
                url: "",
                sourceType: "note" as const,
                score: Number(item.score || 0),
              }))
              .filter((item) => item.title && item.reason)
          : [],
      ),
      input.note.markdown,
      JSON.stringify({
        noteTitle: input.note.title,
        suggestions: localSuggestions.metadata.suggestions || [],
      }),
    ],
  );

  return {
    aiRunId,
    noteId,
  };
}

export async function processAiRun(aiRunId: string) {
  const claimed = await query<AiRunRow>(
    `
      UPDATE ai_runs
      SET status = 'processing',
          started_at = NOW(),
          error_message = NULL
      WHERE id = $1
        AND status IN ('queued', 'failed')
      RETURNING *
    `,
    [aiRunId],
  );

  if (!claimed.rows[0]) {
    const existing = await query<AiRunRow>(
      `
        SELECT *
        FROM ai_runs
        WHERE id = $1
        LIMIT 1
      `,
      [aiRunId],
    );

    const row = existing.rows[0];
    if (!row) {
      throw new Error("AI run not found.");
    }

    if (row.status === "succeeded") {
      return mapAiRunSummary(row);
    }

    return null;
  }

  const run = claimed.rows[0];
  const note = await getOwnedNoteForAi(run.requested_by_user_id, run.vault_id, run.note_id);

  if (!note) {
    throw new Error("Note not found.");
  }

  try {
    const result =
      run.action === "link_suggestion"
        ? await maybeRefineLinkSuggestionsWithOpenAI(
            note,
            buildLocalLinkSuggestions(
              note,
              (
                await getLinkSuggestionCandidates(
                  run.requested_by_user_id,
                  run.vault_id,
                  run.note_id,
                )
              ).candidates,
            ),
          )
        : await generateSummaryWithOpenAI(note);
    const updated = await query<AiRunRow>(
      `
        UPDATE ai_runs
        SET status = 'succeeded',
            provider = $2,
            model = $3,
            output_markdown = $4,
            citations_json = $5::jsonb,
            metadata_json = $6::jsonb,
            completed_at = NOW(),
            error_message = NULL
        WHERE id = $1
        RETURNING *
      `,
      [
        run.id,
        result.provider,
        result.model,
        result.outputMarkdown,
        JSON.stringify(result.citations),
        JSON.stringify(result.metadata),
      ],
    );

    return updated.rows[0] ? mapAiRunSummary(updated.rows[0]) : null;
  } catch (error) {
    await query(
      `
        UPDATE ai_runs
        SET status = 'failed',
            error_message = $2,
            completed_at = NOW()
        WHERE id = $1
      `,
      [run.id, error instanceof Error ? error.message : "AI processing failed."],
    );

    throw error;
  }
}

export async function getSummaryRunForUser(
  userId: string,
  vaultId: string,
  noteId: string,
  aiRunId?: string | null,
): Promise<AiRunSummary | null> {
  return getAiRunForUser(userId, vaultId, noteId, "note_summary", aiRunId);
}

export async function getLinkSuggestionRunForUser(
  userId: string,
  vaultId: string,
  noteId: string,
  aiRunId?: string | null,
): Promise<AiRunSummary | null> {
  return getAiRunForUser(userId, vaultId, noteId, "link_suggestion", aiRunId);
}

export async function acceptAiRunForUser(userId: string, vaultId: string, aiRunId: string) {
  const result = await query<AiRunRow>(
    `
      SELECT *
      FROM ai_runs
      WHERE id = $1
        AND vault_id = $2
        AND requested_by_user_id = $3
      LIMIT 1
    `,
    [aiRunId, vaultId, userId],
  );

  const run = result.rows[0];
  if (!run) {
    throw new Error("AI run not found.");
  }

  if (run.status !== "succeeded" || run.review_status !== "pending") {
    throw new Error("AI run is not ready for review.");
  }

  const note = await getOwnedNoteForAi(userId, vaultId, run.note_id);

  if (!note) {
    throw new Error("Note not found.");
  }

  const citations = parseCitations(run.citations_json);
  const nextMarkdown =
    run.action === "link_suggestion"
      ? upsertLinkSuggestionSection(note.markdown, run.output_markdown, citations)
      : upsertSummarySection(note.markdown, run.output_markdown, citations);

  const saved = await saveVaultNoteForUser(userId, {
    vaultId,
    noteId: note.note_id,
    title: note.title,
    folderPath: note.folder_path,
    markdown: nextMarkdown,
    editSummary:
      run.action === "link_suggestion"
        ? "Accepted AI link suggestions"
        : "Accepted AI summary",
  });

  await query(
    `
      UPDATE ai_runs
      SET review_status = 'accepted',
          reviewed_at = NOW(),
          accepted_revision_id = $2
      WHERE id = $1
    `,
    [run.id, saved.revisionId],
  );

  return {
    noteId: note.note_id,
    revisionId: saved.revisionId,
  };
}

export async function rejectAiRunForUser(userId: string, vaultId: string, aiRunId: string) {
  const result = await query<AiRunRow>(
    `
      UPDATE ai_runs
      SET review_status = 'rejected',
          reviewed_at = NOW()
      WHERE id = $1
        AND vault_id = $2
        AND requested_by_user_id = $3
        AND review_status = 'pending'
      RETURNING *
    `,
    [aiRunId, vaultId, userId],
  );

  if (!result.rows[0]) {
    throw new Error("AI run not found.");
  }

  return mapAiRunSummary(result.rows[0]);
}

export async function getNextQueuedAiRunId() {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM ai_runs
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT 1
    `,
  );

  return result.rows[0]?.id || "";
}

export async function listRecentAiRunsForUser(
  userId: string,
  vaultId: string,
  limit = 8,
): Promise<AiRunSummary[]> {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(Math.floor(limit), 16))
    : 8;
  const result = await query<AiRunSummaryRow>(
    `
      SELECT
        ai_runs.*,
        notes.title AS note_title
      FROM ai_runs
      INNER JOIN notes
        ON notes.id = ai_runs.note_id
      WHERE ai_runs.vault_id = $1
        AND ai_runs.requested_by_user_id = $2
      ORDER BY ai_runs.created_at DESC
      LIMIT $3
    `,
    [vaultId, userId, safeLimit],
  );

  return result.rows.map(mapAiRunSummary);
}
