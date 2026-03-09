import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { requireEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __theVaultPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: requireEnv("DATABASE_URL"),
  });
}

export function getPool() {
  if (!global.__theVaultPool) {
    global.__theVaultPool = createPool();
  }

  return global.__theVaultPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
