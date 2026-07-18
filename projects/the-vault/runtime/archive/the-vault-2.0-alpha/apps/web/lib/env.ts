function isPlaceholderValue(value: string | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized.startsWith("replace-with-") ||
    normalized === "changeme" ||
    normalized === "example" ||
    normalized === "your-value-here"
  );
}

function hasConfiguredValue(name: string) {
  return !isPlaceholderValue(process.env[name]);
}

function hasUsableAuthSecret() {
  if (process.env.NODE_ENV !== "production") {
    return Boolean(String(process.env.AUTH_SECRET || "").trim());
  }

  return hasConfiguredValue("AUTH_SECRET");
}

export function isDatabaseConfigured() {
  return hasConfiguredValue("DATABASE_URL");
}

export function isObjectStorageConfigured() {
  const mode = (process.env.OBJECT_STORAGE_MODE || "local").toLowerCase();
  return mode === "local";
}

export function isGithubAuthConfigured() {
  return Boolean(
    hasUsableAuthSecret() &&
      hasConfiguredValue("GITHUB_ID") &&
      hasConfiguredValue("GITHUB_SECRET"),
  );
}

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_LOCAL_AUTH !== "false";
}

export function getPrimaryAuthMode() {
  if (isGithubAuthConfigured()) {
    return "github" as const;
  }

  if (isLocalDevAuthEnabled() && isDatabaseConfigured() && hasUsableAuthSecret()) {
    return "local" as const;
  }

  return "none" as const;
}

export function getMissingSetupItems() {
  const missing = [];

  if (!hasUsableAuthSecret()) {
    missing.push("AUTH_SECRET");
  }

  if (!isGithubAuthConfigured() && !isLocalDevAuthEnabled() && !hasConfiguredValue("GITHUB_ID")) {
    missing.push("GITHUB_ID");
  }

  if (!isGithubAuthConfigured() && !isLocalDevAuthEnabled() && !hasConfiguredValue("GITHUB_SECRET")) {
    missing.push("GITHUB_SECRET");
  }

  if (!hasConfiguredValue("DATABASE_URL")) {
    missing.push("DATABASE_URL");
  }

  return missing;
}

export function shouldRunJobsInline() {
  return process.env.RUN_JOBS_INLINE !== "false";
}

export function getWorkerPollIntervalMs() {
  const raw = Number(process.env.WORKER_POLL_INTERVAL_MS || 3000);
  return Number.isFinite(raw) && raw > 0 ? raw : 3000;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
