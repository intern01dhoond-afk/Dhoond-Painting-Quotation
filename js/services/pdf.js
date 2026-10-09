// js/services/pdf.js
// Customer-facing PDF generation and WhatsApp handoff.
// The PDF is rendered from the same quotation-preview DOM that the
// customer sees, so the shared PDF stays consistent with the preview.

const TARGET_WHATSAPP = '917204948579';

/* =========================================================
   BASIC HELPERS
========================================================= */

function money(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getQuotationNumber() {
  const key = 'dhoondQuotationSequence';

  let seq = parseInt(
    localStorage.getItem(key) || '124',
    10
  );

  if (!Number.isFinite(seq)) {
    seq = 124;
  }

  seq += 1;

  localStorage.setItem(key, String(seq));

  const year = new Date().getFullYear();

  return `QTN-${year}-${String(seq).padStart(5, '0')}`;
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function numberToWordsIndian(num) {
  num = Math.round(Number(num) || 0);

  if (num === 0) {
    return 'Zero';
  }

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety'
  ];

  const under100 = n =>
    n < 20
      ? ones[n]
      : tens[Math.floor(n / 10)] +
        (n % 10 ? `-${ones[n % 10]}` : '');

  const under1000 = n =>
    n < 100
      ? under100(n)
      : `${ones[Math.floor(n / 100)]} Hundred${
          n % 100 ? ` ${under100(n % 100)}` : ''
        }`;

  const parts = [];

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) {
    parts.push(`${under1000(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${under1000(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${under1000(thousand)} Thousand`);
  }

  if (num) {
    parts.push(under1000(num));
  }

  return parts.join(' ');
}


/* =========================================================
   QUOTATION CALCULATION
========================================================= */

function calculateQuoteData() {
  const quoteRooms = rooms.map((r, index) => {
    const pkg = PACKAGES[r.packageIndex];

    const paintCost = pkg
      ? Number(r.area || 0) *
        (pkg.rate + Number(r.puttyRate || 0))
      : 0;

    let addonCost = 0;

    const addons = [];

    /* -------------------------
       DOOR
    ------------------------- */

    const doorSelection = r.doorSelection || {};

    const d = ADDON_CATALOG.door.find(
      x => x.id === doorSelection.id
    );

    if (d && d.sqftRate > 0) {
      const sqft =
        Number(doorSelection.width || 0) *
        Number(doorSelection.height || 0) *
        2;

      const cost =
        Math.round(sqft * d.sqftRate) *
        Number(doorSelection.qty || 1);

      addonCost += cost;

      addons.push({
        label: `${doorSelection.qty || 1} × Door`,
        detail:
          `${d.name} • ` +
          `${doorSelection.width} × ${doorSelection.height} ft`,
        amount: cost
      });
    }


    /* -------------------------
       GRILL
    ------------------------- */

    const grillSelection = r.grillSelection || {};

    const g = ADDON_CATALOG.grill.find(
      x => x.id === grillSelection.id
    );

    if (g && g.sqftRate > 0) {
      const sqft =
        Number(grillSelection.width || 0) *
        Number(grillSelection.height || 0);

      const cost =
        Math.round(sqft * g.sqftRate) *
        Number(grillSelection.qty || 1);

      addonCost += cost;

      addons.push({
        label: `${grillSelection.qty || 1} × Grill`,
        detail:
          `${g.name} • ` +
          `${grillSelection.width} × ${grillSelection.height} ft`,
        amount: cost
      });
    }


    /* -------------------------
       CUSTOM ADD-ON
    ------------------------- */

    const customAddon = r.customAddon || {};

    const customAddonPrice = Math.max(
      0,
      Number(customAddon.price) || 0
    );

    if (
      customAddon.name &&
      customAddonPrice > 0
    ) {
      addonCost += customAddonPrice;

      addons.push({
        label: customAddon.name,
        detail: 'Custom add-on',
        amount: customAddonPrice
      });
    }


    return {
      index: index + 1,
      name: r.name,
      area: Number(r.area || 0),
      packageName: pkg
        ? pkg.name
        : 'Package not selected',

      rate: pkg
        ? pkg.rate + Number(r.puttyRate || 0)
        : 0,

      paintCost,
      addons,

      total: paintCost + addonCost
    };
  });


  return {
    customerName:
      customerName || 'Customer',

    customerMobile:
      customerMobile || '-',

    scope:
      paintScope === 'interior'
        ? 'Interior Painting'
        : 'Exterior Painting',

    propertyStatus:
      isVacant
        ? 'Vacant House'
        : 'Occupied / Furnished',

    rooms: quoteRooms,

    total: quoteRooms.reduce(
      (sum, r) => sum + r.total,
      0
    )
  };
}


