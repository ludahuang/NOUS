import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function applyEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    if (!key || process.env[key] != null) {
      return;
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  });
}

const cwd = process.cwd();
applyEnvFile(path.join(cwd, ".env"));
applyEnvFile(path.join(cwd, ".env.local"));
