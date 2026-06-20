import {
  TRADEOPS_PRO_ENTITLEMENT_KEY,
  deleteDiscordLinkByUserId,
  getDiscordLinkForUser,
  getEntitlementForUser,
  getLatestSubscriptionForUser,
  getUserByDiscordUserId,
  getUserByEmail,
  getUserById,
  isMemberDatabaseConfigured,
  normalizeEmail,
  saveDiscordLink,
  upsertEntitlement,
  upsertSubscriptionRow,
  upsertUserByEmail,
} from "./member-db.js";
import { grantDiscordProRole, revokeDiscordProRole } from "./discord-entitlements.js";
import { findEntitledLemonSubscription, isEntitledLemonSubscription } from "./lemon-squeezy.js";


function clean(value) {
  return String(value || "").trim();
}


function parseTimestamp(value) {
  const normalized = clean(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}


function pickPortalUrl(urls) {
  if (!urls || typeof urls !== "object") {
    return "";
  }
  return (
    clean(urls.customer_portal) ||
    clean(urls.update_subscription) ||
    clean(urls.update_payment_method) ||
    ""
  );
}


export function extractLemonWebhookDetails(payload) {
  const meta = payload?.meta && typeof payload.meta === "object" ? payload.meta : {};
  const customData = meta?.custom_data && typeof meta.custom_data === "object" ? meta.custom_data : {};
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const attributes = data?.attributes && typeof data.attributes === "object" ? data.attributes : {};
  const urls = attributes?.urls && typeof attributes.urls === "object" ? attributes.urls : {};

  const eventName = clean(meta.event_name || payload?.event_name || payload?.type).toLowerCase();
  const dataType = clean(data.type).toLowerCase();
  const dataId = clean(data.id);
  const email = normalizeEmail(
    attributes.user_email ||
      attributes.customer_email ||
      customData.email ||
      customData.checkout_email,
  );
  const providerSubscriptionId =
    clean(attributes.subscription_id) ||
    (dataType.includes("subscription") ? dataId : "") ||
    clean(customData.subscription_id);
  const providerOrderId =
    clean(attributes.order_id) ||
    (dataType === "orders" ? dataId : "") ||
    clean(customData.order_id);
  const providerRef =
    providerSubscriptionId
      ? `lemon_subscription:${providerSubscriptionId}`
      : providerOrderId
        ? `lemon_order:${providerOrderId}`
        : email
          ? `lemon_email:${email}`
          : "";

  return {
    eventName,
    dataType,
    dataId,
    email,
    providerRef,
    providerCustomerId: clean(attributes.customer_id || customData.customer_id),
    providerSubscriptionId,
    providerOrderId,
    status: clean(attributes.status).toLowerCase(),
    variantId: clean(attributes.variant_id || customData.variant_id),
    planName: clean(attributes.variant_name || attributes.product_name || customData.plan_name || "TradeOps Pro"),
    customerPortalUrl: pickPortalUrl(urls),
    startedAt: clean(attributes.created_at),
    renewsAt: clean(attributes.renews_at),
    endsAt: clean(attributes.ends_at),
    cancelledAt: clean(attributes.cancelled_at),
    discordUserId: clean(customData.discord_user_id),
    rawPayloadJson: payload,
  };
}


export function deriveTradeopsProEntitlement(details, now = new Date()) {
  const eventName = clean(details?.eventName).toLowerCase();
  const status = clean(details?.status).toLowerCase();
  const endsAt = clean(details?.endsAt);
  const endsAtMs = parseTimestamp(endsAt);

  if (["order_refunded", "subscription_payment_refunded", "subscription_expired"].includes(eventName)) {
    return {
      status: "inactive",
      expiresAt: endsAt || now.toISOString(),
      grantedAt: null,
      source: `lemon:${eventName}`,
    };
  }

  if (["order_created", "subscription_payment_success"].includes(eventName) && !status) {
    return {
      status: "active",
      expiresAt: endsAt || null,
      grantedAt: now.toISOString(),
      source: `lemon:${eventName}`,
    };
  }

  if (["active", "on_trial", "paused", "past_due"].includes(status)) {
    return {
      status: "active",
      expiresAt: endsAt || null,
      grantedAt: now.toISOString(),
      source: `lemon:${eventName || status}`,
    };
  }

  if (status === "cancelled") {
    const stillEntitled = !endsAtMs || endsAtMs >= now.getTime();
    return {
      status: stillEntitled ? "active" : "inactive",
      expiresAt: endsAt || null,
      grantedAt: stillEntitled ? now.toISOString() : null,
      source: `lemon:${eventName || status}`,
    };
  }

  return {
    status: "inactive",
    expiresAt: endsAt || null,
    grantedAt: null,
    source: `lemon:${eventName || status || "unknown"}`,
  };
}


export function hasActiveTradeopsProEntitlement(entitlement, now = new Date()) {
  if (!entitlement || clean(entitlement.entitlementKey || entitlement.entitlement_key) !== TRADEOPS_PRO_ENTITLEMENT_KEY) {
    return false;
  }
  if (clean(entitlement.status).toLowerCase() !== "active") {
    return false;
  }
  const expiresAt = parseTimestamp(entitlement.expiresAt || entitlement.expires_at);
  return !expiresAt || expiresAt >= now.getTime();
}


async function syncLocalMembershipFromLemonSubscription({
  email,
  subscription,
  env = process.env,
  now = new Date(),
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Checkout email is required.");
  }
  if (!subscription || typeof subscription !== "object") {
    throw new Error("A Lemon subscription is required.");
  }

  const user = await upsertUserByEmail({ email: normalizedEmail }, env);
  await upsertSubscriptionRow(
    {
      userId: user.id,
      provider: "lemon_squeezy",
      providerRef: clean(subscription.id) ? `lemon_subscription:${clean(subscription.id)}` : `lemon_email:${normalizedEmail}`,
      providerCustomerId: subscription.customerId,
      providerSubscriptionId: subscription.id,
      providerOrderId: subscription.orderId,
      status: subscription.status || "active",
      variantId: subscription.variantId,
      planName: subscription.productName || "TradeOps Pro",
      customerPortalUrl: subscription.customerPortalUrl,
      startedAt: subscription.createdAt,
      renewsAt: subscription.renewsAt,
      expiresAt: subscription.endsAt,
      cancelledAt: subscription.cancelled ? subscription.endsAt : "",
      rawPayloadJson: subscription,
    },
    env,
  );
  await upsertEntitlement(
    {
      userId: user.id,
      entitlementKey: TRADEOPS_PRO_ENTITLEMENT_KEY,
      status: isEntitledLemonSubscription(subscription, now) ? "active" : "inactive",
      grantedAt: isEntitledLemonSubscription(subscription, now) ? now.toISOString() : null,
      expiresAt: subscription.endsAt || null,
      source: "lemon:direct_lookup",
    },
    env,
  );

  return user;
}


async function linkDiscordToTradeopsUser({
  userId,
  discordUserId,
  discordUsername = "",
  discordGlobalName = "",
  env = process.env,
  now = new Date(),
}) {
  const normalizedUserId = clean(userId);
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedUserId || !normalizedDiscordUserId) {
    throw new Error("userId and discordUserId are required.");
  }

  const [currentLink, existingOwner] = await Promise.all([
    getDiscordLinkForUser(normalizedUserId, env),
    getUserByDiscordUserId(normalizedDiscordUserId, env),
  ]);

  if (currentLink?.discordUserId && currentLink.discordUserId !== normalizedDiscordUserId) {
    throw new Error("This TradeOps account is already linked to a different Discord account.");
  }

  if (existingOwner && existingOwner.id !== normalizedUserId) {
    const existingOwnerAccess = await getMemberAccessStateForUser(existingOwner.id, env, now);
    if (existingOwnerAccess.hasActivePro) {
      throw new Error("This Discord account is already linked to another active TradeOps member.");
    }
    await deleteDiscordLinkByUserId(existingOwner.id, env);
  }

  return saveDiscordLink(
    {
      userId: normalizedUserId,
      discordUserId: normalizedDiscordUserId,
      discordUsername,
      discordGlobalName,
    },
    env,
  );
}


