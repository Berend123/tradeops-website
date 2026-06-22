# TradeOps Website

Public TradeOps landing site for the daily market brief product.

## Stack

- Next.js
- React
- Vercel deployment target

## Local Development

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Default local URL:

- `http://127.0.0.1:3000` if available
- current local production-style run in this workspace has used `http://127.0.0.1:3002`

## Environment Variables

Current environment variables:

- `NEXT_PUBLIC_DISCORD_URL`
- `NEXT_PUBLIC_ATTRIBUTION_ENDPOINT`
- `NEXT_PUBLIC_CHECKOUT_ENDPOINT`
- `DATABASE_URL`
- `AUTH_SECRET`
- `TRADEOPS_CONVERSION_API_BASE_URL`
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_PRODUCT_ID`
- `LEMON_SQUEEZY_VARIANT_ID`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `LEMON_SQUEEZY_TEST_MODE`
- `TRADEOPS_DISCORD_BOT_TOKEN`
- `TRADEOPS_DISCORD_TOKEN_FILE`
- `TRADEOPS_DISCORD_GUILD_ID`
- `TRADEOPS_DISCORD_CLIENT_ID`
- `TRADEOPS_DISCORD_OAUTH_REDIRECT_URI`
- `TRADEOPS_DISCORD_PRO_ROLE_ID`
- `TRADEOPS_DISCORD_PREMIUM_ROLE_NAME`
- `TRADEOPS_DISCORD_PREMIUM_CHANNELS`

`TRADEOPS_CONVERSION_API_BASE_URL` should point at the Python conversion API server that exposes:

- `POST /api/attribution/event`
- `POST /api/checkout/session`
- `POST /api/checkout/webhook?provider=...`
- `POST /api/discord/join`
- `GET /api/health`

The Next.js app proxies browser requests to that backend so `atid`, first-touch, last-touch, checkout handoff, and Discord join attribution all stay first-party.

If the conversion API is unavailable, the checkout session route can fall back to creating a Lemon Squeezy hosted checkout directly from the website runtime. The webhook route can also verify and acknowledge Lemon Squeezy webhooks directly so live payments are not blocked by a missing backend host.

Discord identity can now be linked through:

- `GET /api/discord/oauth/start`
- `POST /api/discord/oauth/finalize`
- `/discord/oauth/complete`

That flow stores the Discord user in a first-party cookie, joins the user to the TradeOps guild with `guilds.join`, and lets checkout/webhooks carry `discord_user_id` automatically.

The join page also exposes a direct Discord activation flow at `POST /api/discord/activate`. That route verifies an active Lemon Squeezy subscription by checkout email, ensures a bot-manageable premium role exists, syncs that role onto the premium channels, and grants it to the connected Discord member. The direct Lemon webhook fallback now attempts to grant `Pro Access` automatically on successful payment events when checkout metadata includes `discord_user_id`.

Member routes now include:

- `/login`
- `/dashboard`
- `/dashboard/history`
- `/account`

The current member portal is **Discord-first**:

- members sign in with Discord
- `/join` is the claim/bind page after checkout
- the website dashboard and Discord Pro role are unlocked from the same shared entitlement

The dashboard reads published member-facing snapshots from Neon Postgres. Use the bootstrap and backfill scripts before the first production launch:

```powershell
npm run db:bootstrap
npm run members:backfill
```

## Deploy To Vercel

1. Push this `website` directory to its own GitHub repository.
2. Import that repository into Vercel.
3. Set the framework preset to `Next.js` if Vercel does not detect it automatically.
4. Add environment variables in the Vercel project settings.
5. Deploy the production branch.

## Custom Domain

Production domain:

- `tradeops.org`

Recommended setup:

- primary domain: `tradeops.org`
- redirect `www.tradeops.org` to `tradeops.org`

In Vercel:

1. Open the project.
2. Go to `Settings > Domains`.
3. Add `tradeops.org`.
4. Add `www.tradeops.org`.
5. apply the DNS records Vercel gives you at your registrar
6. confirm SSL is active

## What Should Not Be Committed

- `node_modules`
- `.next`
- `.vercel`
- `.env.local`
- production secrets
- local logs

## Suggested Repository Name

- `tradeops-website`

## Suggested Vercel Project Name

- `tradeops-website`
