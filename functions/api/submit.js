/**
 * Cloudflare Pages Function: POST /api/submit
 * Zero-cost serverless handler for Event Quote Leads, Performer Signups & Lead Magnets.
 *
 * Optional Environment Variables in Cloudflare Pages Dashboard:
 * - RESEND_API_KEY: Free Resend.com API key (3,000 emails/mo free)
 * - NOTIFY_EMAIL: Email address to receive instant lead alerts (e.g. beau@stiltwalker.net)
 * - LEAD_WEBHOOK_URL: Optional Slack / Discord / Zapier / Make / GrokBot webhook URL
 * - STILTWALKER_KV: Optional Cloudflare KV namespace binding to persist every submission
 */
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const kind = String(data.formType || "inquiry").slice(0, 40);
    const timestamp = new Date().toISOString();
    const recordId = `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const record = {
      id: recordId,
      kind,
      receivedAt: timestamp,
      ipCountry: context.request.headers.get("CF-IPCountry") || "US",
      payload: data
    };

    // 1. Persist to Cloudflare KV if bound
    if (context.env && context.env.STILTWALKER_KV) {
      await context.env.STILTWALKER_KV.put(recordId, JSON.stringify(record));
    }

    // 2. Forward to Webhook if configured
    if (context.env && context.env.LEAD_WEBHOOK_URL) {
      await fetch(context.env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[StiltWalker.net] New ${kind.toUpperCase()}: ${JSON.stringify(data)}`
        })
      }).catch(() => {});
    }

    // 3. Send Instant Email Notification via Resend Free Tier if configured
    if (context.env && context.env.RESEND_API_KEY && context.env.NOTIFY_EMAIL) {
      const subjectMap = {
        quote: `New Stilt Event Quote Lead — ${data.city || "US"} (${data.eventType || "Event"})`,
        performer: `New Performer Signup — ${data.stageName || data.name || "Artist"} (${data.city || "US"})`,
        rider_magnet: `New Rider Checklist Lead — ${data.email || "Performer"}`
      };
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "StiltWalker.net Leads <leads@stiltwalker.net>",
          to: [context.env.NOTIFY_EMAIL],
          subject: subjectMap[kind] || `New StiltWalker.net Submission (${kind})`,
          text: JSON.stringify(record, null, 2)
        })
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, id: recordId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid request payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
