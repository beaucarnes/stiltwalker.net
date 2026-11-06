#!/usr/bin/env node
/**
 * StiltWalker.net Automated Owner Operations & Revenue Health Check
 * Run manually (`npm run ops`) or via scheduled Antigravity automations.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "data/monetization.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, "ops/budget-ledger.json"), "utf8"));
const grokInbox = JSON.parse(fs.readFileSync(path.join(ROOT, "ops/grokbot-inbox.json"), "utf8"));

function checkLiveUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "HEAD", timeout: 5000 }, (res) => {
      resolve({ live: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode });
    });
    req.on("error", (err) => resolve({ live: false, error: err.code || err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ live: false, error: "TIMEOUT" });
    });
    req.end();
  });
}

(async () => {
  const now = new Date();
  const expiry = new Date(config.site.domainExpiryDate + "T22:45:13Z");
  const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  const founderDir = path.join(ROOT, "public/images/founder");
  const founderPhotos = fs.existsSync(founderDir)
    ? fs.readdirSync(founderDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    : [];

  const sitemapPath = path.join(ROOT, "dist/sitemap.xml");
  const builtPageCount = fs.existsSync(sitemapPath)
    ? (fs.readFileSync(sitemapPath, "utf8").match(/<loc>/g) || []).length
    : 0;

  const submissionsPath = path.join(ROOT, "ops/submissions.jsonl");
  const localLeads = fs.existsSync(submissionsPath)
    ? fs
        .readFileSync(submissionsPath, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean).length
    : 0;

  const liveCheck = await checkLiveUrl(`https://${config.site.domain}`);

  const stripeLinksConfigured = Object.values(config.products).filter((p) => Boolean(p.stripePaymentLink)).length;
  const totalStripeProducts = Object.keys(config.products).length;

  const pendingGrokBuyerLeads = (grokInbox.buyerLeads || []).filter((l) => l.status === "new").length;
  const pendingGrokPerformers = (grokInbox.performerProspects || []).filter((p) => p.status === "new").length;

  console.log("=== STILTWALKER.NET OWNER OPS SNAPSHOT ===");
  console.log(`Timestamp:            ${now.toISOString()}`);
  console.log(
    `Live Domain Status:   ${
      liveCheck.live ? `ONLINE (HTTP ${liveCheck.statusCode})` : `OFFLINE / PARKED (${liveCheck.error || liveCheck.statusCode})`
    }`
  );
  console.log(
    `Domain Renewal Check: ${daysToExpiry} days until ${config.site.domainExpiryDate} ${
      daysToExpiry <= 35 ? "⚠️ ACTION NEEDED: VERIFY IONOS AUTO-RENEW!" : "✓"
    }`
  );
  console.log(`Static SEO Pages:     ${builtPageCount} indexed routes in dist/sitemap.xml`);
  console.log(
    `Founder E-E-A-T Pics: ${founderPhotos.length} photo(s) in public/images/founder/ ${
      founderPhotos.length === 0 ? "(Drop Beau's stilt photos in to boost E-E-A-T!)" : "✓"
    }`
  );
  console.log(`Stripe Direct Links:  ${stripeLinksConfigured}/${totalStripeProducts} configured in data/monetization.json`);
  console.log(`Amazon Associate Tag: ${config.affiliates.amazonAssociateTag}`);
  console.log(`GrokBot Queue:        ${pendingGrokBuyerLeads} new event buyer leads | ${pendingGrokPerformers} performer prospects`);
  console.log(`Captured Form Leads:  ${localLeads} local + check Cloudflare KV / Resend inbox`);
  console.log(
    `Monthly $50 Budget:   $${ledger.currentMonthAllocatedUsd.toFixed(2)} allocated / $${ledger.monthlyCapUsd.toFixed(
      2
    )} cap ($${(ledger.monthlyCapUsd - ledger.currentMonthAllocatedUsd).toFixed(2)} reserve)`
  );
  console.log(`Current Monthly Rev:  $${ledger.currentMonthRevenueUsd.toFixed(2)} (Target 90-day break-even: $57.00/mo = 3 Pro members)`);
})();
