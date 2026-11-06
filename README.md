# StiltWalker.net — Multi-Stream Revenue Platform & Autonomous Ops

Built for **stiltwalker.net** (founded by real stilt walker **Beau Carnes**).

## Quick Commands

```bash
# Compile all 36 static SEO pages, sitemap.xml, JSON-LD & assets into dist/
npm run build

# Preview full website + /api/submit form endpoint locally at http://localhost:4321
npm run dev

# Run automated Owner Health, Domain Expiry, Monetization & $50 Budget Audit
npm run ops
```

## Project Structure

- `data/monetization.json` — Central revenue config (Amazon tag, Thimble $30-CPL affiliate URL, Insurance Canopy, Bark backfill URL, Stripe Payment Links, Founder story).
- `data/cities.json` — 25 US metro local SEO markets (`/hire/las-vegas/`, `/hire/miami/`, `/hire/chicago/`, etc.).
- `data/gear-guides.json` — 4 practitioner-tested affiliate buyer guides (`/gear/best-drywall-stilts/`, `/gear/comfort-straps-replacement-parts/`, `/gear/circus-peg-and-jumping-stilts/`, `/gear/led-wings-mirror-man-costumes/`).
- `public/images/founder/` — Drop 1–2 real photos of Beau walking on stilts here and run `npm run build` to auto-enable the Founder photo showcase.
- `functions/api/submit.js` — Free Cloudflare Pages Function handling quote requests, performer signups, and checklist downloads (supports Resend free tier + Cloudflare KV + webhooks).
- `ops/` — `$50/mo` capital ledger (`budget-ledger.json`), ready-to-sell digital toolkits (`digital-products/`), and Grok Bot integration (`GROKBOT_PLAYBOOK.md` + `grokbot-inbox.json`).
