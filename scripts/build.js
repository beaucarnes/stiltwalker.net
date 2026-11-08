#!/usr/bin/env node
/**
 * StiltWalker.net Zero-Dependency Static Platform Compiler
 * Compiles 35+ SEO-optimized static HTML pages, JSON-LD Schema, sitemap.xml & assets into dist/
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PUBLIC_DIR = path.join(ROOT, "public");

const config = JSON.parse(fs.readFileSync(path.join(ROOT, "data/monetization.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cities.json"), "utf8"));
const gearGuides = JSON.parse(fs.readFileSync(path.join(ROOT, "data/gear-guides.json"), "utf8"));
const seedPerformers = JSON.parse(fs.readFileSync(path.join(ROOT, "data/seed-performers.json"), "utf8"));

// Detect real founder photos dropped into public/images/founder/
const founderDir = path.join(PUBLIC_DIR, "images/founder");
const founderPhotos = fs.existsSync(founderDir)
  ? fs
      .readdirSync(founderDir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/images/founder/${f}`)
  : [];

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function amazonUrl(searchQuery) {
  const tag = encodeURIComponent(config.affiliates.amazonAssociateTag || "stiltwalkernet-20");
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${tag}`;
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "README.md" || entry.name.startsWith(".")) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

const builtUrls = [];

function relativizeHtml(html, cleanRoute) {
  const depth = cleanRoute ? cleanRoute.split("/").filter(Boolean).length : 0;
  const prefix = depth === 0 ? "." : Array(depth).fill("..").join("/");
  return html.replace(/(href|src)="\/([^"]*)"/g, (_, attr, rest) => {
    if (rest.startsWith("/")) return `${attr}="/${rest}"`;
    return `${attr}="${prefix}/${rest}"`;
  });
}

function writePage(routePath, html) {
  const cleanRoute = routePath.replace(/^\/+|\/+$/g, "");
  const outFile = cleanRoute ? path.join(DIST, cleanRoute, "index.html") : path.join(DIST, "index.html");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, relativizeHtml(html, cleanRoute), "utf8");
  const canonicalUrl = cleanRoute ? `${config.site.url}/${cleanRoute}/` : `${config.site.url}/`;
  builtUrls.push(canonicalUrl);
}

function renderLayout({ title, description, route, activeNav, schemaJson, bodyHtml }) {
  const cleanRoute = route.replace(/^\/+|\/+$/g, "");
  const canonical = cleanRoute ? `${config.site.url}/${cleanRoute}/` : `${config.site.url}/`;
  const analyticsSnippet = config.site.analytics.cloudflareBeaconToken
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${esc(
        config.site.analytics.cloudflareBeaconToken
      )}"}'></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${config.site.url}/images/hero-stiltwalker.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  ${
    config.site.analytics.googleSiteVerification
      ? `<meta name="google-site-verification" content="${esc(config.site.analytics.googleSiteVerification)}" />`
      : ""
  }
  ${
    config.site.analytics.bingSiteVerification
      ? `<meta name="msvalidate.01" content="${esc(config.site.analytics.bingSiteVerification)}" />`
      : ""
  }
  <link rel="stylesheet" href="/css/styles.css" />
  ${schemaJson ? `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>` : ""}
  ${analyticsSnippet}
</head>
<body>
  <div class="topbar">
    <div class="container topbar-inner">
      <span><strong>Founding Performer Launch:</strong> Stilt walkers keep 100% of gig pay (0% platform commission).</span>
      <span><a href="/join/">Claim Your Free Performer Profile →</a> &nbsp;|&nbsp; <a href="/calculator/">Instant Event Cost Calculator</a></span>
    </div>
  </div>

  <header class="site-header">
    <div class="container nav-inner">
      <a href="/" class="brand" aria-label="StiltWalker.net Home">
        <span class="brand-mark">SW</span>
        <span>StiltWalker<em>.net</em></span>
      </a>
      <button class="mobile-toggle" data-mobile-toggle aria-label="Toggle Menu">Menu ☰</button>
      <ul class="nav-links" data-nav-links>
        <li><a href="/hire/" class="${activeNav === "hire" ? "active" : ""}">Hire Stilt Walkers</a></li>
        <li><a href="/calculator/" class="${activeNav === "calculator" ? "active" : ""}">Rate &amp; Clearance Calc</a></li>
        <li><a href="/gear/" class="${activeNav === "gear" ? "active" : ""}">Stilt Gear Reviews</a></li>
        <li><a href="/insurance/" class="${activeNav === "insurance" ? "active" : ""}">Performer Insurance</a></li>
        <li><a href="/contract-rider/" class="${activeNav === "rider" ? "active" : ""}">Contracts &amp; Haunt SOP</a></li>
      </ul>
      <div class="nav-actions">
        <a href="/join/" class="btn btn-outline-light btn-sm">List Your Act</a>
        <a href="/hire/#quote-form" class="btn btn-gold btn-sm">Get Event Quotes</a>
      </div>
    </div>
  </header>

  <main>
    ${bodyHtml}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="/" class="brand" style="margin-bottom:0.75rem;">
            <span class="brand-mark">SW</span>
            <span>StiltWalker<em>.net</em></span>
          </a>
          <p style="margin:0 0 1rem;max-width:36ch;">
            Founded by experienced stilt walker ${esc(config.founder.name)}. Helping event planners book safe, insured stilt acts—and helping performers &amp; builders choose reliable gear.
          </p>
          <p style="margin:0;font-size:0.8rem;opacity:0.8;">
            Reader-supported: When you buy gear or insurance via links on our site, we may earn an affiliate commission at zero extra cost to you.
          </p>
        </div>
        <div>
          <h4>Book by Top Markets</h4>
          <ul class="footer-links">
            ${cities
              .slice(0, 7)
              .map((c) => `<li><a href="/hire/${c.slug}/">Stilt Walkers in ${esc(c.city)}, ${c.state}</a></li>`)
              .join("\n            ")}
            <li><a href="/hire/#all-cities" style="color:var(--gold-bright);font-weight:700;">View All ${cities.length} US Cities →</a></li>
          </ul>
        </div>
        <div>
          <h4>Gear &amp; Costume Lab</h4>
          <ul class="footer-links">
            ${gearGuides.map((g) => `<li><a href="/gear/${g.slug}/">${esc(g.shortTitle)}</a></li>`).join("\n            ")}
          </ul>
        </div>
        <div>
          <h4>For Performers &amp; Haunts</h4>
          <ul class="footer-links">
            <li><a href="/join/">Join Directory (0% Commission)</a></li>
            <li><a href="/join/#pricing">Featured Pro ($19/mo)</a></li>
            <li><a href="/insurance/">$1M/$2M COI Insurance Guide</a></li>
            <li><a href="/contract-rider/">Free Safety Rider Generator</a></li>
            <li><a href="/contract-rider/#haunt-sop">Haunted House Stilt Fall SOP</a></li>
            <li><a href="/join/#badge">Verified Performer Badge</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${esc(config.site.brandName)}. Built by stilt walkers, for stilt walkers &amp; event pros.</span>
        <span>Questions or partnerships: <a href="mailto:${esc(config.site.contactEmail)}" style="color:var(--gold-bright);">${esc(config.site.contactEmail)}</a></span>
      </div>
    </div>
  </footer>

  <script src="/js/app.js"></script>
</body>
</html>`;
}

// Reusable Founder Section (E-E-A-T + Relatable Creator Story)
function renderFounderSection() {
  const configuredPhotos =
    Array.isArray(config.founder.photos) && config.founder.photos.length > 0
      ? config.founder.photos
      : founderPhotos.map((src, i) => ({
          src,
          caption: `Beau Carnes walking on stilts (${i + 1})`,
          alt: `${config.founder.name} walking on stilts (${i + 1})`
        }));

  const photoMarkup =
    configuredPhotos.length >= 3
      ? `<div class="founder-photo-grid">
          <figure class="founder-photo-main">
            <img src="${esc(configuredPhotos[0].src)}" alt="${esc(configuredPhotos[0].alt)}" loading="lazy" />
            <figcaption class="founder-caption">${esc(configuredPhotos[0].caption)}</figcaption>
          </figure>
          <figure class="founder-photo-sub">
            <img src="${esc(configuredPhotos[1].src)}" alt="${esc(configuredPhotos[1].alt)}" loading="lazy" />
            <figcaption class="founder-caption">${esc(configuredPhotos[1].caption)}</figcaption>
          </figure>
          <figure class="founder-photo-sub">
            <img src="${esc(configuredPhotos[2].src)}" alt="${esc(configuredPhotos[2].alt)}" loading="lazy" />
            <figcaption class="founder-caption">${esc(configuredPhotos[2].caption)}</figcaption>
          </figure>
        </div>`
      : configuredPhotos.length > 0
      ? `<div class="founder-photo-grid">
          ${configuredPhotos
            .map(
              (p) =>
                `<figure class="founder-photo-sub"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" /><figcaption class="founder-caption">${esc(p.caption)}</figcaption></figure>`
            )
            .join("")}
        </div>`
      : `<div style="padding:0.5rem;">
          <div class="badge badge-dark" style="margin-bottom:0.75rem;">Real Stilt-Walking Experience</div>
          <h3 style="margin:0 0 0.6rem;font-size:1.35rem;color:var(--gold-bright);">${esc(config.founder.name)}</h3>
          <p style="margin:0 0 0.9rem;font-size:0.9rem;color:var(--text-light-muted);">${esc(config.founder.title)}</p>
          <div class="founder-quote-card">
            "${esc(config.founder.shortBio)}"
          </div>
        </div>`;

  return `
  <section class="section" id="about-creator">
    <div class="container">
      <div class="founder-box">
        <div class="founder-visual">
          ${photoMarkup}
        </div>
        <div>
          <span class="eyebrow">Why StiltWalker.net Exists</span>
          <h2 style="margin:0 0 1rem;font-size:clamp(1.65rem,2.8vw,2.25rem);line-height:1.18;">
            ${esc(config.founder.headline)}
          </h2>
          ${
            founderPhotos.length > 0
              ? `<p style="color:#fde68a;font-weight:600;margin:0 0 0.9rem;">"${esc(config.founder.shortBio)}"</p>`
              : ""
          }
          ${config.founder.storyParagraphs
            .map((p) => `<p style="color:var(--text-light-muted);margin:0 0 0.95rem;">${esc(p)}</p>`)
            .join("")}
          <ul class="founder-checks">
            ${config.founder.credentials.map((c) => `<li>${esc(c)}</li>`).join("")}
          </ul>
          <div style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:0.8rem;">
            <a href="/gear/" class="btn btn-gold btn-sm">Read My Field-Tested Gear Guides</a>
            <a href="/join/" class="btn btn-outline-light btn-sm">Fellow Stilt Walker? Join Free</a>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

// Reusable Calculator Widget
function renderCalculatorWidget() {
  return `
  <div class="calc-shell" data-stilt-calculator>
    <div class="calc-inputs">
      <span class="badge" style="margin-bottom:0.75rem;">Interactive Event Spec Tool</span>
      <h3 style="margin:0 0 0.4rem;font-size:1.45rem;">Instant Stilt Rate, Set-Break &amp; Clearance Calculator</h3>
      <p style="margin:0 0 1.35rem;color:var(--text-muted);font-size:0.93rem;">
        Check realistic 2026 US booking budgets AND verify your venue ceiling clears your performer safely.
      </p>
      <div class="grid-2" style="gap:1rem;">
        <div class="field-group">
          <label>Event Type</label>
          <select name="calcEventType">
            <option value="corporate">Corporate Gala / Brand Activation</option>
            <option value="hora_loca">Wedding Hora Loca ('Crazy Hour')</option>
            <option value="festival">Street Festival / Parade</option>
            <option value="private">Private Party / Birthday</option>
            <option value="haunt">Halloween / Haunted Attraction</option>
          </select>
        </div>
        <div class="field-group">
          <label>Total Booking Span</label>
          <select name="calcHours">
            <option value="1">1 Hour (Single High-Energy Set)</option>
            <option value="2" selected>2 Hours (Standard Minimum)</option>
            <option value="3">3 Hours (Multi-Set Event)</option>
            <option value="4">4 Hours (Half-Day Festival)</option>
            <option value="6">6 Hours (Full-Day Activation)</option>
          </select>
        </div>
        <div class="field-group">
          <label>Costume &amp; Visual Tier</label>
          <select name="calcCostume">
            <option value="standard">Classic Carnival / Circus Costume</option>
            <option value="led_wings" selected>Illuminated LED Wings / Glow Couture</option>
            <option value="mirror_man">Hand-Tiled Mirror Man Mosaic Suit</option>
            <option value="custom_branded">Custom Corporate Branded Look</option>
          </select>
        </div>
        <div class="field-group">
          <label>Desired Stilt Foot Height</label>
          <select name="calcStiltHeight">
            <option value="18">18 inches (~7.5 ft tall performer)</option>
            <option value="24" selected>24 inches (~8.0 ft tall — Most Popular)</option>
            <option value="30">30 inches (~8.5 ft tall ballroom)</option>
            <option value="36">36 inches (~9.0 ft tall convention/outdoor)</option>
            <option value="48">48 inches (~10+ ft festival giant)</option>
          </select>
        </div>
        <div class="field-group">
          <label>Lowest Venue Ceiling / Chandelier</label>
          <select name="calcVenueCeiling">
            <option value="8">8 ft (Standard Home / Low Tent)</option>
            <option value="9">9 ft (Small Banquet Room)</option>
            <option value="10">10 ft (Loft / Hotel Foyer)</option>
            <option value="12" selected>12 ft+ (Hotel Ballroom)</option>
            <option value="20">20 ft+ / Outdoor Open Sky</option>
          </select>
        </div>
        <div class="field-group">
          <label>Peak Holiday Date? (Oct 15–31, NYE, July 4, Mardi Gras)</label>
          <select name="calcPeak">
            <option value="no" selected>Standard Date</option>
            <option value="yes">Yes — Peak Holiday Date</option>
          </select>
        </div>
      </div>
    </div>

    <div class="calc-results">
      <div>
        <span class="eyebrow" style="margin-bottom:0.5rem;">Estimated US Market Rate</span>
        <div class="calc-price-big" data-calc-range>$575 – $800</div>
        <div class="calc-alert" data-calc-alert></div>
        <ul class="calc-breakdown">
          <li><span>Min. Safe Ceiling Clearance:</span> <strong data-calc-clearance>8.8 ft minimum</strong></li>
          <li><span>Recommended Set Pacing:</span> <strong data-calc-schedule>2 × 40-min sets</strong></li>
          <li><span>Ideal Stilt Apparatus:</span> <strong data-calc-apparatus>Pro Articulating Stilts</strong></li>
          <li><span>Standard COI Requirement:</span> <strong>$1M / $2M Liability</strong></li>
        </ul>
      </div>
      <div>
        <a href="/hire/#quote-form" class="btn btn-gold" style="width:100%;" data-calc-to-quote>
          Lock In Quotes With These Exact Specs →
        </a>
        <p style="margin:0.65rem 0 0;font-size:0.78rem;color:var(--text-light-muted);text-align:center;">
          100% free quote request • Direct 0%-markup connection to performers
        </p>
      </div>
    </div>
  </div>`;
}

// Reusable Quote Form
function renderQuoteForm(defaultCity = "") {
  return `
  <div class="form-card" id="quote-form">
    <span class="badge badge-emerald" style="margin-bottom:0.65rem;">Free • Zero Planner Service Fees</span>
    <h3 style="margin:0 0 0.4rem;font-size:1.5rem;">Request Vetted Stilt Walker Quotes${defaultCity ? ` in ${esc(defaultCity)}` : ""}</h3>
    <p style="margin:0 0 1.4rem;color:var(--text-muted);font-size:0.94rem;">
      GigSalad tacks a 10%–12% service fee onto your booking. On StiltWalker.net, you connect directly with performers filtered by your exact venue ceiling and COI requirements.
    </p>
    <form data-async-form="quote" data-quote-form data-bark-url="${esc(config.affiliates.barkBackfillUrl)}">
      <input type="hidden" name="formType" value="quote" />
      <div class="grid-2" style="gap:1rem;margin-bottom:1rem;">
        <div class="field-group">
          <label>Your Name *</label>
          <input type="text" name="name" required placeholder="Alex Rivera" />
        </div>
        <div class="field-group">
          <label>Work or Personal Email *</label>
          <input type="email" name="email" required placeholder="alex@company.com" />
        </div>
        <div class="field-group">
          <label>Event City &amp; State *</label>
          <input type="text" name="city" required value="${esc(defaultCity)}" placeholder="e.g., Miami, FL" />
        </div>
        <div class="field-group">
          <label>Event Date *</label>
          <input type="date" name="eventDate" required />
        </div>
        <div class="field-group">
          <label>Event Category</label>
          <select name="eventType">
            <option value="Corporate / Brand Activation">Corporate / Brand Activation</option>
            <option value="Wedding / Hora Loca">Wedding / Hora Loca</option>
            <option value="Festival / Street Parade">Festival / Street Parade</option>
            <option value="Private Party">Private Party / Milestone</option>
            <option value="Halloween / Haunted Attraction">Halloween / Haunted Attraction</option>
          </select>
        </div>
        <div class="field-group">
          <label>Venue Ceiling &amp; COI Needs</label>
          <select name="venueSpec">
            <option value="12ft+ Ballroom + COI Required">12 ft+ Ballroom ($1M COI Needed)</option>
            <option value="Outdoor Event + COI Required">Outdoor Venue ($1M COI Needed)</option>
            <option value="8.5-10ft Indoor Ceiling">8.5–10 ft Low Indoor Ceiling</option>
            <option value="Private Residence / No COI">Private Residence (No COI Required)</option>
          </select>
        </div>
      </div>
      <div class="field-group" style="margin-bottom:1.15rem;">
        <label>Costume Theme, Set Hours &amp; Notes</label>
        <textarea name="notes" rows="3" placeholder="Tell us your theme (e.g. Gold LED Gala, Mirror Man, Carnival Wings), approximate guest count, and hours needed..."></textarea>
      </div>
      <button type="submit" class="btn btn-gold btn-lg" style="width:100%;">Get Free Stilt Walker Quotes →</button>
      <div class="form-status" data-form-status></div>
    </form>
  </div>`;
}

// Act Archetype Cards (Honest Booking Configurations + Founding Performer CTA)
const actArchetypes = [
  {
    title: "Illuminated Gold & LED Gala Greeter",
    rate: "$550 – $950 / 2 hrs",
    image: "/images/hero-stiltwalker.jpg",
    minCeiling: 9,
    apparatus: "drywall articulating",
    theme: "corporate led",
    coi: "yes",
    specs: ["Min Ceiling: 9.0 ft", "Articulating Flat-Foot", "$1M/$2M COI Standard", "Stationary Photo-Safe"],
    desc: "Ideal for upscale corporate cocktail hours, red-carpet entrances, champagne pours, and convention booth traffic."
  },
  {
    title: "Hora Loca & Festival Winged Dancer",
    rate: "$400 – $850 / event",
    image: "/images/festival-wings.jpg",
    minCeiling: 10,
    apparatus: "peg",
    theme: "hora_loca festival led",
    coi: "yes",
    specs: ["Min Ceiling: 10.0 ft", "Lightweight Circus Pegs", "Dance-Floor Agile", "LED / Silk Isis Wings"],
    desc: "High-energy 45-minute wedding Hora Loca entrances, street parades, music festivals, and conga-line crowd activation."
  },
  {
    title: "Athletic Jumping / Power Stilt Acrobat",
    rate: "$600 – $1,200 / day",
    image: "/images/jumping-stilts.jpg",
    minCeiling: 12,
    apparatus: "jumping",
    theme: "festival corporate haunt",
    coi: "yes",
    specs: ["Min Ceiling: 12+ ft / Outdoor", "Fiberglass Bocking Springs", "3–5 ft Vertical Bounds", "High-Speed Roaming"],
    desc: "Jaw-dropping athletic bounds, 15 mph sprints, and futuristic creature movement for sports fan zones, parades, and haunts."
  },
  {
    title: "Mirror Man & Custom Branded Spec",
    rate: "$650 – $1,250 / 2 hrs",
    image: "/images/pro-stilts-gear.jpg",
    minCeiling: 9,
    apparatus: "drywall articulating",
    theme: "corporate mirror hora_loca",
    coi: "yes",
    specs: ["Min Ceiling: 9.0 ft", "Dual-Pole Magnesium", "Shatterproof Mirror Suit", "VIP & Nightclub Ready"],
    desc: "Living disco-ball mosaic suits and custom branded wardrobe built to dominate spotlighted stages and luxury launches."
  }
];

function renderActFilterShowcase() {
  return `
  <div data-act-filter>
    <div class="filter-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;flex-wrap:wrap;gap:0.5rem;">
        <strong style="font-size:0.95rem;">Filter Stilt Configurations by Physical Venue Specs</strong>
        <span class="badge badge-emerald" data-act-count>${actArchetypes.length} matching act configurations</span>
      </div>
      <div class="filter-row">
        <div class="field-group">
          <label>Your Venue Ceiling</label>
          <select name="filterCeiling">
            <option value="all">Any Ceiling Height</option>
            <option value="9">9 ft Low Indoor Ceiling</option>
            <option value="10">10 ft Banquet / Tent</option>
            <option value="12">12 ft+ Ballroom / Outdoor</option>
          </select>
        </div>
        <div class="field-group">
          <label>Stilt Apparatus</label>
          <select name="filterApparatus">
            <option value="all">All Stilt Types</option>
            <option value="drywall">Flat-Foot / Drywall (Photo Stable)</option>
            <option value="peg">Circus Peg Stilts (Dance Agile)</option>
            <option value="jumping">Jumping / Bocking Springs</option>
          </select>
        </div>
        <div class="field-group">
          <label>Event Vibe / Theme</label>
          <select name="filterTheme">
            <option value="all">All Themes</option>
            <option value="corporate">Corporate &amp; Gala</option>
            <option value="hora_loca">Wedding Hora Loca</option>
            <option value="led">LED &amp; Glow</option>
            <option value="mirror">Mirror Man Suit</option>
            <option value="festival">Parade &amp; Festival</option>
            <option value="haunt">Halloween / Haunt</option>
          </select>
        </div>
        <div class="field-group">
          <label>Insurance Requirement</label>
          <select name="filterCoi">
            <option value="all">Any Insurance Status</option>
            <option value="yes">Requires $1M/$2M COI</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid-2">
      ${actArchetypes
        .map(
          (a) => `
      <article class="card" data-act-card data-min-ceiling="${a.minCeiling}" data-apparatus="${a.apparatus}" data-theme="${a.theme}" data-coi="${a.coi}">
        <div class="card-media">
          <img src="${a.image}" alt="${esc(a.title)}" loading="lazy" />
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;">
          <span class="badge">${esc(a.rate)}</span>
          <span class="badge badge-emerald">COI Available</span>
        </div>
        <h3 style="margin:0 0 0.45rem;font-size:1.22rem;">${esc(a.title)}</h3>
        <p style="margin:0;color:var(--text-muted);font-size:0.92rem;flex-grow:1;">${esc(a.desc)}</p>
        <ul class="spec-list">
          ${a.specs.map((s) => `<li>${esc(s)}</li>`).join("")}
        </ul>
        <div style="display:flex;gap:0.65rem;flex-wrap:wrap;">
          <a href="/hire/?costume=${encodeURIComponent(a.title)}#quote-form" class="btn btn-dark btn-sm" style="flex:1;">Request This Act →</a>
          <a href="/join/" class="btn btn-outline-dark btn-sm">Perform This? List Free</a>
        </div>
      </article>`
        )
        .join("")}
    </div>
  </div>`;
}

// ============================================================================
// 1. BUILD HOMEPAGE (/)
// ============================================================================
function buildHomePage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: config.site.brandName,
        url: config.site.url,
        description: config.site.tagline
      },
      {
        "@type": "Person",
        name: config.founder.name,
        jobTitle: config.founder.title,
        url: `${config.site.url}/#about-creator`,
        knowsAbout: ["Stilt Walking", "Drywall Stilts", "Circus Peg Stilts", "Event Entertainment Safety"]
      }
    ]
  };

  const body = `
  <section class="hero">
    <div class="container hero-grid">
      <div>
        <span class="eyebrow">★ America's Dedicated Stilt Authority</span>
        <h1>Book Vetted <span>Stilt Walkers</span> &amp; Master Real Stilt Gear.</h1>
        <p class="hero-lead">
          The first platform built by an actual stilt walker. Filter performers by ceiling clearance, stilt type &amp; $1M COI insurance with <strong>0% booking fees</strong>—or compare field-tested stilts, comfort straps &amp; performer insurance.
        </p>
        <div class="hero-cta-row">
          <a href="/hire/#quote-form" class="btn btn-gold btn-lg">Get Free Event Quotes →</a>
          <a href="/gear/" class="btn btn-outline-light btn-lg">Explore Stilt Gear Lab</a>
        </div>
        <div class="hero-trust">
          <div class="trust-stat">
            <strong>0% Fees</strong>
            <span>Direct quotes vs. GigSalad's 15% take</span>
          </div>
          <div class="trust-stat">
            <strong>${cities.length} Metro Hubs</strong>
            <span>Ceiling &amp; COI-matched acts</span>
          </div>
          <div class="trust-stat">
            <strong>Practitioner-Led</strong>
            <span>Real stilt experience &amp; specs</span>
          </div>
        </div>
      </div>
      <div class="hero-media">
        <div class="hero-img-frame">
          <img src="/images/hero-stiltwalker.jpg" alt="Illuminated gold LED stilt walker towering above an evening corporate gala" />
        </div>
        <div class="hero-floating-badge">
          <div>
            <strong>Planning an Indoor Ballroom or Hora Loca?</strong>
            <span style="color:var(--text-light-muted);">Check safe ceiling height + US hourly rates in 15 seconds.</span>
          </div>
          <a href="#instant-calculator" class="btn btn-gold btn-sm">Try Calculator</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-header">
        <span class="eyebrow eyebrow-light">Smarter Event Booking</span>
        <h2>Filter Stilt Acts by Specs Generalist Gig Sites Ignore</h2>
        <p>Don't book a 9.5-foot winged stilt walker for an 8.5-foot ceiling tent. Match the right stilt geometry, visual look, and COI coverage to your venue.</p>
      </div>
      ${renderActFilterShowcase()}
    </div>
  </section>

  <section class="section section-subtle" id="instant-calculator">
    <div class="container">
      ${renderCalculatorWidget()}
    </div>
  </section>

  ${renderFounderSection()}

  <section class="section section-white">
    <div class="container">
      <div class="section-header">
        <span class="eyebrow eyebrow-light">Practitioner Gear &amp; Business Lab</span>
        <h2>Tested Equipment, Straps, Costumes &amp; Performer Insurance</h2>
        <p>Whether you're hanging drywall all week, working an October haunted attraction, or commanding $950 corporate galas, avoid cheap gear mistakes.</p>
      </div>
      <div class="grid-3">
        ${gearGuides
          .map(
            (g) => `
        <a href="/gear/${g.slug}/" class="card">
          <div class="card-media">
            <img src="${g.heroImage}" alt="${esc(g.shortTitle)}" loading="lazy" />
          </div>
          <span class="badge" style="margin-bottom:0.55rem;">${esc(g.category)} • ${esc(g.readTime)}</span>
          <h3 style="margin:0 0 0.5rem;font-size:1.15rem;">${esc(g.shortTitle)}</h3>
          <p style="margin:0 0 1rem;color:var(--text-muted);font-size:0.9rem;flex-grow:1;">${esc(g.summary)}</p>
          <span style="font-weight:700;color:var(--gold-deep);font-size:0.9rem;">Read Buyer Guide →</span>
        </a>`
          )
          .join("")}
        <a href="/insurance/" class="card" style="background:linear-gradient(160deg,#0f172a,#1b2848);color:var(--text-light);border-color:rgba(246,196,83,0.35);">
          <span class="badge badge-dark" style="margin-bottom:0.75rem;">Required by 90% of Corporate Venues</span>
          <h3 style="margin:0 0 0.6rem;font-size:1.25rem;color:var(--gold-bright);">Stilt Walker $1M/$2M Liability Insurance Guide</h3>
          <p style="margin:0 0 1.25rem;color:var(--text-light-muted);font-size:0.92rem;flex-grow:1;">
            Standard policies exclude elevated acts. Compare instant $45 single-event COIs (Thimble) vs. $199/yr annual performer policies (Insurance Canopy).
          </p>
          <span class="btn btn-gold btn-sm" style="width:fit-content;">Compare COI Policies →</span>
        </a>
        <a href="/contract-rider/" class="card">
          <span class="badge badge-emerald" style="margin-bottom:0.75rem;">Free Tool + Pro Legal Pack</span>
          <h3 style="margin:0 0 0.6rem;font-size:1.22rem;">Stilt Safety Contract Rider &amp; Haunt Fall SOP</h3>
          <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.92rem;flex-grow:1;">
            Generate a custom venue clearance, wind-cutoff &amp; mounting-chair rider in seconds—or grab our full $24 Contract Pack &amp; Haunt Stilt Training Manual.
          </p>
          <span style="font-weight:700;color:var(--gold-deep);font-size:0.9rem;">Open Rider Builder →</span>
        </a>
      </div>
    </div>
  </section>

  <section class="section section-subtle" id="cities">
    <div class="container">
      <div class="section-header">
        <span class="eyebrow eyebrow-light">Local Availability &amp; Rates</span>
        <h2>Hire Stilt Walkers Across ${cities.length} Major US Event Markets</h2>
        <p>Explore local 2-hour booking averages, convention ceiling notes, and peak seasonal booking windows by city.</p>
      </div>
      <div class="city-pills">
        ${cities
          .map(
            (c) => `
        <a href="/hire/${c.slug}/" class="city-pill">
          <span>${esc(c.city)}, ${c.state}</span>
          <small>${esc(c.avgTwoHourRate)}</small>
        </a>`
          )
          .join("")}
      </div>
    </div>
  </section>`;

  writePage(
    "/",
    renderLayout({
      title: "StiltWalker.net — Hire Vetted Stilt Walkers (0% Fees) & Tested Stilt Gear Guides",
      description:
        "Book insured stilt walkers filtered by venue ceiling height, Hora Loca, LED & Mirror Man specs—or read real stilt-walker reviews of drywall stilts, peg stilts, comfort straps & COI insurance.",
      route: "/",
      activeNav: "",
      schemaJson: schema,
      bodyHtml: body
    })
  );
}

// ============================================================================
// 2. BUILD NATIONAL HIRE HUB (/hire/) + 25 CITY PAGES (/hire/[slug]/)
// ============================================================================
function buildHirePages() {
  const hubBody = `
  <section class="hero" style="padding:3rem 0 3.5rem;">
    <div class="container">
      <span class="eyebrow">0% Platform Markup • Direct Performer Quotes</span>
      <h1 style="max-width:22ch;">Hire Professional <span>Stilt Walkers</span> Anywhere in the US</h1>
      <p class="hero-lead">
        From corporate convention booth magnets and Miami Hora Loca wedding dancers to October haunt monsters—filter by ceiling clearance and get fast, direct quotes.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid-2" style="align-items:start;gap:2.25rem;">
        <div>
          ${renderQuoteForm("")}
        </div>
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <span class="badge" style="margin-bottom:0.6rem;">2026 US Rate Benchmarks</span>
            <h3 style="margin:0 0 0.75rem;">How Much Does a Stilt Walker Cost?</h3>
            <ul class="calc-breakdown" style="color:var(--text-dark);margin-bottom:0.5rem;">
              <li style="border-color:var(--border-light);"><span>Private Party / Roaming (2 hrs)</span> <strong>$300 – $550</strong></li>
              <li style="border-color:var(--border-light);"><span>Wedding Hora Loca (45–60 min LED)</span> <strong>$300 – $500</strong></li>
              <li style="border-color:var(--border-light);"><span>Corporate Gala / Mirror Man (2 hrs)</span> <strong>$600 – $1,200+</strong></li>
              <li style="border-color:var(--border-light);"><span>Full-Day Festival / Parade</span> <strong>$650 – $1,500</strong></li>
            </ul>
            <p style="margin:0.75rem 0 0;font-size:0.86rem;color:var(--text-muted);">
              <strong>Pro Planning Note:</strong> Stilt walkers typically perform 30-to-45-minute sets separated by 15-minute off-stilt rest breaks, and need a private staging room with a sturdy armless chair.
            </p>
          </div>

          <div class="card" style="background:#0f172a;color:var(--text-light);">
            <span class="badge badge-dark" style="margin-bottom:0.6rem;">Are You a Stilt Performer?</span>
            <h3 style="margin:0 0 0.5rem;color:var(--gold-bright);">Claim City #1 Placement Before Competitors</h3>
            <p style="margin:0 0 1rem;color:var(--text-light-muted);font-size:0.92rem;">
              Stop paying GigSalad $479/yr + 15% combined fees. List free forever on StiltWalker.net, or lock in Featured Pro ($19/mo) for priority city-page leads.
            </p>
            <a href="/join/" class="btn btn-gold btn-sm">Create Performer Listing →</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-subtle" id="all-cities">
    <div class="container">
      <div class="section-header">
        <h2>Browse Local Stilt Walker Rates &amp; Venue Guides by City</h2>
      </div>
      <div class="city-pills">
        ${cities
          .map(
            (c) => `
        <a href="/hire/${c.slug}/" class="city-pill">
          <span>${esc(c.city)}, ${c.state}</span>
          <small>${esc(c.avgTwoHourRate)}</small>
        </a>`
          )
          .join("")}
      </div>
    </div>
  </section>`;

  writePage(
    "/hire/",
    renderLayout({
      title: "Hire a Stilt Walker — 2026 Prices, Venue Clearance & Free Event Quotes | StiltWalker.net",
      description:
        "Get free direct quotes from insured stilt walkers for corporate events, Hora Loca weddings, festivals, parades, and Halloween parties across 25+ US cities.",
      route: "/hire/",
      activeNav: "hire",
      schemaJson: null,
      bodyHtml: hubBody
    })
  );

  // Programmatic Local SEO City Pages
  for (const c of cities) {
    const cityFull = `${c.city}, ${c.state}`;
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `How much does it cost to hire a stilt walker in ${cityFull}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `In ${cityFull}, hiring a professional stilt walker typically costs ${c.avgTwoHourRate} for a standard 2-hour booking (structured as two or three 40-minute sets with safety breaks). Corporate activations requiring custom branding, Mirror Man suits, or $2M COIs sit toward the upper end of the range.`
          }
        },
        {
          "@type": "Question",
          name: `What venue requirements do stilt walkers in ${c.city} need?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${c.localVenueNote} Always provide a secure ground-level green room with a sturdy armless mounting chair.`
          }
        }
      ]
    };

    const nearby = cities.filter((x) => x.slug !== c.slug).slice(0, 6);

    const cityBody = `
    <section class="hero" style="padding:3rem 0 3.5rem;">
      <div class="container">
        <span class="eyebrow">${esc(c.region)} Event Entertainment Hub</span>
        <h1 style="max-width:22ch;">Hire Vetted <span>Stilt Walkers in ${esc(cityFull)}</span></h1>
        <p class="hero-lead">
          Typical ${esc(c.city)} 2-hour booking rate: <strong style="color:var(--gold-bright);">${esc(
      c.avgTwoHourRate
    )}</strong> • Peak season: ${esc(c.peakSeason)}. Connect directly with 0% planner fees.
        </p>
        <div class="hero-cta-row" style="margin-bottom:0;">
          <a href="#quote-form" class="btn btn-gold">Get ${esc(c.city)} Quotes →</a>
          <a href="/join/?city=${encodeURIComponent(cityFull)}" class="btn btn-outline-light">Perform in ${esc(
      c.city
    )}? Claim #1 Spot</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid-2" style="align-items:start;gap:2.25rem;">
          <div>
            <div class="card" style="margin-bottom:1.5rem;">
              <span class="badge" style="margin-bottom:0.6rem;">Local Venue &amp; Clearance Intelligence</span>
              <h2 style="margin:0 0 0.75rem;font-size:1.45rem;">Booking a Stilt Walker in ${esc(c.city)}: What Planners Should Know</h2>
              <p style="margin:0 0 1rem;color:var(--text-muted);">${esc(c.localVenueNote)}</p>
              <h4 style="margin:0 0 0.5rem;font-size:0.9rem;text-transform:uppercase;">Most Requested ${esc(
                c.city
              )} Event Formats</h4>
              <ul class="spec-list" style="margin-top:0.4rem;">
                ${c.topEventTypes.map((t) => `<li>${esc(t)}</li>`).join("")}
              </ul>
              <h4 style="margin:0.5rem 0 0.5rem;font-size:0.9rem;text-transform:uppercase;">Trending ${esc(
                c.city
              )} Wardrobe Looks</h4>
              <ul class="spec-list" style="margin-top:0.4rem;margin-bottom:0;">
                ${c.popularThemes.map((t) => `<li>${esc(t)}</li>`).join("")}
              </ul>
            </div>

            ${(() => {
              const matchedRoster = seedPerformers.filter((p) => p.cities.includes(c.slug));
              const rosterToRender = matchedRoster.length ? matchedRoster : seedPerformers.slice(0, 2);
              return `
            <div class="card" style="margin-bottom:1.5rem;">
              <span class="badge badge-emerald" style="margin-bottom:0.6rem;">${esc(c.city)} Regional Roster &amp; Concierge Dispatch</span>
              <h3 style="margin:0 0 0.5rem;font-size:1.25rem;">Regional Stilt Acts &amp; 24-Hr Performer Concierge</h3>
              <p style="margin:0 0 1rem;font-size:0.9rem;color:var(--text-muted);">
                When you request a quote in ${esc(c.city)}, we match you with verified regional stilt performers AND our Performer Concierge reaches out directly to local ${esc(c.city)} stilt walkers &amp; circus troupes with your venue specs (0% agency markup):
              </p>
              <div style="display:grid;gap:0.75rem;">
                ${rosterToRender
                  .map(
                    (act) => `
                <div style="padding:0.85rem;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-subtle);">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem;">
                    <strong style="font-size:0.96rem;">${esc(act.name)}</strong>
                    <span class="badge" style="font-size:0.72rem;">${esc(act.rateRange)}</span>
                  </div>
                  <div style="font-size:0.83rem;color:var(--text-muted);margin-bottom:0.35rem;">
                    <strong>Apparatus:</strong> ${esc(act.apparatus)} • <strong>Min Ceiling:</strong> ${act.minCeilingFt} ft
                  </div>
                  <div style="font-size:0.82rem;color:var(--text-dark);">
                    <strong>Specialties:</strong> ${act.specialties.map((s) => esc(s)).join(" • ")}
                  </div>
                </div>`
                  )
                  .join("")}
              </div>
            </div>`;
            })()}

            <div class="card" style="background:#fffbeb;border-color:var(--gold);">
              <span class="badge" style="margin-bottom:0.5rem;">Open Founding Featured Slot — ${esc(cityFull)}</span>
              <h3 style="margin:0 0 0.45rem;font-size:1.2rem;">Are You an Insured Stilt Walker Near ${esc(c.city)}?</h3>
              <p style="margin:0 0 1rem;font-size:0.9rem;color:var(--text-muted);">
                We are onboarding verified ${esc(
                  c.city
                )} performers right now. List your act for $0 (0% commission), or lock in Featured Pro ($19/mo) to pin your photo &amp; direct quote button to the top of this ${esc(
      c.city
    )} page.
              </p>
              <a href="/join/?city=${encodeURIComponent(cityFull)}" class="btn btn-dark btn-sm" style="width:fit-content;">Claim ${esc(
      c.city
    )} Performer Listing →</a>
            </div>
          </div>

          <div>
            ${renderQuoteForm(cityFull)}
          </div>
        </div>
      </div>
    </section>

    <section class="section section-subtle">
      <div class="container">
        <h3 style="margin:0 0 1rem;">Check Ceiling Height &amp; Set Schedule Before Booking</h3>
        ${renderCalculatorWidget()}
        <div style="margin-top:2.5rem;">
          <h4 style="margin:0 0 0.85rem;">Explore Additional US Markets</h4>
          <div class="city-pills">
            ${nearby
              .map(
                (n) => `<a href="/hire/${n.slug}/" class="city-pill"><span>${esc(n.city)}, ${n.state}</span><small>${esc(
                  n.avgTwoHourRate
                )}</small></a>`
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>`;

    writePage(
      `/hire/${c.slug}/`,
      renderLayout({
        title: `Hire a Stilt Walker in ${cityFull} — ${c.avgTwoHourRate} Direct Quotes | StiltWalker.net`,
        description: `Book vetted, COI-insured stilt walkers in ${cityFull} (${c.avgTwoHourRate}). Local ceiling clearance tips for ${c.topEventTypes[0]} & 0%-fee direct event quotes.`,
        route: `/hire/${c.slug}/`,
        activeNav: "hire",
        schemaJson: faqSchema,
        bodyHtml: cityBody
      })
    );
  }
}

// ============================================================================
// 3. BUILD GEAR HUB (/gear/) + 4 BUYER GUIDES (/gear/[slug]/)
// ============================================================================
function buildGearPages() {
  const hubBody = `
  <section class="hero" style="padding:3rem 0 3.5rem;">
    <div class="container">
      <span class="eyebrow">Practitioner-Tested Equipment Reviews</span>
      <h1 style="max-width:22ch;">The <span>Stilt Gear &amp; Costume</span> Field Lab</h1>
      <p class="hero-lead">
        Honest specs and upgrade guides written from real time on stilts—bridging pro drywall hangers, haunted house stunt actors, and $1,000-a-night corporate performers.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid-2">
        ${gearGuides
          .map(
            (g) => `
        <a href="/gear/${g.slug}/" class="card">
          <div class="card-media">
            <img src="${g.heroImage}" alt="${esc(g.title)}" loading="lazy" />
          </div>
          <span class="badge" style="margin-bottom:0.55rem;">${esc(g.category)} • ${esc(g.readTime)}</span>
          <h2 style="margin:0 0 0.55rem;font-size:1.35rem;">${esc(g.title)}</h2>
          <p style="margin:0 0 1.1rem;color:var(--text-muted);font-size:0.94rem;flex-grow:1;">${esc(g.summary)}</p>
          <span class="btn btn-dark btn-sm" style="width:fit-content;">Read Full Comparison →</span>
        </a>`
          )
          .join("")}
      </div>
    </div>
  </section>

  ${renderFounderSection()}`;

  writePage(
    "/gear/",
    renderLayout({
      title: "Stilt Gear Reviews (2026): Drywall Stilts, Peg Stilts, Straps & LED Costumes | StiltWalker.net",
      description:
        "Practitioner buyer guides for SurPro & Dura-Stilts drywall stilts, 4-inch padded comfort straps, jumping bocking stilts, Mirror Man suits, and LED wings.",
      route: "/gear/",
      activeNav: "gear",
      schemaJson: null,
      bodyHtml: hubBody
    })
  );

  for (const g of gearGuides) {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.summary,
      author: {
        "@type": "Person",
        name: config.founder.name,
        url: `${config.site.url}/#about-creator`
      },
      publisher: {
        "@type": "Organization",
        name: config.site.brandName
      }
    };

    const guideBody = `
    <section class="hero" style="padding:2.75rem 0 3rem;">
      <div class="container">
        <span class="eyebrow">${esc(g.category)} • ${esc(g.readTime)}</span>
        <h1 style="max-width:26ch;font-size:clamp(1.85rem,3.5vw,2.75rem);">${esc(g.title)}</h1>
        <p class="hero-lead">${esc(g.summary)}</p>
        <p style="margin:0;font-size:0.86rem;color:var(--text-light-muted);">
          By <strong>${esc(config.founder.name)}</strong> (${esc(
      config.founder.title
    )}) • Affiliate disclosure: Links below may earn a small commission at zero extra cost to you.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container" style="max-width:940px;">
        <div class="card" style="background:#10172c;color:var(--text-light);border-color:rgba(246,196,83,0.4);margin-bottom:2rem;">
          <span class="badge badge-dark" style="margin-bottom:0.5rem;">Real Stilt-Walker Field Take — ${esc(
            config.founder.name
          )}</span>
          <p style="margin:0;font-size:1.02rem;color:#eef2ff;">"${esc(g.founderTake)}"</p>
        </div>

        <div class="table-wrap" style="margin-bottom:2.25rem;">
          <table class="comp-table">
            <thead>
              <tr>
                <th>Pick</th>
                <th>Model / Gear</th>
                <th>Best For</th>
                <th>Typical Price</th>
                <th>Check Price</th>
              </tr>
            </thead>
            <tbody>
              ${g.products
                .map((p, idx) => {
                  const primaryLink = p.directPartner
                    ? config.affiliates[p.directPartner] || amazonUrl(p.searchQuery)
                    : amazonUrl(p.searchQuery);
                  return `
              <tr class="${idx === 0 ? "comp-highlight" : ""}">
                <td><span class="badge">${esc(p.badge)}</span></td>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.bestFor)}</td>
                <td><strong>${esc(p.priceRange)}</strong></td>
                <td><a href="${esc(primaryLink)}" target="_blank" rel="noopener sponsored" class="btn btn-gold btn-sm">Check Price →</a></td>
              </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        ${g.products
          .map((p) => {
            const amz = amazonUrl(p.searchQuery);
            const partner = p.directPartner ? config.affiliates[p.directPartner] : null;
            return `
        <article class="product-card">
          <div class="product-header">
            <div>
              <span class="badge" style="margin-bottom:0.4rem;">${esc(p.badge)}</span>
              <h2 style="margin:0;font-size:1.35rem;">${esc(p.name)}</h2>
            </div>
            <div class="product-price">${esc(p.priceRange)}</div>
          </div>
          <p style="margin:0 0 0.65rem;"><strong>Best For:</strong> ${esc(p.bestFor)}</p>
          <p style="margin:0;color:var(--text-muted);font-size:0.94rem;"><strong>Key Specs:</strong> ${esc(p.specs)}</p>
          <div class="pros-cons">
            <div>
              <h4 style="color:#059669;">What Stands Out</h4>
              <ul>${p.pros.map((pr) => `<li>${esc(pr)}</li>`).join("")}</ul>
            </div>
            <div>
              <h4 style="color:#b45309;">Watch Out For</h4>
              <ul>${p.cons.map((co) => `<li>${esc(co)}</li>`).join("")}</ul>
            </div>
          </div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <a href="${esc(amz)}" target="_blank" rel="noopener sponsored" class="btn btn-gold">Check Amazon Availability →</a>
            ${
              partner
                ? `<a href="${esc(partner)}" target="_blank" rel="noopener sponsored" class="btn btn-dark">Browse Specialty Maker Options →</a>`
                : ""
            }
          </div>
        </article>`;
          })
          .join("")}

        <div class="card" style="background:var(--bg-subtle);margin-top:2.5rem;">
          <h3 style="margin:0 0 0.5rem;">Using These Stilts for Paid Events?</h3>
          <p style="margin:0 0 1rem;color:var(--text-muted);">
            Make sure you carry a $1M/$2M entertainer COI (starting at $45/event) and list your act for free on our 0%-commission national directory.
          </p>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <a href="/insurance/" class="btn btn-dark btn-sm">Compare Stilt Liability Insurance →</a>
            <a href="/join/" class="btn btn-outline-dark btn-sm">List Your Act Free on StiltWalker.net</a>
          </div>
        </div>
      </div>
    </section>`;

    writePage(
      `/gear/${g.slug}/`,
      renderLayout({
        title: `${g.title} | StiltWalker.net`,
        description: g.summary,
        route: `/gear/${g.slug}/`,
        activeNav: "gear",
        schemaJson: articleSchema,
        bodyHtml: guideBody
      })
    );
  }
}

// ============================================================================
// 4. BUILD HIGH-EPC PERFORMER INSURANCE GUIDE (/insurance/)
// ============================================================================
function buildInsurancePage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does standard general liability insurance cover stilt walkers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Usually no. Standard small-business general liability policies routinely exclude elevated, acrobatic, circus, or aerial acts. Always select an entertainer-specific policy such as Thimble, Insurance Canopy, or Specialty Insurance Agency that explicitly covers stilt walking."
        }
      },
      {
        "@type": "Question",
        name: "How much does stilt walker liability insurance cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Single-event $1M/$2M Certificates of Insurance (COIs) start around $45–$60 per gig (or ~$17+/month on-demand via Thimble), while full annual performer liability policies start at $199/year via Insurance Canopy or $180–$350/year via Specialty Insurance Agency."
        }
      }
    ]
  };

  const body = `
  <section class="hero" style="padding:3rem 0 3.5rem;">
    <div class="container">
      <span class="eyebrow">Unlock $600–$1,200+ Corporate &amp; Municipal Bookings</span>
      <h1 style="max-width:24ch;">Stilt Walker &amp; Circus Performer <span>Liability Insurance</span> (2026 Comparison)</h1>
      <p class="hero-lead">
        Corporate hotels, convention centers, and city parades require a $1M/$2M Certificate of Insurance (COI) naming the venue Additional Insured. Here is the fastest, cheapest way to get covered without getting burned by height exclusions.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container" style="max-width:1020px;">
      <div class="table-wrap" style="margin-bottom:2.25rem;">
        <table class="comp-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Best For</th>
              <th>Pricing</th>
              <th>Additional Insured COI</th>
              <th>Get Quote</th>
            </tr>
          </thead>
          <tbody>
            <tr class="comp-highlight">
              <td><strong>Thimble</strong><br/><span class="badge">Fastest 5-Min COI</span></td>
              <td>Part-time stilt walkers needing instant single-gig or monthly coverage</td>
              <td><strong>~$45–$60/gig</strong> or <strong>$17+/mo</strong></td>
              <td>Instant unlimited free COIs via app</td>
              <td><a href="${esc(config.affiliates.thimbleInsuranceUrl)}" target="_blank" rel="noopener sponsored" class="btn btn-gold btn-sm">Get Instant Quote →</a></td>
            </tr>
            <tr>
              <td><strong>Insurance Canopy</strong><br/><span class="badge badge-emerald">Best Annual Value</span></td>
              <td>Active entertainers doing 4+ paid events per year ($2M aggregate)</td>
              <td><strong>$199/year</strong> (~$18.50/mo)</td>
              <td>Online portal Additional Insured</td>
              <td><a href="${esc(config.affiliates.insuranceCanopyUrl)}" target="_blank" rel="noopener sponsored" class="btn btn-dark btn-sm">View $199/yr Plan →</a></td>
            </tr>
            <tr>
              <td><strong>Next Insurance</strong></td>
              <td>Drywall stilt contractors &amp; self-employed event businesses</td>
              <td><strong>~$25 – $45/mo</strong></td>
              <td>24/7 digital live COI sharing</td>
              <td><a href="${esc(config.affiliates.nextInsuranceUrl)}" target="_blank" rel="noopener sponsored" class="btn btn-outline-dark btn-sm">Check Rates →</a></td>
            </tr>
            <tr>
              <td><strong>Specialty Insurance Agency (SIA)</strong></td>
              <td>Multi-apparatus troupes (stilts + fire + aerial)</td>
              <td><strong>$180 – $350+/yr</strong></td>
              <td>Underwritten troupe certificates</td>
              <td><span style="font-size:0.85rem;color:var(--text-muted);">Manual broker application</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin:0 0 0.6rem;">3 Clauses Every Stilt Walker Must Check</h3>
          <ol style="margin:0;padding-left:1.2rem;color:var(--text-muted);display:grid;gap:0.6rem;">
            <li><strong>Height Exclusions:</strong> Verify your policy covers elevated stilt work (most entertainer policies cover stilts under 10–15 ft, while excluding un-rigged >30 ft aerials).</li>
            <li><strong>Fire &amp; Pyrotechnics Add-On:</strong> Standard performer GL excludes open flame—if you spin fire on stilts, add an explicit fire endorsement.</li>
            <li><strong>Pass-Through COI Fee:</strong> On corporate gigs, add a standard $35–$50 "Venue Additional Insured Administration" line item—your client pays for your policy!</li>
          </ol>
        </div>
        <div class="card" style="background:#0f172a;color:var(--text-light);">
          <span class="badge badge-dark" style="margin-bottom:0.65rem;">Double Your Corporate Inquiries</span>
          <h3 style="margin:0 0 0.55rem;color:var(--gold-bright);">Unlock Your "Verified Insured" Directory Badge</h3>
          <p style="margin:0 0 1.2rem;color:var(--text-light-muted);font-size:0.93rem;">
            Corporate planners on StiltWalker.net filter specifically for COI-ready performers. Once covered, claim your free profile and toggle your Verified COI badge ON.
          </p>
          <a href="/join/" class="btn btn-gold btn-sm" style="width:fit-content;">Claim Verified Performer Profile →</a>
        </div>
      </div>
    </div>
  </section>`;

  writePage(
    "/insurance/",
    renderLayout({
      title: "Stilt Walker Insurance (2026): Instant $45 Event COIs vs $199/yr Policies | StiltWalker.net",
      description:
        "Compare general liability insurance for stilt walkers & circus entertainers: Thimble on-demand event COIs vs. Insurance Canopy, Next Insurance & SIA.",
      route: "/insurance/",
      activeNav: "insurance",
      schemaJson: schema,
      bodyHtml: body
    })
  );
}

// ============================================================================
// 5. BUILD CALCULATOR PAGE (/calculator/)
// ============================================================================
function buildCalculatorPage() {
  const body = `
  <section class="hero" style="padding:2.75rem 0 3rem;">
    <div class="container">
      <span class="eyebrow">Free Event Planner &amp; Performer Tool</span>
      <h1 style="max-width:24ch;">Stilt Walker <span>Cost, Set-Break &amp; Ceiling</span> Calculator</h1>
      <p class="hero-lead">
        Stop guessing whether 30-inch stilts clear a 9-foot banquet chandelier—or what a fair 2026 corporate vs. Hora Loca rate looks like.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      ${renderCalculatorWidget()}
    </div>
  </section>`;

  writePage(
    "/calculator/",
    renderLayout({
      title: "Stilt Walker Cost & Venue Ceiling Clearance Calculator (2026) | StiltWalker.net",
      description:
        "Calculate 2026 stilt walker hourly rates, mandatory 40/15 set-break schedules, and minimum safe indoor ceiling height in seconds.",
      route: "/calculator/",
      activeNav: "calculator",
      schemaJson: null,
      bodyHtml: body
    })
  );
}

// ============================================================================
// 6. BUILD CONTRACT RIDER + DIGITAL PRODUCTS PAGE (/contract-rider/)
// ============================================================================
function buildContractRiderPage() {
  const proPackHref = config.products.contractRiderPack.stripePaymentLink || "#unlock-waitlist";
  const hauntHref = config.products.hauntSafetySop.stripePaymentLink || "#unlock-waitlist";

  const body = `
  <section class="hero" style="padding:3rem 0 3.5rem;">
    <div class="container">
      <span class="eyebrow">Protect Your Knees, Gear &amp; Gig Pay</span>
      <h1 style="max-width:25ch;">Stilt Walker <span>Safety Contract Rider</span> &amp; Haunt Fall SOPs</h1>
      <p class="hero-lead">
        Generic DJ contracts don't protect you when a client puts you on wet gravel in 22 mph winds with zero mounting chair. Customize a free basic safety rider below, or download our complete legal &amp; haunt training packs.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid-2" style="align-items:start;gap:2rem;" data-rider-builder>
        <div class="card">
          <span class="badge badge-emerald" style="margin-bottom:0.6rem;">Free Interactive Generator</span>
          <h2 style="margin:0 0 0.5rem;font-size:1.4rem;">Customize Your Basic Venue Safety Rider</h2>
          <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.92rem;">
            Fill in your specs and paste directly into your booking email or invoice attachment.
          </p>
          <div style="display:grid;gap:0.9rem;">
            <div class="field-group">
              <label>Performer or Troupe Name</label>
              <input type="text" name="riderName" placeholder="e.g., SkyHigh Circus Entertainment" />
            </div>
            <div class="field-group">
              <label>Minimum Unobstructed Overhead Clearance</label>
              <select name="riderClearance">
                <option value="9.0 feet">9.0 feet (18"–24" stilts, compact headwear)</option>
                <option value="10.5 feet" selected>10.5 feet (24"–30" stilts, standard headwear)</option>
                <option value="12.0 feet">12.0 feet (36"+ stilts or winged build)</option>
              </select>
            </div>
            <div class="field-group">
              <label>Outdoor Wind-Gust Safety Cutoff</label>
              <select name="riderWind">
                <option value="14 mph (Winged / Giant Costume)">14 mph (Winged / High-Sail Costume)</option>
                <option value="18 mph" selected>18 mph (Standard Roaming Costume)</option>
                <option value="22 mph">22 mph (Streamlined Peg/Bocking Act)</option>
              </select>
            </div>
            <div class="field-group">
              <label>Set / Mandatory Off-Stilt Break Ratio</label>
              <select name="riderSet">
                <option value="30 minutes on stilts / 15 minutes rest">30 min on / 15 min rest (High Heat / Heavy Rig)</option>
                <option value="40 minutes on stilts / 15 minutes mandatory rest" selected>40 min on / 15 min rest (Industry Standard)</option>
                <option value="45 minutes on stilts / 15 minutes mandatory rest">45 min on / 15 min rest (Indoor Ballroom)</option>
              </select>
            </div>
            <button type="button" class="btn btn-gold" data-copy-rider>Copy Customized Safety Rider</button>
          </div>
        </div>

        <div>
          <pre class="rider-preview" data-rider-output></pre>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-subtle" id="buy-pack">
    <div class="container">
      <div class="section-header">
        <span class="eyebrow eyebrow-light">Pro Toolkits &amp; B2B Training Manuals</span>
        <h2>Upgrade to Full Contracts, Waivers &amp; Haunted House SOPs</h2>
      </div>

      <div class="grid-2" id="haunt-sop">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
            <span class="badge">Performer Business Toolkit</span>
            <strong style="font-size:1.4rem;color:var(--gold-deep);">$${config.products.contractRiderPack.price}</strong>
          </div>
          <h3 style="margin:0 0 0.55rem;font-size:1.3rem;">${esc(config.products.contractRiderPack.name)}</h3>
          <p style="color:var(--text-muted);font-size:0.93rem;margin:0 0 1rem;">
            Everything an independent stilt walker or variety troupe needs to book corporate events with airtight protection:
          </p>
          <ul style="margin:0 0 1.4rem;padding-left:1.2rem;font-size:0.9rem;display:grid;gap:0.45rem;flex-grow:1;">
            <li>Full Performance Services Agreement (50% non-refundable retainer + weather force majeure)</li>
            <li>"Intoxicated Guest Physical Interference" walk-off-with-full-pay protection clause</li>
            <li>Client Additional-Insured COI pass-through invoice template</li>
            <li>Pre-gig 14-point bolt, spring, sole &amp; cuff-hem safety inspection sheet</li>
          </ul>
          <a href="${esc(proPackHref)}" class="btn btn-dark">Get the $${config.products.contractRiderPack.price} Pro Contract Pack →</a>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
            <span class="badge badge-emerald">For Scare Actors &amp; Haunt Owners</span>
            <strong style="font-size:1.4rem;color:var(--gold-deep);">$${config.products.hauntSafetySop.priceActor} / $${config.products.hauntSafetySop.priceVenue}</strong>
          </div>
          <h3 style="margin:0 0 0.55rem;font-size:1.3rem;">${esc(config.products.hauntSafetySop.name)}</h3>
          <p style="color:var(--text-muted);font-size:0.93rem;margin:0 0 1rem;">
            Fog machines, strobe lights, low haunt doorways, and startled guests make commercial haunts the toughest stilt environment in entertainment:
          </p>
          <ul style="margin:0 0 1.4rem;padding-left:1.2rem;font-size:0.9rem;display:grid;gap:0.45rem;flex-grow:1;">
            <li>Step-by-step Controlled Knee-Tuck Fall Progression (avoiding stiff-leg 'timber' wrist fractures)</li>
            <li>Fog-condensation floor traction &amp; strobe blind-spot positioning rules</li>
            <li>Nightly Haunt Manager Pre-Shift Hardware Sign-Off Log (insurance audit ready)</li>
            <li>$${config.products.hauntSafetySop.priceActor} Single Actor Guide or $${config.products.hauntSafetySop.priceVenue} Full Haunt Venue Staff License</li>
          </ul>
          <a href="${esc(hauntHref)}" class="btn btn-gold">Get the Haunt Stilt Safety SOP →</a>
        </div>
      </div>

      <div class="form-card" style="margin-top:2rem;max-width:680px;margin-left:auto;margin-right:auto;" id="unlock-waitlist">
        <h3 style="margin:0 0 0.4rem;">Download Free 1-Page Pre-Gig Bolt &amp; Venue Checklist + Instant Pack Access</h3>
        <p style="margin:0 0 1rem;color:var(--text-muted);font-size:0.92rem;">
          Enter your email to get our printable 1-page pre-show safety check sheet and direct download link for the Pro Contract Pack &amp; Haunt SOP.
        </p>
        <form data-async-form="rider_magnet">
          <input type="hidden" name="formType" value="rider_magnet" />
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <input type="email" name="email" required placeholder="you@performer.com" style="flex:1;min-width:220px;padding:0.75rem 0.9rem;border:1px solid #cfc8ba;border-radius:9px;font-size:0.95rem;" />
            <select name="interest" style="padding:0.75rem;border:1px solid #cfc8ba;border-radius:9px;font-size:0.92rem;">
              <option value="Free Checklist + $24 Contract Pack">Free Checklist + $24 Contract Pack</option>
              <option value="Haunt Safety SOP ($29/$99)">Haunt Safety SOP ($29 / $99 Venue)</option>
            </select>
            <button type="submit" class="btn btn-gold">Send Me Access →</button>
          </div>
          <div class="form-status" data-form-status></div>
        </form>
      </div>
    </div>
  </section>`;

  writePage(
    "/contract-rider/",
    renderLayout({
      title: "Stilt Walker Contract Rider Template & Haunted House Safety SOP | StiltWalker.net",
      description:
        "Generate a free stilt walking safety & ceiling clearance contract rider, or get our Pro Stilt Performer Agreement Pack and Haunted Attraction Fall-Protocol SOP.",
      route: "/contract-rider/",
      activeNav: "rider",
      schemaJson: null,
      bodyHtml: body
    })
  );
}

// ============================================================================
// 7. BUILD PERFORMER JOIN + PRO PRICING + BACKLINK BADGE (/join/)
// ============================================================================
function buildJoinPage() {
  const body = `
  <section class="hero" style="padding:3rem 0 3.5rem;">
    <div class="container">
      <span class="eyebrow">Built by a Fellow Stilt Walker • 0% Gig Commission</span>
      <h1 style="max-width:24ch;">Stop Giving Gig Platforms <span>15% of Your Sweat</span></h1>
      <p class="hero-lead">
        GigSalad charges up to $479/yr PLUS combined performer &amp; planner booking fees. Bark sells the same lead to 5 competitors at $25 a pop. List your stilt act free on StiltWalker.net and keep 100% of your pay.
      </p>
    </div>
  </section>

  <section class="section" id="pricing">
    <div class="container">
      <div class="grid-2" style="max-width:920px;margin:0 auto 3rem;">
        <div class="card">
          <span class="badge badge-emerald" style="margin-bottom:0.6rem;">Free Forever</span>
          <h2 style="margin:0 0 0.25rem;font-size:1.5rem;">Verified Performer Listing</h2>
          <div style="font-size:2.1rem;font-weight:800;margin:0.4rem 0 1rem;">$0 <small style="font-size:0.95rem;font-weight:500;color:var(--text-muted);">/ forever • 0% booking fee</small></div>
          <ul style="margin:0 0 1.4rem;padding-left:1.2rem;font-size:0.92rem;display:grid;gap:0.5rem;flex-grow:1;">
            <li>Listed in your home metro city page</li>
            <li>Filterable by stilt apparatus (Peg, Drywall, Jumping, Quad) &amp; ceiling clearance</li>
            <li>Verified COI badge eligibility</li>
            <li>Embeddable "Verified on StiltWalker.net" SEO badge</li>
          </ul>
          <a href="#onboarding-form" class="btn btn-outline-dark">Create Free Profile →</a>
        </div>

        <div class="card" style="border:2px solid var(--gold);background:#fffdf7;">
          <span class="badge" style="margin-bottom:0.6rem;">★ Founding Pro Rate (1 Gig = 25x ROI)</span>
          <h2 style="margin:0 0 0.25rem;font-size:1.5rem;">Featured Pro City Pin</h2>
          <div style="font-size:2.1rem;font-weight:800;color:var(--gold-deep);margin:0.4rem 0 1rem;">$19 <small style="font-size:0.95rem;font-weight:500;color:var(--text-muted);">/ mo (or $179/yr) • 0% fee</small></div>
          <ul style="margin:0 0 1.4rem;padding-left:1.2rem;font-size:0.92rem;display:grid;gap:0.5rem;flex-grow:1;">
            <li><strong>Pinned #1 Top Placement</strong> in up to 3 nearby cities</li>
            <li><strong>Instant Direct Quote Routing</strong> (24-hour head start before free tier)</li>
            <li>Direct website, Instagram Reel &amp; phone click-to-call links</li>
            <li>Includes our <strong>$24 Pro Stilt Contract &amp; Safety Rider Pack FREE</strong></li>
          </ul>
          <div style="display:grid;gap:0.55rem;">
            <a href="${esc(config.products.featuredProMonthly.stripePaymentLink || "?plan=pro-monthly#onboarding-form")}" target="_blank" rel="noopener" class="btn btn-gold">Subscribe $19/mo (Instant Checkout) →</a>
            <a href="${esc(config.products.featuredProAnnual.stripePaymentLink || "?plan=pro-annual#onboarding-form")}" target="_blank" rel="noopener" class="btn btn-dark btn-sm">Or Save 21%: $179/yr Annual Plan →</a>
          </div>
        </div>
      </div>

      <div class="grid-2" style="align-items:start;gap:2.25rem;" id="onboarding-form">
        <div class="form-card">
          <h3 style="margin:0 0 0.4rem;font-size:1.45rem;">Submit Your Stilt Performer Profile</h3>
          <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.92rem;">
            Takes 90 seconds. We review every listing to keep fake lead-scrapers out.
          </p>
          <form data-async-form="performer" data-quote-form>
            <input type="hidden" name="formType" value="performer" />
            <div class="grid-2" style="gap:0.95rem;margin-bottom:0.95rem;">
              <div class="field-group">
                <label>Stage or Troupe Name *</label>
                <input type="text" name="stageName" required placeholder="e.g., Elevated Cirque Arts" />
              </div>
              <div class="field-group">
                <label>Contact Email *</label>
                <input type="email" name="email" required placeholder="you@domain.com" />
              </div>
              <div class="field-group">
                <label>Primary Metro City &amp; State *</label>
                <input type="text" name="city" required placeholder="e.g., Chicago, IL" />
              </div>
              <div class="field-group">
                <label>Membership Tier</label>
                <select name="tier">
                  <option value="free">Free Verified Profile ($0)</option>
                  <option value="pro-monthly">Featured Pro — $19/mo (Priority Leads)</option>
                  <option value="pro-annual">Featured Pro — $179/yr (2 Months Free)</option>
                </select>
              </div>
              <div class="field-group">
                <label>Stilt Apparatus Used</label>
                <select name="apparatus">
                  <option value="Articulating / Drywall Stilts">Articulating / Flat-Foot Stilts</option>
                  <option value="Circus Peg Stilts">Circus Peg Stilts</option>
                  <option value="Both Peg & Articulating">Both Peg &amp; Articulating Stilts</option>
                  <option value="Jumping / Bocking + Standard">Jumping / Power Stilts + Standard</option>
                  <option value="Quad / Four-Legged Creature">Quad / Creature Stilts</option>
                </select>
              </div>
              <div class="field-group">
                <label>Carry $1M+ Entertainer Liability COI?</label>
                <select name="insured" data-coi-selector>
                  <option value="yes">Yes — Active $1M/$2M COI</option>
                  <option value="no">Not yet (Show me $17/mo &amp; single-gig options)</option>
                </select>
              </div>
            </div>

            <div class="coi-upsell-banner" data-coi-upsell>
              <strong>Need a COI to unlock $650–$1,200 Corporate Gigs?</strong>
              <p style="margin:0.35rem 0 0.7rem;font-size:0.88rem;">
                Corporate hotels &amp; planners filter for insured acts. You can grab a 1-day event COI (~$45) or monthly policy ($17+/mo) in 5 minutes via Thimble:
              </p>
              <a href="${esc(config.affiliates.thimbleInsuranceUrl)}" target="_blank" rel="noopener sponsored" class="btn btn-dark btn-sm">Check Instant Thimble Entertainer Quote →</a>
            </div>

            <div class="field-group" style="margin:0.95rem 0;">
              <label>Website or Instagram Handle &amp; Typical 2-Hr Rate</label>
              <input type="text" name="portfolio" placeholder="https://instagram.com/... • $500 / 2 hrs" />
            </div>
            <button type="submit" class="btn btn-gold btn-lg" style="width:100%;">Submit Performer Profile →</button>
            <div class="form-status" data-form-status></div>
          </form>
        </div>

        <div id="badge">
          <div class="card" data-badge-generator style="margin-bottom:1.5rem;">
            <span class="badge" style="margin-bottom:0.6rem;">Boost Your Credibility + City Rank</span>
            <h3 style="margin:0 0 0.45rem;font-size:1.3rem;">Grab Your "Verified on StiltWalker.net" Site Badge</h3>
            <p style="margin:0 0 1rem;color:var(--text-muted);font-size:0.9rem;">
              Performers who embed this badge on their personal website footer receive priority verification and fast-track placement on their local city page.
            </p>
            <div class="grid-2" style="gap:0.75rem;margin-bottom:0.85rem;">
              <div class="field-group">
                <label>Your Act Name</label>
                <input type="text" name="badgeName" placeholder="Your Stage Name" />
              </div>
              <div class="field-group">
                <label>Your Closest Hub</label>
                <select name="badgeCity">
                  <option value="">National Directory</option>
                  ${cities.map((c) => `<option value="${c.slug}">${esc(c.city)}, ${c.state}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="field-group" style="margin-bottom:0.85rem;">
              <label>Copy &amp; Paste HTML Snippet</label>
              <textarea rows="3" readonly data-badge-code style="font-family:monospace;font-size:0.78rem;"></textarea>
            </div>
            <button type="button" class="btn btn-dark btn-sm" data-copy-badge>Copy Badge HTML</button>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  writePage(
    "/join/",
    renderLayout({
      title: "List Your Stilt Walking Act Free (0% Commission) | StiltWalker.net",
      description:
        "Join America's dedicated stilt walker directory founded by Beau Carnes. Free forever profiles (0% commission) or $19/mo Featured Pro top city placement.",
      route: "/join/",
      activeNav: "",
      schemaJson: null,
      bodyHtml: body
    })
  );
}

// ============================================================================
// RUN BUILD
// ============================================================================
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDirRecursive(PUBLIC_DIR, DIST);

buildHomePage();
buildHirePages();
buildGearPages();
buildInsurancePage();
buildCalculatorPage();
buildContractRiderPage();
buildJoinPage();

// Write sitemap.xml
const today = new Date().toISOString().split("T")[0];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${builtUrls
  .map(
    (u) => `  <url>
    <loc>${esc(u)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === `${config.site.url}/` ? "1.0" : u.includes("/hire/") ? "0.85" : "0.9"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemapXml, "utf8");

// Write robots.txt
const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${config.site.url}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, "robots.txt"), robotsTxt, "utf8");

// Write _redirects for Cloudflare Pages / Netlify clean legacy handling
const redirectsTxt = `# Redirect legacy 2003-2005 image requests gracefully
/*.gif / 301
`;
fs.writeFileSync(path.join(DIST, "_redirects"), redirectsTxt, "utf8");

console.log(`Built ${builtUrls.length} static SEO pages + sitemap.xml into ${DIST}`);
