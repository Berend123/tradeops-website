import { ensureMemberSchema, upsertEntitlement, upsertSubscriptionRow, upsertUserByEmail } from "../lib/member-db.js";
import { isEntitledLemonSubscription, listAllLemonSubscriptions } from "../lib/lemon-squeezy.js";


async function main() {
  await ensureMemberSchema();
  const subscriptions = await listAllLemonSubscriptions();
  let processed = 0;

  for (const subscription of subscriptions) {
    if (!subscription.email) {
      continue;
    }

    const user = await upsertUserByEmail({
      email: subscription.email,
    });
    await upsertSubscriptionRow({
      userId: user.id,
      provider: "lemon_squeezy",
      providerRef: `lemon_subscription:${subscription.id}`,
      providerCustomerId: subscription.customerId,
      providerSubscriptionId: subscription.id,
      providerOrderId: subscription.orderId,
      status: subscription.status,
      variantId: subscription.variantId,
      planName: subscription.productName || "TradeOps Pro",
      customerPortalUrl: subscription.customerPortalUrl,
      startedAt: subscription.createdAt,
      renewsAt: subscription.renewsAt,
      expiresAt: subscription.endsAt,
      cancelledAt: subscription.cancelled ? subscription.endsAt : "",
      rawPayloadJson: subscription,
    });
    await upsertEntitlement({
      userId: user.id,
      entitlementKey: "tradeops_pro",
      status: isEntitledLemonSubscription(subscription) ? "active" : "inactive",
      grantedAt: isEntitledLemonSubscription(subscription) ? new Date().toISOString() : null,
      expiresAt: subscription.endsAt || null,
      source: "lemon:backfill",
    });
    processed += 1;
  }

  console.log(`Processed ${processed} Lemon subscriptions into the TradeOps member database.`);
}


main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
