import "./load-env.mjs";

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDirectory = path.resolve(__dirname, "../sql");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to initialize the database.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
});

try {
  await client.connect();
  const sqlFiles = (await readdir(sqlDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const sql = await readFile(path.join(sqlDirectory, file), "utf8");
    await client.query(sql);
  }

  console.log(`Database initialized with ${sqlFiles.length} SQL migration files.`);
} finally {
  await client.end();
}
