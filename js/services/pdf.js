// Customer-facing PDF generation and WhatsApp handoff.
// IMPORTANT: the PDF is rendered from the same quotation-preview DOM that the
// customer sees. This prevents the shared PDF from drifting into a second template.

const TARGET_WHATSAPP = '917204948579';

function money(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}

function getQuotationNumber() {
  const key = 'dhoondQuotationSequence';
  let seq = parseInt(localStorage.getItem(key) || '124', 10);
  if (!Number.isFinite(seq)) seq = 124;
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
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const under100 = n => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : '');
  const under1000 = n => n < 100 ? under100(n) : `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under100(n % 100)}` : ''}`;
  const parts = [];
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) parts.push(`${under1000(crore)} Crore`);
  if (lakh) parts.push(`${under1000(lakh)} Lakh`);
  if (thousand) parts.push(`${under1000(thousand)} Thousand`);
  if (num) parts.push(under1000(num));
  return parts.join(' ');
}

function calculateQuoteData() {
  const quoteRooms = rooms.map((r, index) => {
    const pkg = PACKAGES[r.packageIndex];
    const paintCost = pkg ? Number(r.area || 0) * (pkg.rate + Number(r.puttyRate || 0)) : 0;
    let addonCost = 0;
    const addons = [];

    const doorSelection = r.doorSelection || {};
    const grillSelection = r.grillSelection || {};
    const d = ADDON_CATALOG.door.find(x => x.id === doorSelection.id);
    if (d && d.sqftRate > 0) {
      const sqft = Number(doorSelection.width || 0) * Number(doorSelection.height || 0) * 2;
      const cost = Math.round(sqft * d.sqftRate) * Number(doorSelection.qty || 1);
      addonCost += cost;
      addons.push({ label: `${doorSelection.qty || 1} × Door`, detail: `${d.name} • ${doorSelection.width} × ${doorSelection.height} ft`, amount: cost });
    }

    const g = ADDON_CATALOG.grill.find(x => x.id === grillSelection.id);
    if (g && g.sqftRate > 0) {
      const sqft = Number(grillSelection.width || 0) * Number(grillSelection.height || 0);
      const cost = Math.round(sqft * g.sqftRate) * Number(grillSelection.qty || 1);
      addonCost += cost;
      addons.push({ label: `${grillSelection.qty || 1} × Grill`, detail: `${g.name} • ${grillSelection.width} × ${grillSelection.height} ft`, amount: cost });
    }

    return {
      index: index + 1,
      name: r.name,
      area: Number(r.area || 0),
      packageName: pkg ? pkg.name : 'Package not selected',
      rate: pkg ? pkg.rate + Number(r.puttyRate || 0) : 0,
      paintCost,
      addons,
      total: paintCost + addonCost
    };
  });

  return {
    customerName: customerName || 'Customer',
    customerMobile: customerMobile || '-',
    scope: paintScope === 'interior' ? 'Interior Painting' : 'Exterior Painting',
    propertyStatus: isVacant ? 'Vacant House' : 'Occupied / Furnished',
    rooms: quoteRooms,
    total: quoteRooms.reduce((sum, r) => sum + r.total, 0)
  };
}

function getCurrentQuoteForPdf() {
  // Prefer the exact quote data currently displayed in Preview.
  if (window.__dhoondPreviewQuote) return window.__dhoondPreviewQuote;

  const quote = calculateQuoteData();
  quote.quotationNo = getQuotationNumber();
  quote.date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return quote;
}

function setPdfRenderingMode(enabled) {
  document.documentElement.classList.toggle('pdf-rendering', enabled);
}

async function ensurePreviewIsReady() {
  const modal = document.getElementById('summaryModal');
  const wasHidden = !modal || modal.classList.contains('hidden');
  if (wasHidden) {
    toggleSummaryModal(true);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  return { modal, wasHidden };
}

async function renderPreviewToPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('PDF generator is still loading. Please try again in a moment.');
  }
  if (!window.html2canvas) {
    throw new Error('PDF preview renderer is still loading. Please try again in a moment.');
  }

  const { modal, wasHidden } = await ensurePreviewIsReady();
  const sheet = modal?.querySelector('.quote-sheet');
  if (!sheet) throw new Error('Quotation preview could not be found.');

  // Clone the visible customer quotation into an off-screen, unconstrained canvas.
  // This is the exact same DOM/CSS as Preview, so the PDF cannot use a different template.
  const clone = sheet.cloneNode(true);
  clone.classList.add('pdf-quote-sheet');
  clone.style.position = 'fixed';
  clone.style.left = '-100000px';
  clone.style.top = '0';
  clone.style.width = '920px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.padding = '28px 30px 22px';
  clone.style.boxSizing = 'border-box';
  clone.style.zIndex = '-1';
  document.body.appendChild(clone);

  setPdfRenderingMode(true);
  let canvas;
  try {
    canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 10000,
      windowWidth: 920
    });
  } finally {
    setPdfRenderingMode(false);
    clone.remove();
    if (wasHidden) toggleSummaryModal(false);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const padding = 5;
  const maxW = pageW - padding * 2;
  const maxH = pageH - padding * 2;

  const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
  const renderW = canvas.width * scale;
  const renderH = canvas.height * scale;
  const x = (pageW - renderW) / 2;
  const y = (pageH - renderH) / 2;

  doc.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', x, y, renderW, renderH, undefined, 'FAST');

  const quote = getCurrentQuoteForPdf();
  const safeName = (quote.customerName || 'Customer').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Customer';
  return {
    doc,
    blob: doc.output('blob'),
    fileName: `Painting_Quotation_${safeName}.pdf`,
    quote
  };
}

async function buildQuotationPdf() {
  return renderPreviewToPdf();
}

async function downloadQuotationPdf() {
  const button = document.querySelector('[onclick="downloadQuotationPdf()"]');
  const original = button?.innerHTML || '';
  try {
    if (button) { button.disabled = true; button.innerHTML = 'Preparing PDF...'; }
    const { doc, fileName } = await buildQuotationPdf();
    doc.save(fileName);
  } catch (error) {
    console.error('Quotation PDF error:', error);
    alert(error?.message || 'Could not generate the quotation PDF. Please try again.');
  } finally {
    if (button) { button.disabled = false; button.innerHTML = original; }
  }
}

async function shareWhatsApp() {
  const shareButton = document.querySelector('[onclick="shareWhatsApp()"]');
  const originalButtonHTML = shareButton ? shareButton.innerHTML : '';

  try {
    if (shareButton) {
      shareButton.disabled = true;
      shareButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm"></i> Preparing PDF...';
    }

    const { doc, blob, fileName, quote } = await buildQuotationPdf();
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // Mobile: native share sheet receives the actual PDF file, so WhatsApp can attach it.
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Painting Quotation • ${quote.customerName}`,
        text: `Painting quotation for ${quote.customerName} — ${money(quote.total)}.`,
        files: [file]
      });
      return;
    }

    // Desktop browsers cannot programmatically attach a local file to WhatsApp Web.
    // Download the exact same PDF and open the customer's chat with a prepared message.
    doc.save(fileName);
    const whatsappMessage =
      `Hello ${quote.customerName}, your ${quote.scope.toLowerCase()} quotation is ready. ` +
      `Total: ${money(quote.total)}. Please find the attached quotation PDF.`;

    window.open(`https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    alert('The exact quotation PDF was downloaded and WhatsApp was opened. Please attach that PDF in WhatsApp on this browser.');
  } catch (error) {
    if (error && error.name === 'AbortError') return;
    console.error('Quotation PDF error:', error);
    alert(error?.message || 'Could not generate the quotation PDF. Please try again.');
  } finally {
    if (shareButton) {
      shareButton.disabled = false;
      shareButton.innerHTML = originalButtonHTML;
    }
  }
}

window.downloadQuotationPdf = downloadQuotationPdf;
window.shareWhatsApp = shareWhatsApp;
window.buildQuotationPdf = buildQuotationPdf;
