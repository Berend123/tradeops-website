import crypto from "node:crypto";

import { neon } from "@neondatabase/serverless";

import { MEMBER_SCHEMA_SQL } from "./member-schema.js";


const TRADEOPS_PRO_ENTITLEMENT_KEY = "tradeops_pro";

let cachedDb = null;
let schemaReadyPromise = null;


function clean(value) {
  return String(value || "").trim();
}


export function normalizeEmail(email) {
  return clean(email).toLowerCase();
}


export function isMemberDatabaseConfigured(env = process.env) {
  return Boolean(clean(env.DATABASE_URL));
}


export function getMemberDatabase(env = process.env) {
  const connectionString = clean(env.DATABASE_URL);
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!cachedDb) {
    cachedDb = neon(connectionString);
  }
  return cachedDb;
}


async function runSchemaStatements(db) {
  const statements = MEMBER_SCHEMA_SQL
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.query(statement);
  }
}


export async function ensureMemberSchema(env = process.env) {
  if (!isMemberDatabaseConfigured(env)) {
    return false;
  }
  if (!schemaReadyPromise) {
    const db = getMemberDatabase(env);
    schemaReadyPromise = runSchemaStatements(db)
      .then(() => true)
      .catch((error) => {
        schemaReadyPromise = null;
        throw error;
      });
  }
  return schemaReadyPromise;
}


function buildNow() {
  return new Date().toISOString();
}


function generateId() {
  return crypto.randomUUID();
}


export function hashOpaqueToken(token) {
  return crypto.createHash("sha256").update(clean(token), "utf8").digest("hex");
}


async function queryRows(query, params = [], env = process.env) {
  await ensureMemberSchema(env);
  const db = getMemberDatabase(env);
  return db.query(query, params);
}


function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}


function parseNullableTimestamp(value) {
  const normalized = clean(value);
  return normalized || null;
}


function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: clean(row.id),
    email: clean(row.email),
    emailNormalized: clean(row.email_normalized),
    emailVerifiedAt: clean(row.email_verified_at),
    createdAt: clean(row.created_at),
    updatedAt: clean(row.updated_at),
    lastLoginAt: clean(row.last_login_at),
  };
}


function mapEntitlement(row) {
  if (!row) {
    return null;
  }
  return {
    id: clean(row.id),
    userId: clean(row.user_id),
    entitlementKey: clean(row.entitlement_key),
    status: clean(row.status),
    grantedAt: clean(row.granted_at),
    expiresAt: clean(row.expires_at),
    source: clean(row.source),
    updatedAt: clean(row.updated_at),
  };
}


function mapSubscription(row) {
  if (!row) {
    return null;
  }
  return {
    id: clean(row.id),
    userId: clean(row.user_id),
    provider: clean(row.provider),
    providerRef: clean(row.provider_ref),
    providerCustomerId: clean(row.provider_customer_id),
    providerSubscriptionId: clean(row.provider_subscription_id),
    providerOrderId: clean(row.provider_order_id),
    status: clean(row.status),
    variantId: clean(row.variant_id),
    planName: clean(row.plan_name),
    customerPortalUrl: clean(row.customer_portal_url),
    startedAt: clean(row.started_at),
    renewsAt: clean(row.renews_at),
    expiresAt: clean(row.expires_at),
    cancelledAt: clean(row.cancelled_at),
    rawPayloadJson: row.raw_payload_json || {},
    updatedAt: clean(row.updated_at),
  };
}


function mapDiscordLink(row) {
  if (!row) {
    return null;
  }
  return {
    id: clean(row.id),
    userId: clean(row.user_id),
    discordUserId: clean(row.discord_user_id),
    discordUsername: clean(row.discord_username),
    discordGlobalName: clean(row.discord_global_name),
    linkedAt: clean(row.linked_at),
    updatedAt: clean(row.updated_at),
  };
}


function mapSnapshot(row) {
  if (!row) {
    return null;
  }
  return {
    id: clean(row.id),
    snapshotDate: clean(row.snapshot_date),
    scope: clean(row.scope),
    mode: clean(row.mode),
    publishedAt: clean(row.published_at),
    isCurrent: Boolean(row.is_current),
    payloadJson: row.payload_json || {},
    sourceRunId: clean(row.source_run_id),
    sourcePacketDate: clean(row.source_packet_date),
  };
}