/* =========================================================
   CURRENT QUOTATION
========================================================= */

function getCurrentQuoteForPdf() {

  // Prefer the exact quotation currently displayed
  // in the preview.

  if (window.__dhoondPreviewQuote) {
    return window.__dhoondPreviewQuote;
  }

  const quote = calculateQuoteData();

  quote.quotationNo =
    getQuotationNumber();

  quote.date =
    formatDate();

  return quote;
}


/* =========================================================
   PDF RENDERING MODE
========================================================= */

function setPdfRenderingMode(enabled) {

  document.documentElement.classList.toggle(
    'pdf-rendering',
    enabled
  );
}


/* =========================================================
   PREVIEW
========================================================= */

async function ensurePreviewIsReady() {

  const modal =
    document.getElementById('summaryModal');

  const wasHidden =
    !modal ||
    modal.classList.contains('hidden');

  if (wasHidden) {

    toggleSummaryModal(true);

    await new Promise(resolve =>
      requestAnimationFrame(() =>
        requestAnimationFrame(resolve)
      )
    );
  }

  return {
    modal,
    wasHidden
  };
}


/* =========================================================
   PROFESSIONAL QUOTATION POLICY CONTENT
========================================================= */

function createProfessionalPolicySection() {

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'dhoond-pdf-policy-section';

  wrapper.innerHTML = `
    <section class="dhoond-procedure">
      <div class="dhoond-section-kicker">THE DHOOND DIFFERENCE</div>
      <h2>Our painting process</h2>
      <p class="dhoond-section-intro">A clear, step-by-step approach from protecting your home to the final walkthrough.</p>
      <div class="dhoond-process-grid">
        <article class="dhoond-process-step">
          <div class="dhoond-process-art"><svg viewBox="0 0 80 64" role="img" aria-label="Room protected before painting"><path d="M13 51V15h54v36" fill="#f4f8fc" stroke="#24445f" stroke-width="3"/><path d="M9 51h62v7H9z" fill="#d9e9f7"/><path d="M23 20h34v25H23z" fill="#fff" stroke="#8bb8dc" stroke-width="2"/><path d="M16 48h48M25 44l8-8 7 5 9-11 8 8" fill="none" stroke="#2384d9" stroke-width="3"/><circle cx="58" cy="17" r="5" fill="#f0b64d"/></svg></div>
          <b>01 · Protect</b><span>Cover floors and furniture; prepare the work area.</span>
        </article>
        <article class="dhoond-process-step">
          <div class="dhoond-process-art"><svg viewBox="0 0 80 64" role="img" aria-label="Wall surface preparation"><path d="M15 10h50v44H15z" fill="#f4f8fc" stroke="#24445f" stroke-width="3"/><path d="M21 42l8-8 7 4 7-15 7 12 7-5 8 11" fill="none" stroke="#e5a842" stroke-width="4"/><path d="M25 18h30" stroke="#8bb8dc" stroke-width="3"/><circle cx="57" cy="20" r="3" fill="#2384d9"/></svg></div>
          <b>02 · Prepare</b><span>Clean the surface and handle minor patchwork in scope.</span>
        </article>
        <article class="dhoond-process-step">
          <div class="dhoond-process-art"><svg viewBox="0 0 80 64" role="img" aria-label="Primer and paint application"><path d="M17 15h30v8H17zM42 19h8v13H38" fill="none" stroke="#24445f" stroke-width="4" stroke-linejoin="round"/><path d="M31 32h24v8H31z" fill="#2384d9"/><path d="M38 40v12" stroke="#24445f" stroke-width="4"/><path d="M55 12v10M61 16l7-4M24 47c0 4-6 4-6 0s6-8 6-8 6 4 6 8" fill="#f0b64d"/></svg></div>
          <b>03 · Prime & paint</b><span>Apply the selected primer and paint system as quoted.</span>
        </article>
        <article class="dhoond-process-step">
          <div class="dhoond-process-art"><svg viewBox="0 0 80 64" role="img" aria-label="Finished room checked and cleaned"><path d="M14 12h52v41H14z" fill="#f4f8fc" stroke="#24445f" stroke-width="3"/><path d="M21 19h38v27H21z" fill="#dcedf9"/><path d="M28 34l7 7 16-17" fill="none" stroke="#2384d9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 55h60" stroke="#e5a842" stroke-width="4"/></svg></div>
          <b>04 · Clean & review</b><span>Clean the site and review the completed work with you.</span>
        </article>
      </div>
    </section>

    <section class="dhoond-comparison">
      <div class="dhoond-section-kicker">A MORE TRANSPARENT QUOTE</div>
      <h2>How this Dhoond quote compares</h2>
      <p class="dhoond-section-intro">Compare the scope and written terms that matter. Other providers’ offerings vary by city, package and project.</p>
      <table class="dhoond-compare-table">
        <thead><tr><th>What to compare</th><th>This Dhoond quotation</th><th>NoBroker · Urban Company · AapkaPainter</th></tr></thead>
        <tbody>
          <tr><td>Estimate format</td><td>Room-wise area, selected package, rates and total shown here.</td><td>Request a current estimate; format and inclusions depend on the service/package.</td></tr>
          <tr><td>Materials & extras</td><td>Selected paint package and chosen add-ons are itemised in this quote.</td><td>Check the chosen package for paint brand, coats, repairs and add-on charges.</td></tr>
          <tr><td>Project experience</td><td>Scope, payment terms and validity are stated in this quotation.</td><td>Providers advertise managed booking, inspections or quality checks; exact process varies.</td></tr>
          <tr><td>Warranty & support</td><td>Refer to the written terms agreed for this project; confirm any warranty before booking.</td><td>Warranty/support terms differ by provider and selected system; verify current written terms.</td></tr>
        </tbody>
      </table>
      <p class="dhoond-compare-note">For a fair comparison, match the paint brand, coats, surface preparation, protection, cleanup, taxes and warranty in each written quote.</p>
    </section>

    <div class="dhoond-policy-grid">

      <section class="dhoond-policy-card included">

        <div class="dhoond-policy-title">
          <span class="dhoond-policy-icon">✓</span>
          <span>What's Included</span>
        </div>

        <ul>
          <li>Surface cleaning and preparation</li>
          <li>Primer application as per selected package</li>
          <li>Selected paint and materials</li>
          <li>Basic patch work for minor cracks and holes</li>
          <li>Skilled painting labour and supervision</li>
          <li>Standard painting tools and safety equipment</li>
          <li>Site cleaning after completion</li>
        </ul>

      </section>


      <section class="dhoond-policy-card excluded">

        <div class="dhoond-policy-title">
          <span class="dhoond-policy-icon">×</span>
          <span>What's Not Included</span>
        </div>

        <ul>
          <li>Major civil repairs, leakage or structural cracks</li>
          <li>Electrical or plumbing work</li>
          <li>Carpentry or false-ceiling work</li>
          <li>Furniture shifting unless specifically agreed</li>
          <li>Texture, designer or 3D wall finishes unless selected</li>
          <li>Additional coats beyond the agreed package</li>
          <li>Any work outside the approved quotation scope</li>
        </ul>

      </section>

    </div>


    <div class="dhoond-policy-bottom-grid">

      <section class="dhoond-policy-card">

        <div class="dhoond-policy-title">
          <span class="dhoond-policy-icon neutral">₹</span>
          <span>Payment Terms</span>
        </div>

        <ul>
          <li>Advance payment is required before work begins.</li>
          <li>Balance payment is payable as per the agreed project schedule.</li>
          <li>Additional approved work will be billed separately.</li>
          <li>Payments can be made through the agreed payment method.</li>
        </ul>

      </section>


      <section class="dhoond-policy-card">

        <div class="dhoond-policy-title">
          <span class="dhoond-policy-icon neutral">↻</span>
          <span>Refund & Cancellation Policy</span>
        </div>

        <ul>
          <li>Cancellation before work starts is subject to material and preparation costs already incurred.</li>
          <li>Once work has commenced, advance payments are non-refundable for completed work and committed materials.</li>
          <li>Any eligible refund will be processed after applicable deductions.</li>
        </ul>

      </section>


      <section class="dhoond-policy-card">

        <div class="dhoond-policy-title">
          <span class="dhoond-policy-icon neutral">✓</span>
          <span>Validity & Timeline</span>
        </div>

        <ul>
          <li>This quotation is valid for 30 days from the date of issue.</li>
          <li>Work commencement is subject to customer approval and schedule availability.</li>
          <li>Estimated completion time depends on property size, scope and site conditions.</li>
        </ul>

      </section>

    </div>


    <section class="dhoond-terms">

      <div class="dhoond-policy-title">
        <span>Terms & Conditions</span>
      </div>

      <p>
        Final pricing is based on the approved scope of work and
        measurements. Any additional work requested after approval
        will require separate confirmation and may result in additional
        charges.
      </p>

      <p>
        Colour shades, paint brands and package specifications will be
        as selected and approved by the customer before commencement.
      </p>

    </section>
  `;

  return wrapper;
}


