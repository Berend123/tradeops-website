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

Current public variable expected by the site:

- `NEXT_PUBLIC_DISCORD_URL`

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
