// Premium branded PDF generation + WhatsApp handoff
const BRAND = {
  blue: [33, 150, 243],
  dark: [20, 35, 48],
  muted: [93, 105, 115],
  light: [245, 248, 251],
  border: [224, 230, 235],
  accent: [255, 181, 71],
  white: [255, 255, 255]
};

const TARGET_WHATSAPP = '917204948579';

function money(value) {
  return `₹ ${Math.round(value).toLocaleString('en-IN')}`;
}

function pdfText(doc, value, x, y, size = 9, style = 'normal', color = BRAND.dark, align = 'left') {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(value ?? ''), x, y, { align });
}

function roundedBox(doc, x, y, w, h, fill, radius = 3, stroke = null) {
  doc.setFillColor(...fill);
  if (stroke) doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, radius, radius, stroke ? 'FD' : 'F');
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

  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function under100(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : '');
  }
  function under1000(n) {
    if (n < 100) return under100(n);
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under100(n % 100)}` : ''}`;
  }

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

function getLogoDataUrl() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1200 / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = 'assets/images/dhoond-logo.png';
  });
}

function getQuoteData() {
  const quoteRooms = rooms.map((r, index) => {
    const pkg = PACKAGES[r.packageIndex];
    const paintCost = pkg ? r.area * (pkg.rate + r.puttyRate) : 0;
    let addonCost = 0;
    const addons = [];

    const d = ADDON_CATALOG.door.find(x => x.id === r.doorSelection.id);
    if (d && d.sqftRate > 0) {
      const sqft = r.doorSelection.width * r.doorSelection.height * 2;
      const cost = Math.round(sqft * d.sqftRate) * r.doorSelection.qty;
      addonCost += cost;
      addons.push({
        label: `${r.doorSelection.qty} × Door`,
        detail: `${d.name} • ${r.doorSelection.width} × ${r.doorSelection.height} ft`,
        amount: cost
      });
    }

    const g = ADDON_CATALOG.grill.find(x => x.id === r.grillSelection.id);
    if (g && g.sqftRate > 0) {
      const sqft = r.grillSelection.width * r.grillSelection.height;
      const cost = Math.round(sqft * g.sqftRate) * r.grillSelection.qty;
      addonCost += cost;
      addons.push({
        label: `${r.grillSelection.qty} × Grill`,
        detail: `${g.name} • ${r.grillSelection.width} × ${r.grillSelection.height} ft`,
        amount: cost
      });
    }

    return {
      index: index + 1,
      name: r.name,
      area: r.area,
      packageName: pkg ? pkg.name : 'Package not selected',
      rate: pkg ? pkg.rate + r.puttyRate : 0,
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
    quotationNo: getQuotationNumber(),
    date: formatDate(),
    rooms: quoteRooms,
    total: quoteRooms.reduce((sum, r) => sum + r.total, 0)
  };
}

async function buildQuotationPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('PDF generator is still loading. Please try again in a moment.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 13;
  const contentWidth = pageWidth - margin * 2;
  const quote = getQuoteData();
  const logo = await getLogoDataUrl();

  let y = 13;

  // Header
  if (logo) {
    doc.addImage(logo, 'PNG', margin, y, 54, 12.8);
  } else {
    pdfText(doc, 'Dhoond', margin, y + 9, 19, 'bold', BRAND.blue);
  }

  pdfText(doc, 'PAINTING QUOTATION', pageWidth - margin, y + 5, 12, 'bold', BRAND.dark, 'right');
  pdfText(doc, `${quote.scope}  •  ${quote.propertyStatus}`, pageWidth - margin, y + 11, 7.5, 'normal', BRAND.muted, 'right');

  y += 20;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);
  y += 9;

  // Quote metadata
  const metaW = contentWidth / 3;
  [
    ['Quotation No.', quote.quotationNo],
    ['Date', quote.date],
    ['Property', quote.propertyStatus]
  ].forEach((item, i) => {
    const x = margin + i * metaW;
    pdfText(doc, item[0], x, y, 7.2, 'normal', BRAND.muted);
    pdfText(doc, item[1], x, y + 5.2, 9.2, 'bold', BRAND.dark);
  });

  y += 16;

  // Customer card
  roundedBox(doc, margin, y, contentWidth, 22, BRAND.light, 3);
  pdfText(doc, 'CUSTOMER', margin + 6, y + 7, 7, 'bold', BRAND.blue);
  pdfText(doc, quote.customerName, margin + 6, y + 14, 11, 'bold', BRAND.dark);
  pdfText(doc, quote.customerMobile, margin + 6, y + 18.5, 7.8, 'normal', BRAND.muted);

  const dividerX = margin + contentWidth * 0.52;
  doc.setDrawColor(...BRAND.border);
  doc.line(dividerX, y + 4, dividerX, y + 18);

  pdfText(doc, 'SERVICE', dividerX + 7, y + 7, 7, 'bold', BRAND.blue);
  pdfText(doc, quote.scope, dividerX + 7, y + 14, 10, 'bold', BRAND.dark);
  pdfText(doc, quote.propertyStatus, dividerX + 7, y + 18.5, 7.8, 'normal', BRAND.muted);

  y += 30;

  // Section title
  pdfText(doc, 'PROJECT ESTIMATE', margin, y, 13, 'bold', BRAND.dark);
  pdfText(doc, 'Room-wise pricing based on the selected paint package', margin, y + 5.5, 7.5, 'normal', BRAND.muted);
  y += 12;

  // Table
  const col = {
    no: margin,
    room: margin + 10,
    package: margin + 55,
    area: margin + 112,
    rate: margin + 137,
    amount: pageWidth - margin
  };

  roundedBox(doc, margin, y, contentWidth, 9, BRAND.dark, 2.5);
  pdfText(doc, '#', col.no + 3, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
  pdfText(doc, 'SPACE', col.room, y + 5.8, 7.2, 'bold', BRAND.white);
  pdfText(doc, 'PACKAGE', col.package, y + 5.8, 7.2, 'bold', BRAND.white);
  pdfText(doc, 'AREA', col.area + 7, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
  pdfText(doc, 'RATE', col.rate + 2, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
  pdfText(doc, 'AMOUNT', col.amount - 3, y + 5.8, 7.2, 'bold', BRAND.white, 'right');
  y += 9;

  quote.rooms.forEach((room) => {
    const baseH = 19;
    const addonH = room.addons.length * 8;
    const rowH = baseH + addonH;

    if (y + rowH > pageHeight - 42) {
      doc.addPage();
      y = 15;
      roundedBox(doc, margin, y, contentWidth, 9, BRAND.dark, 2.5);
      pdfText(doc, '#', col.no + 3, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
      pdfText(doc, 'SPACE', col.room, y + 5.8, 7.2, 'bold', BRAND.white);
      pdfText(doc, 'PACKAGE', col.package, y + 5.8, 7.2, 'bold', BRAND.white);
      pdfText(doc, 'AREA', col.area + 7, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
      pdfText(doc, 'RATE', col.rate + 2, y + 5.8, 7.2, 'bold', BRAND.white, 'center');
      pdfText(doc, 'AMOUNT', col.amount - 3, y + 5.8, 7.2, 'bold', BRAND.white, 'right');
      y += 9;
    }

    roundedBox(doc, margin, y, contentWidth, rowH, [252, 253, 254], 0, BRAND.border);

    pdfText(doc, room.index, col.no + 3, y + 9, 7.5, 'bold', BRAND.muted, 'center');
    pdfText(doc, room.name, col.room, y + 7, 8.8, 'bold', BRAND.dark);
    pdfText(doc, `${room.area} sq.ft`, col.room, y + 13, 7, 'normal', BRAND.muted);

    const pkgLines = doc.splitTextToSize(room.packageName, 43);
    pdfText(doc, pkgLines[0], col.package, y + 7, 7.5, 'bold', BRAND.dark);
    if (pkgLines[1]) pdfText(doc, pkgLines[1], col.package, y + 11.5, 7.2, 'normal', BRAND.muted);

    pdfText(doc, room.area, col.area + 7, y + 9, 8, 'bold', BRAND.dark, 'center');
    pdfText(doc, room.rate ? `₹${room.rate}` : '—', col.rate + 2, y + 9, 8, 'bold', BRAND.dark, 'center');
    pdfText(doc, money(room.paintCost), col.amount - 3, y + 9, 8.5, 'bold', BRAND.dark, 'right');

    let ay = y + baseH;
    room.addons.forEach((addon) => {
      doc.setDrawColor(...BRAND.border);
      doc.line(col.room, ay, pageWidth - margin, ay);
      pdfText(doc, addon.label, col.room + 4, ay + 5.2, 7.1, 'bold', BRAND.muted);
      pdfText(doc, addon.detail, col.package, ay + 5.2, 6.7, 'normal', BRAND.muted);
      pdfText(doc, money(addon.amount), col.amount - 3, ay + 5.2, 7.2, 'bold', BRAND.dark, 'right');
      ay += 8;
    });

    y += rowH;
  });

  y += 7;

  // Grand total
  roundedBox(doc, margin, y, contentWidth, 25, [242, 248, 253], 4);
  pdfText(doc, 'GRAND TOTAL', margin + 7, y + 9, 8, 'bold', BRAND.muted);
  pdfText(doc, `${numberToWordsIndian(quote.total)} Rupees Only`, margin + 7, y + 17, 7.3, 'normal', BRAND.muted);

  roundedBox(doc, pageWidth - margin - 57, y + 4, 50, 17, BRAND.blue, 3);
  pdfText(doc, money(quote.total), pageWidth - margin - 32, y + 15, 15, 'bold', BRAND.white, 'center');

  y += 34;

  // Simple footer — intentionally minimal
  doc.setDrawColor(...BRAND.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  pdfText(doc, 'Dhoond • Professional Painting Services', margin, y, 7.5, 'bold', BRAND.dark);
  pdfText(doc, `+91 ${customerMobile || '7204948579'}`, pageWidth - margin, y, 7.5, 'normal', BRAND.muted, 'right');
  pdfText(doc, 'Thank you for choosing Dhoond.', margin, y + 5, 7, 'normal', BRAND.muted);

  return {
    doc,
    blob: doc.output('blob'),
    fileName: `Painting_Quotation_${(customerName || 'Customer').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Customer'}.pdf`,
    quote
  };
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

    // Mobile browsers: use the native share sheet with the PDF already attached.
    // WhatsApp can then be selected without asking the user to browse Downloads.
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Painting Quotation • ${quote.customerName}`,
        text: `Painting quotation for ${quote.customerName} — ${money(quote.total)}.`,
        files: [file]
      });
      return;
    }

    // Desktop / browsers without file sharing: download and open the WhatsApp chat.
    doc.save(fileName);
    const whatsappMessage =
      `Hello ${quote.customerName}, your ${quote.scope.toLowerCase()} quotation is ready. ` +
      `Total: ${money(quote.total)}. Please find the attached quotation PDF.`;

    window.open(
      `https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`,
      '_blank'
    );

    alert(
      'The PDF was downloaded and WhatsApp was opened. ' +
      'On this browser, attaching a local file to WhatsApp cannot be automated.'
    );
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

window.shareWhatsApp = shareWhatsApp;
window.buildQuotationPdf = buildQuotationPdf;