/* =========================================================
   PDF-SPECIFIC STYLES
========================================================= */

function injectPdfStyles() {

  const existing =
    document.getElementById(
      'dhoond-pdf-professional-styles'
    );

  if (existing) {
    existing.remove();
  }

  const style =
    document.createElement('style');

  style.id =
    'dhoond-pdf-professional-styles';

  style.textContent = `

    .pdf-quote-sheet {
      background: #ffffff !important;
      color: #172033 !important;

      font-family:
        "Montserrat",
        "Segoe UI",
        Arial,
        sans-serif !important;

      line-height: 1.35 !important;
    }


    .pdf-quote-sheet * {
      box-sizing: border-box;
    }


    /* ---------------------------------
       POLICY AREA
    --------------------------------- */

    .dhoond-pdf-policy-section {
      margin-top: 22px;
      width: 100%;
      color: #172033;
    }

    .dhoond-procedure, .dhoond-comparison { margin: 0 0 18px; color: #172033; page-break-inside: avoid; }
    .dhoond-section-kicker { color: #2384d9; font-size: 8px; font-weight: 800; letter-spacing: 1.1px; }
    .dhoond-procedure h2, .dhoond-comparison h2 { margin: 2px 0 3px; font-size: 17px; color: #172033; }
    .dhoond-section-intro { margin: 0 0 9px; color: #667085; font-size: 9px; }
    .dhoond-process-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .dhoond-process-step { border: 1px solid #dce3eb; border-radius: 7px; padding: 7px; page-break-inside: avoid; }
    .dhoond-process-art { height: 54px; display: flex; justify-content: center; align-items: center; background: #f4f8fc; border-radius: 5px; margin-bottom: 5px; }
    .dhoond-process-art svg { width: 68px; height: 52px; }
    .dhoond-process-step b { display: block; font-size: 9px; margin-bottom: 2px; }
    .dhoond-process-step span { display: block; color: #667085; font-size: 7.5px; line-height: 1.35; }
    .dhoond-compare-table { font-size: 7.5px; table-layout: fixed; }
    .dhoond-compare-table th, .dhoond-compare-table td { padding: 5px 6px; text-align: left; vertical-align: top; border: 1px solid #dce3eb; line-height: 1.35; }
    .dhoond-compare-table th { background: #24445f; color: white; }
    .dhoond-compare-table td:first-child { font-weight: 700; width: 18%; }
    .dhoond-compare-note { margin: 5px 0 0; font-size: 7.5px; color: #667085; }


    .dhoond-policy-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }


    .dhoond-policy-bottom-grid {
      display: grid;
      grid-template-columns:
        1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }


    .dhoond-policy-card {
      border: 1px solid #dce3eb;
      border-radius: 8px;
      background: #ffffff;
      padding: 13px 14px;
      page-break-inside: avoid;
    }


    .dhoond-policy-card.included {
      border-left: 4px solid #2384d9;
    }


    .dhoond-policy-card.excluded {
      border-left: 4px solid #687386;
    }


    .dhoond-policy-title {
      display: flex;
      align-items: center;
      gap: 8px;

      font-size: 13px;
      font-weight: 700;

      color: #172033;

      margin-bottom: 9px;
    }


    .dhoond-policy-icon {
      width: 20px;
      height: 20px;

      border-radius: 50%;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      background: #edf5fc;
      color: #147ac6;

      font-size: 13px;
      font-weight: 800;
    }


    .dhoond-policy-icon.neutral {
      background: #f1f3f6;
      color: #344054;
    }


    .dhoond-policy-card ul {
      margin: 0;
      padding-left: 17px;
    }


    .dhoond-policy-card li {
      font-size: 9.5px;
      line-height: 1.45;

      margin: 3px 0;

      color: #475467;
    }


    .dhoond-terms {
      border-top: 1px solid #dce3eb;
      padding-top: 10px;
      margin-top: 5px;

      page-break-inside: avoid;
    }


    .dhoond-terms .dhoond-policy-title {
      margin-bottom: 5px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }


    .dhoond-terms p {
      margin: 3px 0;

      font-size: 8.5px;
      line-height: 1.4;

      color: #667085;
    }


    /* ---------------------------------
       GRAND TOTAL
    --------------------------------- */

    .pdf-quote-sheet .grand-total,
    .pdf-quote-sheet .quote-total,
    .pdf-quote-sheet .total-section {
      page-break-inside: avoid;
    }


    /* ---------------------------------
       TABLE
    --------------------------------- */

    .pdf-quote-sheet table {
      width: 100%;
      border-collapse: collapse;
    }


    .pdf-quote-sheet th {
      background: #24445f !important;
      color: #ffffff !important;
      font-weight: 600 !important;
    }


    .pdf-quote-sheet td,
    .pdf-quote-sheet th {
      border-color: #dce3eb !important;
    }


    /* ---------------------------------
       PDF HEADER / FOOTER
    --------------------------------- */

    .pdf-quote-sheet img {
      max-width: 100%;
    }


    .pdf-quote-sheet .quote-header,
    .pdf-quote-sheet .quote-footer {
      page-break-inside: avoid;
    }


    /* ---------------------------------
       REMOVE UI ELEMENTS
    --------------------------------- */

    .pdf-quote-sheet button,
    .pdf-quote-sheet .no-pdf,
    .pdf-quote-sheet .pdf-hide,
    .pdf-quote-sheet [data-pdf-hide="true"] {
      display: none !important;
    }


    /* ---------------------------------
       A4 SAFETY
    --------------------------------- */

    .pdf-quote-sheet {
      width: 920px !important;
      max-width: 920px !important;
      min-height: auto !important;

      overflow: visible !important;

      box-shadow: none !important;
      border: none !important;
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   ADD FIXED PROFESSIONAL SECTIONS
========================================================= */

function addProfessionalPolicyContent(clone) {

  // Prevent duplicate sections if the preview already
  // contains the permanent policy content.

  const existing =
    clone.querySelector(
      '.dhoond-pdf-policy-section, .quotation-policy-section'
    );

  if (existing) {
    return;
  }

  const policySection =
    createProfessionalPolicySection();

  /*
   * Put policies immediately before the footer.
   * If the quotation has a known footer class, use it.
   * Otherwise append them at the bottom.
   */

  const footer =
    clone.querySelector(
      '.quote-footer, .quotation-footer, footer'
    );

  if (footer) {
    footer.parentNode.insertBefore(
      policySection,
      footer
    );
  } else {
    clone.appendChild(
      policySection
    );
  }
}


/* =========================================================
   PREPARE QUOTATION FOR PDF
========================================================= */

function prepareQuotationClone(clone) {

  clone.classList.add(
    'pdf-quote-sheet'
  );

  clone.style.position = 'fixed';
  clone.style.left = '-100000px';
  clone.style.top = '0';

  clone.style.width = '920px';
  clone.style.height = 'auto';

  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';

  clone.style.padding =
    '18px 22px 16px';

  clone.style.boxSizing =
    'border-box';

  clone.style.zIndex = '-1';


  // Remove interactive controls.

  clone
    .querySelectorAll(
      'button, input, textarea, select'
    )
    .forEach(element => {
      element.style.display = 'none';
    });


  // Hide elements explicitly marked for PDF exclusion.

  clone
    .querySelectorAll(
      '.no-pdf, .pdf-hide, [data-pdf-hide="true"]'
    )
    .forEach(element => {
      element.style.display = 'none';
    });


  addProfessionalPolicyContent(
    clone
  );
}


/* =========================================================
   RENDER TO PDF
========================================================= */

async function renderPreviewToPdf() {

  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {
    throw new Error(
      'PDF generator is still loading. Please try again in a moment.'
    );
  }


  if (!window.html2canvas) {
    throw new Error(
      'PDF preview renderer is still loading. Please try again in a moment.'
    );
  }


  const {
    modal,
    wasHidden
  } = await ensurePreviewIsReady();


  const sheet =
    modal?.querySelector(
      '.quote-sheet'
    );


  if (!sheet) {
    throw new Error(
      'Quotation preview could not be found.'
    );
  }


  /*
   * Inject PDF-only styling.
   */

  injectPdfStyles();


  /*
   * Clone the exact quotation preview.
   */

  const clone =
    sheet.cloneNode(true);


  prepareQuotationClone(
    clone
  );


  document.body.appendChild(
    clone
  );


  setPdfRenderingMode(true);


  let canvas;


  try {

    /*
     * Wait for fonts and images.
     */

    if (
      document.fonts &&
      document.fonts.ready
    ) {
      await document.fonts.ready;
    }


    const images =
      Array.from(
        clone.querySelectorAll('img')
      );


    await Promise.all(
      images.map(img => {

        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise(resolve => {

          img.onload = resolve;
          img.onerror = resolve;

        });

      })
    );


    /*
     * Render quotation.
     */

    canvas =
      await html2canvas(
        clone,
        {
          backgroundColor:
            '#ffffff',

          scale: 2,

          useCORS: true,

          allowTaint: false,

          logging: false,

          imageTimeout: 10000,

          windowWidth: 920,

          scrollX: 0,

          scrollY: 0
        }
      );

  } finally {

    setPdfRenderingMode(false);

    clone.remove();

    if (wasHidden) {
      toggleSummaryModal(false);
    }
  }


  /* =======================================================
     CREATE A4 PDF
  ======================================================= */

  const {
    jsPDF
  } = window.jspdf;


  const doc =
    new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    });


  const pageW =
    doc.internal.pageSize.getWidth();

  const pageH =
    doc.internal.pageSize.getHeight();


  const padding = 5;

  const maxW =
    pageW - padding * 2;

  const maxH =
    pageH - padding * 2;


  /*
   * Fit the entire quotation to A4.
   */

  const scale =
    Math.min(
      maxW / canvas.width,
      maxH / canvas.height
    );


  const renderW =
    canvas.width * scale;

  const renderH =
    canvas.height * scale;


  const x =
    (pageW - renderW) / 2;

  const y =
    (pageH - renderH) / 2;


  /*
   * JPEG gives a smaller PDF while keeping
   * the quotation sharp enough for WhatsApp.
   */

  doc.addImage(
    canvas.toDataURL(
      'image/jpeg',
      0.95
    ),
    'JPEG',
    x,
    y,
    renderW,
    renderH,
    undefined,
    'FAST'
  );


  const quote =
    getCurrentQuoteForPdf();


  const safeName =
    (quote.customerName || 'Customer')
      .replace(
        /[^a-z0-9]+/gi,
        '_'
      )
      .replace(
        /^_+|_+$/g,
        ''
      ) ||
    'Customer';


  return {
    doc,

    blob:
      doc.output('blob'),

    fileName:
      `Painting_Quotation_${safeName}.pdf`,

    quote
  };
}


/* =========================================================
   BUILD PDF
========================================================= */

async function buildQuotationPdf() {

  return renderPreviewToPdf();
}


/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadQuotationPdf() {

  const button =
    document.querySelector(
      '[onclick="downloadQuotationPdf()"]'
    );


  const original =
    button?.innerHTML || '';


  try {

    if (button) {

      button.disabled = true;

      button.innerHTML =
        'Preparing PDF...';
    }


    const {
      doc,
      fileName
    } =
      await buildQuotationPdf();


    doc.save(
      fileName
    );


  } catch (error) {

    console.error(
      'Quotation PDF error:',
      error
    );


    alert(
      error?.message ||
      'Could not generate the quotation PDF. Please try again.'
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.innerHTML =
        original;
    }
  }
}


/* =========================================================
   WHATSAPP SHARE
========================================================= */

async function shareWhatsApp() {

  const shareButton =
    document.querySelector(
      '[onclick="shareWhatsApp()"]'
    );


  const originalButtonHTML =
    shareButton
      ? shareButton.innerHTML
      : '';


  try {

    if (shareButton) {

      shareButton.disabled = true;

      shareButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin text-sm"></i> Preparing PDF...';
    }


    const {
      doc,
      blob,
      fileName,
      quote
    } =
      await buildQuotationPdf();


    const file =
      new File(
        [blob],
        fileName,
        {
          type:
            'application/pdf'
        }
      );


    /*
     * Mobile:
     * Open native share sheet with the
     * actual PDF attached.
     */

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file]
      })
    ) {

      await navigator.share({

        title:
          `Painting Quotation • ${quote.customerName}`,

        text:
          `Painting quotation for ${quote.customerName} — ${money(quote.total)}.`,

        files: [file]

      });

      return;
    }


    /*
     * Desktop:
     * Browser cannot automatically attach a
     * local PDF to WhatsApp Web.
     */

    doc.save(
      fileName
    );


    const whatsappMessage =
      `Hello ${quote.customerName}, ` +
      `your ${quote.scope.toLowerCase()} quotation is ready. ` +
      `Total: ${money(quote.total)}. ` +
      `Please find the attached quotation PDF.`;


    window.open(
      `https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      '_blank'
    );


    alert(
      'The quotation PDF was downloaded and WhatsApp was opened. Please attach the downloaded PDF in WhatsApp.'
    );


  } catch (error) {

    if (
      error &&
      error.name === 'AbortError'
    ) {
      return;
    }


    console.error(
      'Quotation PDF error:',
      error
    );


    alert(
      error?.message ||
      'Could not generate the quotation PDF. Please try again.'
    );


  } finally {

    if (shareButton) {

      shareButton.disabled = false;

      shareButton.innerHTML =
        originalButtonHTML;
    }
  }
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.downloadQuotationPdf =
  downloadQuotationPdf;

window.shareWhatsApp =
  shareWhatsApp;

window.buildQuotationPdf =
  buildQuotationPdf;
