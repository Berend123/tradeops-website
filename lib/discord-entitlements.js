import { readFile } from "node:fs/promises";

import { findEntitledLemonSubscription } from "./lemon-squeezy.js";


const DISCORD_API_ROOT = "https://discord.com/api/v10";
const DEFAULT_PREMIUM_ROLE_NAME = "Pro Access";
const DEFAULT_PREMIUM_CHANNEL_NAMES = ["pro-daily", "pro-ideas", "pro-archive"];


function clean(value) {
  return String(value || "").trim();
}


function splitCsv(value, fallback = []) {
  const items = clean(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}


function normalizeBotToken(token) {
  const normalized = clean(token);
  if (!normalized) {
    throw new Error("Discord bot token is empty.");
  }
  if (/^(bot|bearer)\s/i.test(normalized)) {
    return normalized;
  }
  return `Bot ${normalized}`;
}


function extractDiscordErrorCode(rawBody) {
  if (!rawBody) {
    return 0;
  }
  try {
    const payload = JSON.parse(rawBody);
    return Number(payload?.code) || 0;
  } catch {
    return 0;
  }
}


class DiscordApiError extends Error {
  constructor(message, { status = 500, code = 0, rawBody = "" } = {}) {
    super(message);
    this.name = "DiscordApiError";
    this.status = status;
    this.code = code;
    this.rawBody = rawBody;
  }
}


export function normalizeDiscordUserId(value) {
  const match = clean(value).match(/(\d{17,20})/);
  return match ? match[1] : "";
}


async function resolveDiscordBotToken(env = process.env) {
  const directToken = clean(env.TRADEOPS_DISCORD_BOT_TOKEN);
  if (directToken) {
    return normalizeBotToken(directToken);
  }

  const tokenFile = clean(env.TRADEOPS_DISCORD_TOKEN_FILE);
  if (!tokenFile) {
    throw new Error("Discord bot token is not configured.");
  }

  const token = await readFile(tokenFile, "utf8").catch((error) => {
    throw new Error(`Discord bot token file could not be read: ${error instanceof Error ? error.message : tokenFile}`);
  });
  return normalizeBotToken(token);
}


async function resolveDiscordConfig(env = process.env) {
  const guildId = clean(env.TRADEOPS_DISCORD_GUILD_ID);
  if (!guildId) {
    throw new Error("Discord guild id is not configured.");
  }

  return {
    guildId,
    token: await resolveDiscordBotToken(env),
    premiumRoleId: clean(env.TRADEOPS_DISCORD_PRO_ROLE_ID),
    premiumRoleName: clean(env.TRADEOPS_DISCORD_PREMIUM_ROLE_NAME) || DEFAULT_PREMIUM_ROLE_NAME,
    premiumChannelNames: splitCsv(env.TRADEOPS_DISCORD_PREMIUM_CHANNELS, DEFAULT_PREMIUM_CHANNEL_NAMES),
  };
}


async function discordRequest(config, path, { method = "GET", body = null } = {}) {
  const response = await fetch(`${DISCORD_API_ROOT}${path}`, {
    method,
    headers: {
      Authorization: config.token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const rawBody = await response.text();
  if (!response.ok) {
    const code = extractDiscordErrorCode(rawBody);
    throw new DiscordApiError(
      `Discord API rejected ${method} ${path} (${response.status})${rawBody ? `: ${rawBody}` : ""}`,
      { status: response.status, code, rawBody },
    );
  }

  if (!rawBody) {
    return null;
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}


async function discordRequestNoContent(config, path, { method = "GET", body = null } = {}) {
  const response = await fetch(`${DISCORD_API_ROOT}${path}`, {
    method,
    headers: {
      Authorization: config.token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const rawBody = await response.text();
  if (!response.ok) {
    const code = extractDiscordErrorCode(rawBody);
    throw new DiscordApiError(
      `Discord API rejected ${method} ${path} (${response.status})${rawBody ? `: ${rawBody}` : ""}`,
      { status: response.status, code, rawBody },
    );
  }

  return {
    status: response.status,
    body: rawBody,
  };
}


function normalizeRole(role) {
  return {
    id: clean(role?.id),
    name: clean(role?.name),
    position: Number(role?.position) || 0,
  };
}


function getRoleByName(roles, name) {
  const normalizedTarget = clean(name).toLowerCase();
  return roles.find((role) => clean(role.name).toLowerCase() === normalizedTarget) || null;
}


async function listGuildRoles(config) {
  const roles = await discordRequest(config, `/guilds/${config.guildId}/roles`);
  return Array.isArray(roles) ? roles.map(normalizeRole) : [];
}


async function listGuildChannels(config) {
  const channels = await discordRequest(config, `/guilds/${config.guildId}/channels`);
  return Array.isArray(channels) ? channels : [];
}


async function createGuildRole(config, roleName) {
  const created = await discordRequest(config, `/guilds/${config.guildId}/roles`, {
    method: "POST",
    body: {
      name: roleName,
      hoist: false,
      mentionable: false,
      permissions: "0",
    },
  });
  return normalizeRole(created);
}


function pickPremiumOverwrite(channel, roleId, legacyRoleId) {
  const overwrites = Array.isArray(channel?.permission_overwrites) ? channel.permission_overwrites : [];
  const existingOverwrite = overwrites.find((overwrite) => clean(overwrite?.id) === roleId);
  if (existingOverwrite) {
    return {
      allow: clean(existingOverwrite.allow),
      deny: clean(existingOverwrite.deny),
    };
  }

  const legacyOverwrite = overwrites.find((overwrite) => clean(overwrite?.id) === legacyRoleId);
  if (!legacyOverwrite) {
    throw new Error(`Channel '${clean(channel?.name)}' is missing the legacy Pro overwrite needed to clone premium access.`);
  }

  return {
    allow: clean(legacyOverwrite.allow),
    deny: clean(legacyOverwrite.deny),
  };
}


async function ensurePremiumChannelAccess(config, role, roles) {
  const channels = await listGuildChannels(config);
  const legacyProRole = getRoleByName(roles, "Pro");
  const results = [];

  for (const channelName of config.premiumChannelNames) {
    const channel = channels.find((candidate) => clean(candidate?.name) === channelName);
    if (!channel) {
      results.push({ channel_name: channelName, updated: false, missing: true });
      continue;
    }

    const overwrite = pickPremiumOverwrite(channel, role.id, legacyProRole?.id || "");
    await discordRequest(config, `/channels/${channel.id}/permissions/${role.id}`, {
      method: "PUT",
      body: {
        allow: overwrite.allow,
        deny: overwrite.deny,
        type: 0,
      },
    });

    results.push({
      channel_id: clean(channel.id),
      channel_name: channelName,
      updated: true,
      allow: overwrite.allow,
      deny: overwrite.deny,
    });
  }

  return results;
}


async function ensurePremiumRole(config) {
  const roles = await listGuildRoles(config);

  if (config.premiumRoleId) {
    const configured = roles.find((role) => role.id === config.premiumRoleId);
    if (!configured) {
      throw new Error(`Configured Discord premium role '${config.premiumRoleId}' was not found in the guild.`);
    }
    return {
      role: configured,
      roles,
      created: false,
    };
  }

  const existing = getRoleByName(roles, config.premiumRoleName);
  if (existing) {
    return {
      role: existing,
      roles,
      created: false,
    };
  }

  const createdRole = await createGuildRole(config, config.premiumRoleName);
  return {
    role: createdRole,
    roles: [...roles, createdRole],
    created: true,
  };
}


async function fetchGuildMember(config, discordUserId) {
  try {
    const member = await discordRequest(config, `/guilds/${config.guildId}/members/${discordUserId}`);
    return member && typeof member === "object" ? member : null;
  } catch (error) {
    if (error instanceof DiscordApiError && (error.status === 404 || error.code === 10007)) {
      return null;
    }
    throw error;
  }
}


async function addRoleToMember(config, discordUserId, roleId) {
  try {
    await discordRequest(config, `/guilds/${config.guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: "PUT",
    });
  } catch (error) {
    if (error instanceof DiscordApiError && error.code === 50013) {
      throw new Error("Discord rejected the role assignment because the bot cannot manage that role. The automation role must stay below the bot role.");
    }
    throw error;
  }
}


async function removeRoleFromMember(config, discordUserId, roleId) {
  try {
    await discordRequest(config, `/guilds/${config.guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof DiscordApiError && (error.status === 404 || error.code === 10007)) {
      return;
    }
    if (error instanceof DiscordApiError && error.code === 50013) {
      throw new Error("Discord rejected the role removal because the bot cannot manage that role. The automation role must stay below the bot role.");
    }
    throw error;
  }
}


async function ensurePremiumRoleContext(env = process.env) {
  const config = await resolveDiscordConfig(env);
  const premiumRoleResult = await ensurePremiumRole(config);
  const channelSync = await ensurePremiumChannelAccess(config, premiumRoleResult.role, premiumRoleResult.roles);
  return {
    config,
    premiumRole: premiumRoleResult.role,
    premiumRoleCreated: premiumRoleResult.created,
    channelSync,
  };
}


export async function grantDiscordProRole({
  discordUserId,
  env = process.env,
}) {
  const normalizedDiscordUserId = normalizeDiscordUserId(discordUserId);
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID must be a numeric Discord ID or profile link.");
  }

  const { config, premiumRole, premiumRoleCreated, channelSync } = await ensurePremiumRoleContext(env);
  const member = await fetchGuildMember(config, normalizedDiscordUserId);
  if (!member) {
    throw new Error("Discord member was not found in the TradeOps server. Connect Discord first so the user is present in the guild.");
  }

  const existingRoleIds = Array.isArray(member?.roles) ? member.roles.map((roleId) => clean(roleId)) : [];
  const alreadyActive = existingRoleIds.includes(premiumRole.id);
  if (!alreadyActive) {
    await addRoleToMember(config, normalizedDiscordUserId, premiumRole.id);
  }

  return {
    discord_user_id: normalizedDiscordUserId,
    already_active: alreadyActive,
    premium_role: {
      id: premiumRole.id,
      name: premiumRole.name,
      created: premiumRoleCreated,
    },
    channel_sync: channelSync,
  };
}


export async function revokeDiscordProRole({
  discordUserId,
  env = process.env,
}) {
  const normalizedDiscordUserId = normalizeDiscordUserId(discordUserId);
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID must be a numeric Discord ID or profile link.");
  }

  const { config, premiumRole, premiumRoleCreated, channelSync } = await ensurePremiumRoleContext(env);
  const member = await fetchGuildMember(config, normalizedDiscordUserId);
  if (!member) {
    return {
      discord_user_id: normalizedDiscordUserId,
      already_inactive: true,
      premium_role: {
        id: premiumRole.id,
        name: premiumRole.name,
        created: premiumRoleCreated,
      },
      channel_sync: channelSync,
    };
  }

  const existingRoleIds = Array.isArray(member?.roles) ? member.roles.map((roleId) => clean(roleId)) : [];
  const alreadyInactive = !existingRoleIds.includes(premiumRole.id);
  if (!alreadyInactive) {
    await removeRoleFromMember(config, normalizedDiscordUserId, premiumRole.id);
  }

  return {
    discord_user_id: normalizedDiscordUserId,
    already_inactive: alreadyInactive,
    premium_role: {
      id: premiumRole.id,
      name: premiumRole.name,
      created: premiumRoleCreated,
    },
    channel_sync: channelSync,
  };
}


export async function fetchDiscordUserProfile({
  accessToken,
}) {
  const normalizedToken = clean(accessToken);
  if (!normalizedToken) {
    throw new Error("Discord OAuth access token is required.");
  }

  const response = await fetch(`${DISCORD_API_ROOT}/users/@me`, {
    headers: {
      Authorization: `Bearer ${normalizedToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Discord OAuth profile request failed (${response.status})${rawBody ? `: ${rawBody}` : ""}`);
  }

  const payload = rawBody ? JSON.parse(rawBody) : {};
  const userId = normalizeDiscordUserId(payload?.id);
  if (!userId) {
    throw new Error("Discord OAuth profile response did not include a user id.");
  }

  const avatar = clean(payload?.avatar);
  return {
    userId,
    username: clean(payload?.username),
    globalName: clean(payload?.global_name),
    email: clean(payload?.email).toLowerCase(),
    avatarUrl:
      avatar
        ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`
        : "",
  };
}


export async function joinDiscordGuildFromOAuth({
  accessToken,
  discordUserId,
  env = process.env,
}) {
  const normalizedToken = clean(accessToken);
  if (!normalizedToken) {
    throw new Error("Discord OAuth access token is required.");
  }
  const normalizedDiscordUserId = normalizeDiscordUserId(discordUserId);
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID must be a numeric Discord ID or profile link.");
  }

  const config = await resolveDiscordConfig(env);
  const response = await discordRequestNoContent(config, `/guilds/${config.guildId}/members/${normalizedDiscordUserId}`, {
    method: "PUT",
    body: {
      access_token: normalizedToken,
    },
  });

  return {
    guild_id: config.guildId,
    discord_user_id: normalizedDiscordUserId,
    status: response.status,
    joined_now: response.status === 201,
    already_member: response.status === 204,
  };
}


function extractWebhookFields(payload) {
  const meta = payload?.meta && typeof payload.meta === "object" ? payload.meta : {};
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const attributes = data?.attributes && typeof data.attributes === "object" ? data.attributes : {};
  const customData = meta?.custom_data && typeof meta.custom_data === "object" ? meta.custom_data : {};
  return {
    eventName: clean(meta.event_name || payload?.event_name || payload?.type).toLowerCase(),
    customData,
    status: clean(attributes.status).toLowerCase(),
    endsAt: clean(attributes.ends_at),
  };
}


export async function syncDiscordProAccessFromLemonWebhook({
  payload,
  env = process.env,
  now = new Date(),
}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      attempted: false,
      reason: "payload_missing",
    };
  }

  const { eventName, customData, status, endsAt } = extractWebhookFields(payload);
  const discordUserId = normalizeDiscordUserId(customData.discord_user_id);
  if (!discordUserId) {
    return {
      attempted: false,
      reason: "discord_user_id_missing",
      event_name: eventName,
    };
  }

  if (["order_created", "subscription_payment_success"].includes(eventName)) {
    return {
      attempted: true,
      action: "grant",
      event_name: eventName,
      result: await grantDiscordProRole({
        discordUserId,
        env,
      }),
    };
  }

  if (eventName === "subscription_expired" || eventName === "order_refunded" || eventName === "subscription_payment_refunded") {
    return {
      attempted: true,
      action: "revoke",
      event_name: eventName,
      result: await revokeDiscordProRole({
        discordUserId,
        env,
      }),
    };
  }

  if (eventName === "subscription_cancelled" && status === "cancelled" && endsAt) {
    const endsTimestamp = Date.parse(endsAt);
    if (Number.isFinite(endsTimestamp) && endsTimestamp < now.getTime()) {
      return {
        attempted: true,
        action: "revoke",
        event_name: eventName,
        result: await revokeDiscordProRole({
          discordUserId,
          env,
        }),
      };
    }
  }

  return {
    attempted: false,
    reason: "event_not_mapped",
    event_name: eventName,
  };
}


export async function activateDiscordProAccess({
  email,
  discordUserId,
  env = process.env,
}) {
  const normalizedEmail = clean(email).toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Checkout email is required.");
  }

  const normalizedDiscordUserId = normalizeDiscordUserId(discordUserId);
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID must be a numeric Discord ID or profile link.");
  }

  const subscription = await findEntitledLemonSubscription({
    email: normalizedEmail,
    env,
  });
  if (!subscription) {
    throw new Error("No active TradeOps subscription was found for that email.");
  }

  const roleResult = await grantDiscordProRole({
    discordUserId: normalizedDiscordUserId,
    env,
  });

  return {
    ok: true,
    email: normalizedEmail,
    discord_user_id: normalizedDiscordUserId,
    already_active: roleResult.already_active,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      product_name: subscription.productName,
      variant_name: subscription.variantName,
      customer_portal_url: subscription.customerPortalUrl,
    },
    premium_role: roleResult.premium_role,
    channel_sync: roleResult.channel_sync,
  };
}
