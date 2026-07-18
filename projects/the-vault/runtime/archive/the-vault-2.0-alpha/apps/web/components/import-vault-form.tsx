"use client";

import { useMemo, useRef, useState } from "react";

import { importVaultAction } from "@/app/workspace/actions";

type ImportVaultFormProps = {
  vaultId: string;
  compact?: boolean;
};

type BrowserFileWithPath = File & {
  webkitRelativePath?: string;
};

export function ImportVaultForm({
  vaultId,
  compact = false,
}: ImportVaultFormProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const summary = useMemo(() => {
    if (!selectedCount) {
      return "Select markdown files or an Obsidian folder to import into this vault.";
    }

    return `${selectedCount} file${selectedCount === 1 ? "" : "s"} ready for canonical import.`;
  }, [selectedCount]);

  return (
    <form
      action={importVaultAction}
      className={`import-vault-form ${compact ? "compact" : ""}`}
      ref={formRef}
    >
      <input name="vaultId" type="hidden" value={vaultId} />
      <input name="filePaths" type="hidden" value={JSON.stringify(filePaths)} />

      <label className={`editor-field ${compact ? "import-file-picker" : ""}`}>
        {compact ? null : <span>Import markdown</span>}
        <input
          accept=".md,.markdown,text/markdown"
          directory=""
          multiple
          name="files"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            setSelectedCount(files.length);
            setFilePaths(
              files.map((file) => {
                const browserFile = file as BrowserFileWithPath;
                return browserFile.webkitRelativePath || file.name;
              }),
            );

            if (compact && files.length) {
              requestAnimationFrame(() => {
                formRef.current?.requestSubmit();
              });
            }
          }}
          ref={inputRef}
          type="file"
          webkitdirectory=""
        />
      </label>

      <div className="import-vault-actions">
        {compact ? (
          <button
            className="ghost-button"
            onClick={() => {
              inputRef.current?.click();
            }}
            type="button"
          >
            Import
          </button>
        ) : (
          <button className="ghost-button" type="submit">
            Import vault
          </button>
        )}
        {compact ? null : <p className="import-vault-meta">{summary}</p>}
      </div>
    </form>
  );
}