async function syncDiscordRoleForAccess({
  discordUserId,
  hasActivePro,
  env = process.env,
}) {
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedDiscordUserId) {
    return {
      attempted: false,
      reason: "discord_not_linked",
    };
  }

  try {
    if (hasActivePro) {
      return {
        attempted: true,
        action: "grant",
        result: await grantDiscordProRole({
          discordUserId: normalizedDiscordUserId,
          env,
        }),
      };
    }
    return {
      attempted: false,
      reason: "pro_inactive",
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: error instanceof Error ? error.message : "Discord sync failed.",
    };
  }
}


export async function resolveMemberSessionFromDiscordOAuth({
  discordUserId,
  discordEmail = "",
  discordUsername = "",
  discordGlobalName = "",
  currentUserId = "",
  env = process.env,
  now = new Date(),
}) {
  const normalizedDiscordUserId = clean(discordUserId);
  const normalizedDiscordEmail = normalizeEmail(discordEmail);
  const normalizedCurrentUserId = clean(currentUserId);
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID is required.");
  }

  let user = null;
  let source = "not_found";

  if (normalizedCurrentUserId) {
    user = await getUserById(normalizedCurrentUserId, env);
    source = user ? "current_session" : source;
  }

  if (!user) {
    user = await getUserByDiscordUserId(normalizedDiscordUserId, env);
    source = user ? "discord_link" : source;
  }

  if (!user && normalizedDiscordEmail) {
    user = await getUserByEmail(normalizedDiscordEmail, env);
    source = user ? "email_match" : source;
  }

  if (!user && normalizedDiscordEmail) {
    user = await upsertUserByEmail({ email: normalizedDiscordEmail }, env);
    source = "discord_email_created";
  }

  if (!user) {
    return {
      ok: false,
      linked: false,
      source,
      reason: "user_not_found",
      user: null,
      access: null,
      discordLink: null,
      roleSync: {
        attempted: false,
        reason: "user_not_found",
      },
    };
  }

  const discordLink = await linkDiscordToTradeopsUser({
    userId: user.id,
    discordUserId: normalizedDiscordUserId,
    discordUsername,
    discordGlobalName,
    env,
    now,
  });
  const access = await getMemberAccessStateForUser(user.id, env, now);
  const roleSync = await syncDiscordRoleForAccess({
    discordUserId: normalizedDiscordUserId,
    hasActivePro: access.hasActivePro,
    env,
  });

  return {
    ok: true,
    linked: true,
    source,
    user,
    access,
    discordLink,
    roleSync,
  };
}