export async function upsertUserByEmail({ email, markVerified = false }, env = process.env) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  const now = buildNow();
  const verifiedAt = markVerified ? now : null;
  const rows = await queryRows(
    `
      INSERT INTO users (id, email, email_normalized, email_verified_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $5)
      ON CONFLICT (email_normalized) DO UPDATE
        SET email = EXCLUDED.email,
            email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
            updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [generateId(), normalizedEmail, normalizedEmail, verifiedAt, now],
    env,
  );
  return mapUser(firstRow(rows));
}


export async function markUserEmailVerified(userId, env = process.env) {
  const normalizedUserId = clean(userId);
  if (!normalizedUserId) {
    throw new Error("User id is required.");
  }
  const rows = await queryRows(
    `
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, NOW()),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [normalizedUserId],
    env,
  );
  return mapUser(firstRow(rows));
}


export async function getUserByEmail(email, env = process.env) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }
  const rows = await queryRows(
    `SELECT * FROM users WHERE email_normalized = $1 LIMIT 1`,
    [normalizedEmail],
    env,
  );
  return mapUser(firstRow(rows));
}


export async function getUserById(userId, env = process.env) {
  const normalizedUserId = clean(userId);
  if (!normalizedUserId) {
    return null;
  }
  const rows = await queryRows(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [normalizedUserId],
    env,
  );
  return mapUser(firstRow(rows));
}


export async function createVerificationToken({
  email,
  tokenHash,
  redirectTo = "/dashboard",
  expiresAt,
}, env = process.env) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  const normalizedHash = clean(tokenHash);
  if (!normalizedHash) {
    throw new Error("Token hash is required.");
  }
  const normalizedRedirect = clean(redirectTo) || "/dashboard";
  const normalizedExpiresAt = parseNullableTimestamp(expiresAt);
  if (!normalizedExpiresAt) {
    throw new Error("Verification token expiry is required.");
  }

  await queryRows(
    `DELETE FROM auth_verification_tokens WHERE email_normalized = $1`,
    [normalizedEmail],
    env,
  );
  const rows = await queryRows(
    `
      INSERT INTO auth_verification_tokens (id, email_normalized, token_hash, redirect_to, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `,
    [generateId(), normalizedEmail, normalizedHash, normalizedRedirect, normalizedExpiresAt],
    env,
  );
  return firstRow(rows);
}


