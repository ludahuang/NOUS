import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { query, withTransaction } from "@/lib/db";

export type VaultSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceOverview = {
  id: string;
  name: string;
  vaults: VaultSummary[];
};

type ProvisionInput = {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

type ProvisionResult = {
  userId: string;
  workspaceId: string;
  defaultVaultId: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildWorkspaceName(name: string | null | undefined, email: string) {
  const label = (name || email.split("@")[0] || "Vault").trim();
  return `${label}'s Workspace`;
}

async function ensureWorkspace(
  client: PoolClient,
  userId: string,
  name: string,
) {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id
      FROM workspaces
      WHERE owner_user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE workspaces
        SET name = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [existing.rows[0].id, name],
    );
    return existing.rows[0].id;
  }

  const workspaceId = randomUUID();
  await client.query(
    `
      INSERT INTO workspaces (id, owner_user_id, name)
      VALUES ($1, $2, $3)
    `,
    [workspaceId, userId, name],
  );
  return workspaceId;
}

async function createVaultInternal(
  client: PoolClient,
  userId: string,
  workspaceId: string,
  name: string,
  description: string | null = null,
) {
  const baseSlug = slugify(name) || "vault";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const duplicate = await client.query(
      `
        SELECT 1
        FROM vaults
        WHERE workspace_id = $1 AND slug = $2
        LIMIT 1
      `,
      [workspaceId, slug],
    );

    if (!duplicate.rows.length) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const vaultId = randomUUID();
  await client.query(
    `
      INSERT INTO vaults (id, workspace_id, owner_user_id, slug, name, description)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [vaultId, workspaceId, userId, slug, name, description],
  );

  return {
    id: vaultId,
    name,
    slug,
    description,
  };
}

async function ensureDefaultVault(
  client: PoolClient,
  userId: string,
  workspaceId: string,
) {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id
      FROM vaults
      WHERE owner_user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [userId],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const vault = await createVaultInternal(
    client,
    userId,
    workspaceId,
    "My first vault",
    "Private owner-only vault created during first-login bootstrap.",
  );

  return vault.id;
}

export async function ensureUserProvisioned(input: ProvisionInput): Promise<ProvisionResult> {
  return withTransaction(async (client) => {
    const identityResult = await client.query<{
      user_id: string;
    }>(
      `
        SELECT user_id
        FROM user_identities
        WHERE provider = $1 AND provider_account_id = $2
        LIMIT 1
      `,
      [input.provider, input.providerAccountId],
    );

    let userId = identityResult.rows[0]?.user_id || "";

    if (!userId) {
      const userResult = await client.query<{ id: string }>(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [input.email],
      );

      if (userResult.rows[0]) {
        userId = userResult.rows[0].id;
      }
    }

    if (!userId) {
      userId = randomUUID();
      await client.query(
        `
          INSERT INTO users (id, email, name, image)
          VALUES ($1, $2, $3, $4)
        `,
        [userId, input.email, input.name || null, input.image || null],
      );
    } else {
      await client.query(
        `
          UPDATE users
          SET email = $2,
              name = $3,
              image = $4,
              updated_at = NOW()
          WHERE id = $1
        `,
        [userId, input.email, input.name || null, input.image || null],
      );
    }

    await client.query(
      `
        INSERT INTO user_identities (id, user_id, provider, provider_account_id, email)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (provider, provider_account_id)
        DO UPDATE
          SET user_id = EXCLUDED.user_id,
              email = EXCLUDED.email,
              updated_at = NOW()
      `,
      [
        randomUUID(),
        userId,
        input.provider,
        input.providerAccountId,
        input.email,
      ],
    );

    const workspaceId = await ensureWorkspace(
      client,
      userId,
      buildWorkspaceName(input.name, input.email),
    );
    const defaultVaultId = await ensureDefaultVault(client, userId, workspaceId);

    return {
      userId,
      workspaceId,
      defaultVaultId,
    };
  });
}

export async function getWorkspaceOverviewForUser(userId: string): Promise<WorkspaceOverview | null> {
  const workspaceResult = await query<{ id: string; name: string }>(
    `
      SELECT id, name
      FROM workspaces
      WHERE owner_user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const workspace = workspaceResult.rows[0];
  if (!workspace) {
    return null;
  }

  const vaultResult = await query<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT id, name, slug, description, created_at, updated_at
      FROM vaults
      WHERE owner_user_id = $1
      ORDER BY created_at ASC
    `,
    [userId],
  );

  return {
    id: workspace.id,
    name: workspace.name,
    vaults: vaultResult.rows.map((vault) => ({
      id: vault.id,
      name: vault.name,
      slug: vault.slug,
      description: vault.description,
      createdAt: vault.created_at.toISOString(),
      updatedAt: vault.updated_at.toISOString(),
    })),
  };
}

export async function getVaultForUser(userId: string, vaultId: string) {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    workspace_name: string;
    workspace_id: string;
  }>(
    `
      SELECT
        vaults.id,
        vaults.name,
        vaults.slug,
        vaults.description,
        vaults.created_at,
        vaults.updated_at,
        workspaces.id AS workspace_id,
        workspaces.name AS workspace_name
      FROM vaults
      INNER JOIN workspaces
        ON workspaces.id = vaults.workspace_id
      WHERE vaults.id = $1
        AND vaults.owner_user_id = $2
      LIMIT 1
    `,
    [vaultId, userId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
  };
}

export async function createVaultForUser(userId: string, name: string) {
  const overview = await getWorkspaceOverviewForUser(userId);
  if (!overview) {
    throw new Error("Workspace not found for user.");
  }

  return withTransaction(async (client) => {
    return createVaultInternal(client, userId, overview.id, name);
  });
}