export async function claimTradeopsProAccess({
  email,
  discordUserId,
  discordUsername = "",
  discordGlobalName = "",
  env = process.env,
  now = new Date(),
}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedDiscordUserId = clean(discordUserId);
  if (!normalizedEmail) {
    throw new Error("Checkout email is required.");
  }
  if (!normalizedDiscordUserId) {
    throw new Error("Discord user ID is required.");
  }

  let user = await getUserByEmail(normalizedEmail, env);
  let access = user ? await getMemberAccessStateForUser(user.id, env, now) : null;
  let source = user ? "member_database" : "direct_lookup";

  if (!access?.hasActivePro) {
    const entitledSubscription = await findEntitledLemonSubscription({
      email: normalizedEmail,
      env,
      now,
    });
    if (!entitledSubscription) {
      throw new Error("No active TradeOps subscription was found for that email.");
    }
    user = await syncLocalMembershipFromLemonSubscription({
      email: normalizedEmail,
      subscription: entitledSubscription,
      env,
      now,
    });
    access = await getMemberAccessStateForUser(user.id, env, now);
    source = "direct_lookup";
  }

  if (!user || !access?.hasActivePro) {
    throw new Error("No active TradeOps subscription was found for that email.");
  }

  const targetUserLink = await getDiscordLinkForUser(user.id, env);
  if (targetUserLink?.discordUserId && targetUserLink.discordUserId !== normalizedDiscordUserId) {
    throw new Error("This TradeOps membership is already linked to another Discord account.");
  }

  const discordLink = await linkDiscordToTradeopsUser({
    userId: user.id,
    discordUserId: normalizedDiscordUserId,
    discordUsername,
    discordGlobalName,
    env,
    now,
  });
  const refreshedAccess = await getMemberAccessStateForUser(user.id, env, now);
  const roleSync = await syncDiscordRoleForAccess({
    discordUserId: normalizedDiscordUserId,
    hasActivePro: refreshedAccess.hasActivePro,
    env,
  });

  return {
    ok: true,
    source,
    user,
    access: refreshedAccess,
    discordLink,
    roleSync,
  };
}


