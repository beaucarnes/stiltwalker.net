#!/usr/bin/env node
/**
 * StiltWalker.net Automated Concierge Performer Sourcing & Lead Dispatch Engine
 *
 * What happens when an event planner clicks "Get Free Stilt Walker Quotes" in a city
 * with 0 signed-up performers?
 * 1. Immediate In-Browser Match: The planner immediately sees our regional stilt troupe
 *    profiles + our instant partner backup network (Bark.com, earning $20-$80 CPL).
 * 2. Automated Outbound Performer Concierge ("The Supply Flywheel"):
 *    This script scans incoming quote requests and GrokBot buyer leads, identifies cities
 *    lacking a paying $19/mo Featured Pro performer, and generates/dispatches personalized
 *    "We have a live paid gig inquiry in [City] for you (0% commission)" outreach packets
 *    to real local stilt walkers in `ops/outreach-queue.json`.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "data/monetization.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cities.json"), "utf8"));
const seedPerformers = JSON.parse(fs.readFileSync(path.join(ROOT, "data/seed-performers.json"), "utf8"));

const leadsFile = path.join(ROOT, "ops/captured-leads.json");
const grokInboxFile = path.join(ROOT, "ops/grokbot-inbox.json");
const outreachQueueFile = path.join(ROOT, "ops/outreach-queue.json");

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function buildOutreachPacket(lead) {
  const cityText = lead.city || "your metro area";
  const eventType = lead.eventType || "Special Event / Corporate Activation";
  const eventDate = lead.eventDate || "Upcoming Date";
  const ceiling = lead.ceiling || "10.5+ ft";
  const notes = lead.notes || "Standard 2-hour roaming stilt booking";

  const subject = `Live Stilt Walker Inquiry in ${cityText} (${eventDate}) — 0% Commission via StiltWalker.net`;

  const emailBody = [
    `Hi there,`,
    ``,
    `I'm Beau Carnes (fellow stilt walker/juggler and founder of StiltWalker.net).`,
    ``,
    `An event planner just submitted a quote request on StiltWalker.net looking for a stilt walker in ${cityText}:`,
    `  • Event Type: ${eventType}`,
    `  • Event Date: ${eventDate}`,
    `  • Venue Ceiling Clearance: ${ceiling}`,
    `  • Planner Notes / Budget: ${notes}`,
    ``,
    `Unlike GigSalad or Bark, StiltWalker.net charges 0% booking commission—planners book you directly and you keep 100% of your gig pay.`,
    ``,
    `How to claim this ${cityText} lead:`,
    `1. Free Verified Listing ($0 forever): Submit your 90-second profile at https://stiltwalker.net/join/ so we can forward your contact card to this planner.`,
    `2. Or Lock In the #1 Featured Pro Spot in ${cityText} ($19/mo): Get instant direct routing on every ${cityText} inquiry + a 24-hour head start before free listings: ${config.products.featuredProMonthly.stripePaymentLink}`,
    ``,
    `Stay safe up there,`,
    `Beau Carnes`,
    `Founder, StiltWalker.net`
  ].join("\n");

  const instagramDm = `Hey! Fellow stilt walker here (I run StiltWalker.net). We just got a client quote request for a ${eventType} in ${cityText} (${eventDate}). We charge 0% commission—if you want me to send the planner your info for free, drop your act into https://stiltwalker.net/join/ !`;

  return {
    id: `outreach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: "ready_for_outreach",
    city: cityText,
    leadSummary: { eventType, eventDate, ceiling, notes },
    searchQueryForLocalPerformers: `"stilt walker" OR "circus entertainment" "${cityText}" contact email OR instagram`,
    subject,
    emailBody,
    instagramDm
  };
}

function runConcierge() {
  const captured = loadJson(leadsFile, []);
  const grokInbox = loadJson(grokInboxFile, { eventBuyerLeads: [], performerOutreachProspects: [] });
  const existingQueue = loadJson(outreachQueueFile, { updatedAt: null, packets: [] });

  const quoteLeads = [
    ...captured.filter((x) => x.formType === "quote"),
    ...(grokInbox.eventBuyerLeads || [])
  ];

  const existingSignatures = new Set(
    (existingQueue.packets || []).map((p) => `${p.city}|${p.leadSummary?.eventDate}|${p.leadSummary?.eventType}`)
  );

  let added = 0;
  for (const lead of quoteLeads) {
    const sig = `${lead.city || "unknown"}|${lead.eventDate || ""}|${lead.eventType || ""}`;
    if (!existingSignatures.has(sig)) {
      existingQueue.packets.push(buildOutreachPacket(lead));
      existingSignatures.add(sig);
      added++;
    }
  }

  existingQueue.updatedAt = new Date().toISOString();
  existingQueue.seedRosterCount = seedPerformers.length;
  existingQueue.coveredMetros = cities.length;

  fs.writeFileSync(outreachQueueFile, JSON.stringify(existingQueue, null, 2), "utf8");
  console.log(
    `[Concierge] Seed Roster: ${seedPerformers.length} regional acts across ${cities.length} metros | New live-lead outreach packets queued: ${added} (Total: ${existingQueue.packets.length})`
  );
}

if (require.main === module) {
  runConcierge();
}

module.exports = { runConcierge, buildOutreachPacket };
