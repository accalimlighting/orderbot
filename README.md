# OrderCheck — PDF Order Comparison Tool

Compare a customer's purchase order against your entered order to catch discrepancies before they become problems.

## What it checks
- Part number accuracy (exact match required)
- Quantity mismatches
- Pricing differences
- Missing line items (in either direction)
- PO number, dates, ship-to/bill-to header fields
- Any other discrepancies the AI spots

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import the repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
4. Deploy — that's it

## Run locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack
- Next.js 14 (App Router)
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-20250514)
- TypeScript
