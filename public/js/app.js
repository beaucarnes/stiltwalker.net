(function () {
  "use strict";

  // 1. Mobile Navigation Toggle
  const mobileBtn = document.querySelector("[data-mobile-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // 2. Interactive Directory / Act Package Filter
  const filterContainer = document.querySelector("[data-act-filter]");
  if (filterContainer) {
    const ceilingSelect = filterContainer.querySelector("[name='filterCeiling']");
    const apparatusSelect = filterContainer.querySelector("[name='filterApparatus']");
    const themeSelect = filterContainer.querySelector("[name='filterTheme']");
    const coiSelect = filterContainer.querySelector("[name='filterCoi']");
    const actCards = document.querySelectorAll("[data-act-card]");
    const countLabel = document.querySelector("[data-act-count]");

    function applyFilters() {
      const ceiling = ceilingSelect ? ceilingSelect.value : "all";
      const apparatus = apparatusSelect ? apparatusSelect.value : "all";
      const theme = themeSelect ? themeSelect.value : "all";
      const coi = coiSelect ? coiSelect.value : "all";
      let visible = 0;

      actCards.forEach((card) => {
        const cCeil = Number(card.dataset.minCeiling || 9);
        const cApp = card.dataset.apparatus || "";
        const cTheme = card.dataset.theme || "";
        const cCoi = card.dataset.coi || "yes";

        let match = true;
        if (ceiling !== "all" && cCeil > Number(ceiling)) match = false;
        if (apparatus !== "all" && !cApp.includes(apparatus)) match = false;
        if (theme !== "all" && !cTheme.includes(theme)) match = false;
        if (coi === "yes" && cCoi !== "yes") match = false;

        card.style.display = match ? "flex" : "none";
        if (match) visible++;
      });

      if (countLabel) {
        countLabel.textContent = visible + " matching act configuration" + (visible === 1 ? "" : "s");
      }
    }

    [ceilingSelect, apparatusSelect, themeSelect, coiSelect].forEach((el) => {
      if (el) el.addEventListener("change", applyFilters);
    });
  }

  // 3. Interactive Event Rate, Set-Break & Ceiling Clearance Calculator
  const calcRoot = document.querySelector("[data-stilt-calculator]");
  if (calcRoot) {
    const eventTypeEl = calcRoot.querySelector("[name='calcEventType']");
    const hoursEl = calcRoot.querySelector("[name='calcHours']");
    const stiltHeightEl = calcRoot.querySelector("[name='calcStiltHeight']");
    const costumeEl = calcRoot.querySelector("[name='calcCostume']");
    const ceilingHaveEl = calcRoot.querySelector("[name='calcVenueCeiling']");
    const peakDateEl = calcRoot.querySelector("[name='calcPeak']");

    const outRange = calcRoot.querySelector("[data-calc-range]");
    const outClearance = calcRoot.querySelector("[data-calc-clearance]");
    const outSchedule = calcRoot.querySelector("[data-calc-schedule]");
    const outApparatus = calcRoot.querySelector("[data-calc-apparatus]");
    const outAlert = calcRoot.querySelector("[data-calc-alert]");
    const prefillQuoteBtn = calcRoot.querySelector("[data-calc-to-quote]");

    function runCalc() {
      const eventBaseMap = {
        private: 175,
        hora_loca: 240,
        corporate: 275,
        festival: 225,
        haunt: 195
      };
      const costumeMultMap = {
        standard: 1.0,
        led_wings: 1.25,
        mirror_man: 1.45,
        custom_branded: 1.55
      };

      const eventType = eventTypeEl ? eventTypeEl.value : "corporate";
      const hours = Math.max(1, Number(hoursEl ? hoursEl.value : 2));
      const stiltInches = Number(stiltHeightEl ? stiltHeightEl.value : 24);
      const costume = costumeEl ? costumeEl.value : "led_wings";
      const venueCeilingFt = Number(ceilingHaveEl ? ceilingHaveEl.value : 12);
      const isPeak = peakDateEl ? peakDateEl.value === "yes" : false;

      // Minimum 2-hour industry standard block except Hora Loca 1-hr blast
      const billableHours = eventType === "hora_loca" && hours === 1 ? 1.35 : Math.max(1.6, hours);
      const hourlyBase = eventBaseMap[eventType] || 220;
      const mult = (costumeMultMap[costume] || 1.0) * (isPeak ? 1.25 : 1.0);
      // Multi-hour volume taper after hour 2
      const effectiveHours = billableHours <= 2 ? billableHours : 2 + (billableHours - 2) * 0.72;

      const lowEst = Math.round((hourlyBase * effectiveHours * mult * 0.88) / 25) * 25;
      const highEst = Math.round((hourlyBase * effectiveHours * mult * 1.22) / 25) * 25;

      // Safe clearance math: 71" tall performer + stiltInches + 10" headpiece/safety buffer
      const totalHeightInches = 71 + stiltInches + 10;
      const minSafeFt = (totalHeightInches / 12).toFixed(1);

      // Set / break pacing
      const setsCount = hours === 1 ? "1 × 45-min high-energy set" : `${hours} × 40-min sets (with 15-min off-stilt safety breaks)`;
      const recApparatus =
        eventType === "hora_loca"
          ? "Circus Peg Stilts or Lightweight Magnesium Stilts"
          : costume === "mirror_man"
          ? "Articulating Flat-Foot Stilts (for stationary photo stability)"
          : stiltInches >= 36
          ? "Dual-Leg Magnesium / Pro Stage Stilts + Ground Spotter"
          : "Pro Articulating or Peg Stilts";

      if (outRange) outRange.textContent = `$${lowEst.toLocaleString()} – $${highEst.toLocaleString()}`;
      if (outClearance) outClearance.textContent = `${minSafeFt} ft minimum`;
      if (outSchedule) outSchedule.textContent = setsCount;
      if (outApparatus) outApparatus.textContent = recApparatus;

      if (outAlert) {
        if (venueCeilingFt < Number(minSafeFt)) {
          outAlert.style.display = "block";
          outAlert.innerHTML = `<strong>Ceiling Warning:</strong> Your ${venueCeilingFt} ft ceiling is too low for ${stiltInches}" stilts (${minSafeFt} ft needed). Drop stilt height to 18" (needs ~8.2 ft) or move to an outdoor/atrium area.`;
        } else {
          outAlert.style.display = "block";
          outAlert.innerHTML = `<strong>Clearance Passed ✓</strong> Your ${venueCeilingFt} ft venue clears ${stiltInches}" stilts safely (minimum ${minSafeFt} ft including headwear buffer).`;
        }
      }

      if (prefillQuoteBtn) {
        const params = new URLSearchParams({
          event: eventType,
          hours: String(hours),
          stilts: String(stiltInches),
          costume: costume,
          budget: `$${lowEst}-$${highEst}`
        });
        const baseHref = (prefillQuoteBtn.dataset.baseHref || prefillQuoteBtn.getAttribute("href") || "./hire/").split("?")[0].split("#")[0];
        prefillQuoteBtn.dataset.baseHref = baseHref;
        prefillQuoteBtn.setAttribute("href", `${baseHref}?${params.toString()}#quote-form`);
      }
    }

    [eventTypeEl, hoursEl, stiltHeightEl, costumeEl, ceilingHaveEl, peakDateEl].forEach((el) => {
      if (el) el.addEventListener("change", runCalc);
      if (el) el.addEventListener("input", runCalc);
    });
    runCalc();
  }

  // 4. Pre-fill Quote Form from URL Query Params
  const quoteForm = document.querySelector("#quote-form form, form[data-quote-form]");
  if (quoteForm) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("city")) {
      const cityInput = quoteForm.querySelector("[name='city']");
      if (cityInput && !cityInput.value) cityInput.value = params.get("city");
    }
    if (params.get("budget")) {
      const notesInput = quoteForm.querySelector("[name='notes']");
      if (notesInput && !notesInput.value) {
        notesInput.value = `Estimated from Calculator: ${params.get("budget")} (${params.get("hours") || 2} hrs, ${params.get("stilts") || 24}" stilts, ${params.get("costume") || "standard"} style). `;
      }
    }
    if (params.get("plan")) {
      const planSelect = quoteForm.querySelector("[name='tier']");
      if (planSelect) planSelect.value = params.get("plan");
    }
  }

  // 5. Performer Onboarding COI Insurance Trigger ($30 CPL Thimble Funnel)
  const coiRadioSelect = document.querySelector("[data-coi-selector]");
  const coiUpsellBanner = document.querySelector("[data-coi-upsell]");
  if (coiRadioSelect && coiUpsellBanner) {
    const toggleCoiBanner = () => {
      if (coiRadioSelect.value === "no") {
        coiUpsellBanner.classList.add("visible");
      } else {
        coiUpsellBanner.classList.remove("visible");
      }
    };
    coiRadioSelect.addEventListener("change", toggleCoiBanner);
    toggleCoiBanner();
  }

  // 6. Interactive Stilt Safety Contract Rider Generator
  const riderBuilder = document.querySelector("[data-rider-builder]");
  if (riderBuilder) {
    const pName = riderBuilder.querySelector("[name='riderName']");
    const pClearance = riderBuilder.querySelector("[name='riderClearance']");
    const pWind = riderBuilder.querySelector("[name='riderWind']");
    const pSet = riderBuilder.querySelector("[name='riderSet']");
    const previewEl = document.querySelector("[data-rider-output]");
    const copyBtn = document.querySelector("[data-copy-rider]");

    function renderRider() {
      const performer = (pName && pName.value.trim()) || "[Performer / Troupe Name]";
      const clearance = (pClearance && pClearance.value) || "10.5 feet";
      const wind = (pWind && pWind.value) || "16 mph";
      const setRule = (pSet && pSet.value) || "40 minutes on stilts / 15 minutes mandatory rest";

      const text = [
        "================================================================",
        "         STILT WALKING SAFETY & VENUE TECHNICAL RIDER",
        "            Generated via https://stiltwalker.net",
        "================================================================",
        `Performer: ${performer}`,
        "",
        "1. OVERHEAD & PATHWAY CLEARANCE",
        `   Client guarantees a minimum unobstructed vertical clearance of ${clearance}`,
        "   (excluding chandeliers, ceiling fans, exit signs, and string lights) and",
        "   minimum 4-foot doorway/pathway width throughout the performance zone.",
        "",
        "2. SURFACE & WEATHER CUTOFFS",
        "   Performance surfaces must be level, dry, and free of loose gravel, slick",
        "   grease, un-taped cables, or stairs. For outdoor bookings, sustained winds",
        `   or gusts exceeding ${wind}, lightning, or slick rain allow Performer to`,
        "   pause or transition to ground character work without fee reduction.",
        "",
        "3. GREEN ROOM & MOUNTING CHAIR",
        "   Client shall provide a private, secure staging area adjacent to the",
        "   performance floor (no stairs between staging and floor) equipped with",
        "   one sturdy, armless chair or 36-inch mounting bench for safe rig-up.",
        "",
        "4. SET PACING & CROWD SAFETY",
        `   Standard pacing is ${setRule}.`,
        "   Intoxicated guests grabbing stilts or blocking foot placement is an",
        "   immediate fall hazard; Performer may step off the floor until venue",
        "   security resolves physical interference.",
        "================================================================"
      ].join("\n");

      if (previewEl) previewEl.textContent = text;
    }

    [pName, pClearance, pWind, pSet].forEach((el) => {
      if (el) el.addEventListener("input", renderRider);
      if (el) el.addEventListener("change", renderRider);
    });
    renderRider();

    if (copyBtn && previewEl) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(previewEl.textContent).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = "Copied Safety Rider ✓";
          setTimeout(() => (copyBtn.textContent = orig), 2200);
        });
      });
    }
  }

  // 7. Embeddable Performer SEO Backlink Badge Generator
  const badgeGen = document.querySelector("[data-badge-generator]");
  if (badgeGen) {
    const nameInput = badgeGen.querySelector("[name='badgeName']");
    const citySelect = badgeGen.querySelector("[name='badgeCity']");
    const codeOut = badgeGen.querySelector("[data-badge-code]");
    const copyBadgeBtn = badgeGen.querySelector("[data-copy-badge]");

    function updateBadge() {
      const stageName = (nameInput && nameInput.value.trim()) || "Verified Stilt Performer";
      const citySlug = (citySelect && citySelect.value) || "";
      const targetUrl = citySlug
        ? `https://stiltwalker.net/hire/${citySlug}/`
        : "https://stiltwalker.net/";

      const snippet = `<a href="${targetUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#090d1a;color:#f6c453;border:1px solid #e5a93c;border-radius:8px;font-family:sans-serif;font-size:13px;font-weight:700;text-decoration:none;">★ ${stageName} — Verified on StiltWalker.net</a>`;
      if (codeOut) codeOut.value = snippet;
    }

    if (nameInput) nameInput.addEventListener("input", updateBadge);
    if (citySelect) citySelect.addEventListener("change", updateBadge);
    updateBadge();

    if (copyBadgeBtn && codeOut) {
      copyBadgeBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(codeOut.value).then(() => {
          const orig = copyBadgeBtn.textContent;
          copyBadgeBtn.textContent = "Badge HTML Copied ✓";
          setTimeout(() => (copyBadgeBtn.textContent = orig), 2200);
        });
      });
    }
  }

  // 8. Universal Lead / Performer Onboarding Form Handler
  document.querySelectorAll("form[data-async-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusBox = form.querySelector("[data-form-status]");
      const submitBtn = form.querySelector("button[type='submit']");
      const origLabel = submitBtn ? submitBtn.textContent : "Submit";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.pageUrl = window.location.href;
      payload.submittedAt = new Date().toISOString();

      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Fallback local capture");
      } catch (_) {
        // Store locally as backup if static preview without worker
        const saved = JSON.parse(localStorage.getItem("stiltwalker_submissions") || "[]");
        saved.push(payload);
        localStorage.setItem("stiltwalker_submissions", JSON.stringify(saved));
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origLabel;
      }

      if (statusBox) {
        statusBox.className = "form-status success";
        const formKind = form.dataset.asyncForm;
        if (formKind === "quote") {
          const barkUrl = form.dataset.barkUrl || "https://www.bark.com/en/us/entertainers/";
          statusBox.innerHTML =
            `<strong>Quote Request Received!</strong> We're matching your event specs (${payload.city || "your area"}) with vetted stilt walkers. ` +
            `Need urgent same-day availability quotes from additional local agencies too? ` +
            `<a href="${barkUrl}" target="_blank" rel="noopener sponsored" style="text-decoration:underline;font-weight:800;">Compare instant backup quotes via our partner network →</a>`;
        } else if (formKind === "performer") {
          const checkoutHtml =
            payload.tier === "pro-annual"
              ? ` <br/><br/><a href="https://buy.stripe.com/3cIcN48gM22ZgNzbFcbo40d" target="_blank" rel="noopener" class="btn btn-gold btn-sm">Complete $179/yr Featured Pro Activation →</a>`
              : payload.tier === "pro-monthly"
              ? ` <br/><br/><a href="https://buy.stripe.com/14A3cu8gM7njbtfeRobo40a" target="_blank" rel="noopener" class="btn btn-gold btn-sm">Complete $19/mo Featured Pro Activation →</a>`
              : "";
          statusBox.innerHTML =
            `<strong>Welcome to StiltWalker.net, ${payload.stageName || "Performer"}!</strong> Your directory profile application is queued for verification. ` +
            `Don't forget to grab your <strong>Verified Backlink Badge</strong> below to boost your city ranking!${checkoutHtml}`;
        } else {
          statusBox.innerHTML =
            `<strong>Sent!</strong> Your free 1-Page Stilt Venue Safety Checklist is unlocked—you can also copy or print the customized rider above right now.`;
        }
      }
    });
  });
})();