export async function getVerificationTokenByHash(tokenHash, env = process.env) {
  const normalizedHash = clean(tokenHash);
  if (!normalizedHash) {
    return null;
  }
  const rows = await queryRows(
    `
      SELECT *
      FROM auth_verification_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [normalizedHash],
    env,
  );
  return firstRow(rows);
}


export async function deleteVerificationTokenById(tokenId, env = process.env) {
  const normalizedTokenId = clean(tokenId);
  if (!normalizedTokenId) {
    return;
  }
  await queryRows(`DELETE FROM auth_verification_tokens WHERE id = $1`, [normalizedTokenId], env);
}


export async function deleteVerificationTokensForEmail(email, env = process.env) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }
  await queryRows(`DELETE FROM auth_verification_tokens WHERE email_normalized = $1`, [normalizedEmail], env);
}


export async function createAuthSession({
  userId,
  sessionHash,
  expiresAt,
}, env = process.env) {
  const normalizedUserId = clean(userId);
  const normalizedHash = clean(sessionHash);
  const normalizedExpiresAt = parseNullableTimestamp(expiresAt);
  if (!normalizedUserId || !normalizedHash || !normalizedExpiresAt) {
    throw new Error("userId, sessionHash, and expiresAt are required.");
  }
  const rows = await queryRows(
    `
      INSERT INTO auth_sessions (id, user_id, session_hash, expires_at, created_at, last_seen_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `,
    [generateId(), normalizedUserId, normalizedHash, normalizedExpiresAt],
    env,
  );
  return firstRow(rows);
}


export async function deleteAuthSessionByHash(sessionHash, env = process.env) {
  const normalizedHash = clean(sessionHash);
  if (!normalizedHash) {
    return;
  }
  await queryRows(`DELETE FROM auth_sessions WHERE session_hash = $1`, [normalizedHash], env);
}


export async function getAuthSessionByHash(sessionHash, env = process.env) {
  const normalizedHash = clean(sessionHash);
  if (!normalizedHash) {
    return null;
  }
  const rows = await queryRows(
    `
      SELECT
        s.*,
        u.email,
        u.email_normalized,
        u.email_verified_at,
        u.last_login_at
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_hash = $1
      LIMIT 1
    `,
    [normalizedHash],
    env,
  );
  return firstRow(rows);
}


export async function touchAuthSession(sessionId, userId, env = process.env) {
  const normalizedSessionId = clean(sessionId);
  const normalizedUserId = clean(userId);
  if (!normalizedSessionId || !normalizedUserId) {
    return;
  }
  await queryRows(
    `
      UPDATE auth_sessions
      SET last_seen_at = NOW()
      WHERE id = $1
    `,
    [normalizedSessionId],
    env,
  );
  await queryRows(
    `
      UPDATE users
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `,
    [normalizedUserId],
    env,
  );
}


export async function upsertSubscriptionRow({
  userId,
  provider,
  providerRef,
  providerCustomerId = "",
  providerSubscriptionId = "",
  providerOrderId = "",
  status,
  variantId = "",
  planName = "",
  customerPortalUrl = "",
  startedAt = null,
  renewsAt = null,
  expiresAt = null,
  cancelledAt = null,
  rawPayloadJson = {},
}, env = process.env) {
  const normalizedUserId = clean(userId);
  const normalizedProvider = clean(provider);
  const normalizedProviderRef = clean(providerRef);
  const normalizedStatus = clean(status).toLowerCase();
  if (!normalizedUserId || !normalizedProvider || !normalizedProviderRef || !normalizedStatus) {
    throw new Error("userId, provider, providerRef, and status are required.");
  }
  const rows = await queryRows(
    `
      INSERT INTO subscriptions (
        id,
        user_id,
        provider,
        provider_ref,
        provider_customer_id,
        provider_subscription_id,
        provider_order_id,
        status,
        variant_id,
        plan_name,
        customer_portal_url,
        started_at,
        renews_at,
        expires_at,
        cancelled_at,
        raw_payload_json,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16::jsonb, NOW(), NOW()
      )
      ON CONFLICT (provider_ref) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            provider_customer_id = EXCLUDED.provider_customer_id,
            provider_subscription_id = EXCLUDED.provider_subscription_id,
            provider_order_id = EXCLUDED.provider_order_id,
            status = EXCLUDED.status,
            variant_id = EXCLUDED.variant_id,
            plan_name = EXCLUDED.plan_name,
            customer_portal_url = COALESCE(NULLIF(EXCLUDED.customer_portal_url, ''), subscriptions.customer_portal_url),
            started_at = COALESCE(EXCLUDED.started_at, subscriptions.started_at),
            renews_at = EXCLUDED.renews_at,
            expires_at = EXCLUDED.expires_at,
            cancelled_at = EXCLUDED.cancelled_at,
            raw_payload_json = EXCLUDED.raw_payload_json,
            updated_at = NOW()
      RETURNING *
    `,
    [
      generateId(),
      normalizedUserId,
      normalizedProvider,
      normalizedProviderRef,
      clean(providerCustomerId),
      clean(providerSubscriptionId),
      clean(providerOrderId),
      normalizedStatus,
      clean(variantId),
      clean(planName),
      clean(customerPortalUrl),
      parseNullableTimestamp(startedAt),
      parseNullableTimestamp(renewsAt),
      parseNullableTimestamp(expiresAt),
      parseNullableTimestamp(cancelledAt),
      JSON.stringify(rawPayloadJson || {}),
    ],
    env,
  );
  return mapSubscription(firstRow(rows));
}


export async function listSubscriptionsForUser(userId, env = process.env) {
  const normalizedUserId = clean(userId);
  if (!normalizedUserId) {
    return [];
  }
  const rows = await queryRows(
    `
      SELECT *
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `,
    [normalizedUserId],
    env,
  );
  return rows.map(mapSubscription);
}


export async function getLatestSubscriptionForUser(userId, env = process.env) {
  const rows = await listSubscriptionsForUser(userId, env);
  return rows[0] || null;
}


export async function upsertEntitlement({
  userId,
  entitlementKey = TRADEOPS_PRO_ENTITLEMENT_KEY,
  status,
  grantedAt = null,
  expiresAt = null,
  source = "unknown",
}, env = process.env) {
  const normalizedUserId = clean(userId);
  const normalizedEntitlementKey = clean(entitlementKey);
  const normalizedStatus = clean(status).toLowerCase();
  if (!normalizedUserId || !normalizedEntitlementKey || !normalizedStatus) {
    throw new Error("userId, entitlementKey, and status are required.");
  }
  const rows = await queryRows(
    `
      INSERT INTO entitlements (
        id,
        user_id,
        entitlement_key,
        status,
        granted_at,
        expires_at,
        source,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (user_id, entitlement_key) DO UPDATE
        SET status = EXCLUDED.status,
            granted_at = COALESCE(EXCLUDED.granted_at, entitlements.granted_at),
            expires_at = EXCLUDED.expires_at,
            source = EXCLUDED.source,
            updated_at = NOW()
      RETURNING *
    `,
    [
      generateId(),
      normalizedUserId,
      normalizedEntitlementKey,
      normalizedStatus,
      parseNullableTimestamp(grantedAt),
      parseNullableTimestamp(expiresAt),
      clean(source),
    ],
    env,
  );
  return mapEntitlement(firstRow(rows));
}


export async function getEntitlementForUser(userId, entitlementKey = TRADEOPS_PRO_ENTITLEMENT_KEY, env = process.env) {
  const normalizedUserId = clean(userId);
  const normalizedEntitlementKey = clean(entitlementKey);
  if (!normalizedUserId || !normalizedEntitlementKey) {
    return null;
  }
  const rows = await queryRows(
    `
      SELECT *
      FROM entitlements
      WHERE user_id = $1 AND entitlement_key = $2
      LIMIT 1
    `,
    [normalizedUserId, normalizedEntitlementKey],
    env,
  );
  return mapEntitlement(firstRow(rows));
}


export async function saveDiscordLink({
  userId,
  discordUserId,
  discordUsername = "",
  discordGlobalName = "",
}, env = process.env) {
  const normalizedUserId = clean(userId);
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedUserId || !normalizedDiscordUserId) {
    throw new Error("userId and discordUserId are required.");
  }
  const rows = await queryRows(
    `
      INSERT INTO discord_links (
        id,
        user_id,
        discord_user_id,
        discord_username,
        discord_global_name,
        linked_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET discord_user_id = EXCLUDED.discord_user_id,
            discord_username = EXCLUDED.discord_username,
            discord_global_name = EXCLUDED.discord_global_name,
            updated_at = NOW()
      RETURNING *
    `,
    [generateId(), normalizedUserId, normalizedDiscordUserId, clean(discordUsername), clean(discordGlobalName)],
    env,
  );
  return mapDiscordLink(firstRow(rows));
}


export async function getDiscordLinkForUser(userId, env = process.env) {
  const normalizedUserId = clean(userId);
  if (!normalizedUserId) {
    return null;
  }
  const rows = await queryRows(
    `SELECT * FROM discord_links WHERE user_id = $1 LIMIT 1`,
    [normalizedUserId],
    env,
  );
  return mapDiscordLink(firstRow(rows));
}


export async function deleteDiscordLinkByUserId(userId, env = process.env) {
  const normalizedUserId = clean(userId);
  if (!normalizedUserId) {
    return;
  }
  await queryRows(`DELETE FROM discord_links WHERE user_id = $1`, [normalizedUserId], env);
}


export async function deleteDiscordLinkByDiscordUserId(discordUserId, env = process.env) {
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedDiscordUserId) {
    return;
  }
  await queryRows(`DELETE FROM discord_links WHERE discord_user_id = $1`, [normalizedDiscordUserId], env);
}


export async function getUserByDiscordUserId(discordUserId, env = process.env) {
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedDiscordUserId) {
    return null;
  }
  const rows = await queryRows(
    `
      SELECT u.*
      FROM discord_links d
      JOIN users u ON u.id = d.user_id
      WHERE d.discord_user_id = $1
      LIMIT 1
    `,
    [normalizedDiscordUserId],
    env,
  );
  return mapUser(firstRow(rows));
}


export async function getCurrentDashboardSnapshot(scope = "cross_market", env = process.env) {
  const rows = await queryRows(
    `
      SELECT *
      FROM dashboard_snapshots
      WHERE scope = $1 AND is_current = TRUE
      ORDER BY published_at DESC
      LIMIT 1
    `,
    [clean(scope) || "cross_market"],
    env,
  );
  return mapSnapshot(firstRow(rows));
}


export async function listRecentDashboardSnapshots({
  scope = "cross_market",
  limit = 7,
}, env = process.env) {
  const rows = await queryRows(
    `
      SELECT *
      FROM dashboard_snapshots
      WHERE scope = $1
      ORDER BY snapshot_date DESC, published_at DESC
      LIMIT $2
    `,
    [clean(scope) || "cross_market", Number(limit) || 7],
    env,
  );
  return rows.map(mapSnapshot);
}


export {
  TRADEOPS_PRO_ENTITLEMENT_KEY,
};
