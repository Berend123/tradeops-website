import { NextResponse } from "next/server";

import { getCurrentMemberSession } from "../../../../lib/member-auth";
import { getLatestSubscriptionForUser } from "../../../../lib/member-db";
import { findEntitledLemonSubscription, listLemonSubscriptionsByEmail } from "../../../../lib/lemon-squeezy";


function clean(value) {
  return String(value || "").trim();
}


function resolvePortalUrl(subscription) {
  return clean(subscription?.customerPortalUrl || subscription?.customer_portal_url);
}


export async function GET(request) {
  const session = await getCurrentMemberSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?redirect=%2Faccount", request.url), { status: 302 });
  }

  let portalUrl = "";
  const latestLocal = await getLatestSubscriptionForUser(session.userId).catch(() => null);
  portalUrl = resolvePortalUrl(latestLocal);

  if (!portalUrl) {
    const entitled = await findEntitledLemonSubscription({ email: session.email }).catch(() => null);
    portalUrl = resolvePortalUrl(entitled);
  }

  if (!portalUrl) {
    const subscriptions = await listLemonSubscriptionsByEmail({ email: session.email }).catch(() => []);
    portalUrl = resolvePortalUrl(subscriptions[0]);
  }

  if (!portalUrl) {
    return NextResponse.redirect(new URL("/pricing", request.url), { status: 302 });
  }

  return NextResponse.redirect(portalUrl, { status: 302 });
}