export async function syncMembershipFromLemonWebhook({
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
  if (!isMemberDatabaseConfigured(env)) {
    return {
      attempted: false,
      reason: "database_not_configured",
    };
  }

  const details = extractLemonWebhookDetails(payload);
  if (!details.email) {
    return {
      attempted: false,
      reason: "email_missing",
      event_name: details.eventName,
    };
  }

  const user = await upsertUserByEmail({ email: details.email }, env);
  const subscription = await upsertSubscriptionRow(
    {
      userId: user.id,
      provider: "lemon_squeezy",
      providerRef: details.providerRef || `lemon_email:${details.email}`,
      providerCustomerId: details.providerCustomerId,
      providerSubscriptionId: details.providerSubscriptionId,
      providerOrderId: details.providerOrderId,
      status: details.status || details.eventName || "unknown",
      variantId: details.variantId,
      planName: details.planName,
      customerPortalUrl: details.customerPortalUrl,
      startedAt: details.startedAt,
      renewsAt: details.renewsAt,
      expiresAt: details.endsAt,
      cancelledAt: details.cancelledAt,
      rawPayloadJson: details.rawPayloadJson,
    },
    env,
  );
  const entitlementUpdate = deriveTradeopsProEntitlement(details, now);
  const entitlement = await upsertEntitlement(
    {
      userId: user.id,
      entitlementKey: TRADEOPS_PRO_ENTITLEMENT_KEY,
      status: entitlementUpdate.status,
      grantedAt: entitlementUpdate.grantedAt,
      expiresAt: entitlementUpdate.expiresAt,
      source: entitlementUpdate.source,
    },
    env,
  );

  const discordLink = await getDiscordLinkForUser(user.id, env);
  let discordSync = {
    attempted: false,
    reason: "discord_not_linked",
  };

  if (discordLink?.discordUserId) {
    try {
      if (hasActiveTradeopsProEntitlement(entitlement, now)) {
        discordSync = {
          attempted: true,
          action: "grant",
          result: await grantDiscordProRole({
            discordUserId: discordLink.discordUserId,
            env,
          }),
        };
      } else {
        discordSync = {
          attempted: true,
          action: "revoke",
          result: await revokeDiscordProRole({
            discordUserId: discordLink.discordUserId,
            env,
          }),
        };
      }
    } catch (error) {
      discordSync = {
        attempted: true,
        ok: false,
        error: error instanceof Error ? error.message : "Discord sync failed.",
      };
    }
  }

  return {
    attempted: true,
    event_name: details.eventName,
    user,
    subscription,
    entitlement,
    discord_sync: discordSync,
  };
}


export async function getMemberAccessStateForUser(userId, env = process.env, now = new Date()) {
  const [entitlement, subscription, discordLink] = await Promise.all([
    getEntitlementForUser(userId, TRADEOPS_PRO_ENTITLEMENT_KEY, env),
    getLatestSubscriptionForUser(userId, env),
    getDiscordLinkForUser(userId, env),
  ]);

  return {
    entitlement,
    subscription,
    discordLink,
    hasActivePro: hasActiveTradeopsProEntitlement(entitlement, now),
  };
}
