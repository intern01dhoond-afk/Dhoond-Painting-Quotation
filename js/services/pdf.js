// js/services/pdf.js
// Customer-facing PDF generation and WhatsApp handoff. Both actions use one builder.
const TARGET_WHATSAPP = '917204948579';
const PDF_W = 794;
const PDF_H = 1123;

function money(value) { return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`; }
function esc(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function getQuotationNumber() {
  const key = 'dhoondQuotationSequence';
  let n = parseInt(localStorage.getItem(key) || '124', 10);
  if (!Number.isFinite(n)) n = 124;
  n += 1; localStorage.setItem(key, String(n));
  return `QTN-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}
function formatDate(date = new Date()) { return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function numberToWordsIndian(value) {
  let n = Math.round(Number(value) || 0); if (!n) return 'Zero';
  const o = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const u100 = x => x < 20 ? o[x] : `${t[Math.floor(x / 10)]}${x % 10 ? `-${o[x % 10]}` : ''}`;
  const u1000 = x => x < 100 ? u100(x) : `${o[Math.floor(x / 100)]} Hundred${x % 100 ? ` ${u100(x % 100)}` : ''}`;
  const parts = [], crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${u1000(crore)} Crore`); if (lakh) parts.push(`${u1000(lakh)} Lakh`);
  if (thousand) parts.push(`${u1000(thousand)} Thousand`); if (n) parts.push(u1000(n));
  return parts.join(' ');
}
const PDF_ASSET_BASE = document.currentScript?.src
  ? new URL('../../', document.currentScript.src)
  : new URL('/', document.baseURI);
function asset(path) { return new URL(path, PDF_ASSET_BASE).href; }
function ensurePreviewIsReady() {
  const modal = document.getElementById('summaryModal');
  if (!modal) throw new Error('Quotation preview could not be found.');
  const wasHidden = modal.classList.contains('hidden');
  if (wasHidden) toggleSummaryModal(true);
  return { modal, wasHidden };
}
function normalizeQuote(q) {
  const rooms = (q.quoteRooms || q.rooms || []).map((r, i) => ({
    index: Number(r.index) || i + 1, name: String(r.name || `Room ${i + 1}`), area: Number(r.area) || 0,
    packageName: String(r.pkg || r.packageName || ''), rate: Number(r.rate) || 0,
    amount: Number(r.amount ?? r.paintCost ?? ((Number(r.area) || 0) * (Number(r.rate) || 0))) || 0,
    addons: Array.isArray(r.addons) ? r.addons.map(a => ({ label: String(a.label || a.name || 'Add-on'), detail: String(a.detail || ''), amount: Number(a.amount) || 0 })) : []
  }));
  return {
    quotationNo: String(q.quotationNo || window.__dhoondQuotationNumber || getQuotationNumber()),
    date: String(q.date || formatDate()), customerName: String(q.customerName || 'Customer').trim(),
    customerMobile: String(q.customerMobile || '').trim(), customerAddress: String(q.customerAddress || '').trim(),
    scope: String(q.scope || 'Interior Painting'), propertyStatus: String(q.propertyStatus || 'Vacant House'),
    siteAddress: String(q.siteAddress || '').trim(), rooms, total: Math.round(Number(q.total) || 0)
  };
}
function estimateLines(q) {
  const lines = [];
  q.rooms.forEach(r => {
    if (r.area > 0 && r.packageName) lines.push({ kind: 'paint', roomIndex: r.index, roomName: r.name, area: r.area, packageName: r.packageName, rate: r.rate, amount: r.amount });
    r.addons.forEach(a => lines.push({ kind: 'addon', roomIndex: r.index, roomName: r.name, label: a.label, detail: a.detail, amount: a.amount }));
  });
  return lines;
}
function estimateRow(line, index) {
  if (line.kind === 'addon') return `<tr class="addon-row"><td></td><td colspan="3"><strong>${esc(line.label)}</strong><span class="addon-detail">${esc(line.detail)}${line.roomName ? ` · ${esc(line.roomName)}` : ''}</span></td><td class="center">—</td><td class="amount">${money(line.amount)}</td></tr>`;
  const p = line.packageName.split(' - ');
  return `<tr class="paint-row"><td class="center">${index + 1}</td><td><strong>${esc(line.roomName)}</strong><small>${esc(line.area.toLocaleString('en-IN'))} sq.ft</small></td><td><strong>${esc(p[0])}</strong><small>${esc(p.slice(1).join(' · ') || 'Selected package')}</small></td><td class="center">${esc(line.area.toLocaleString('en-IN'))}<small>sq.ft</small></td><td class="center">${money(line.rate)}</td><td class="amount">${money(line.amount)}</td></tr>`;
}
function estimateTable(lines, { showTotal = false, total = 0 } = {}) {
  const rows = lines.length ? lines.map(estimateRow).join('') : '<tr><td class="empty-row" colspan="6">No priced room areas or add-on services were selected.</td></tr>';
  const totalHtml = showTotal ? `<div class="grand-total"><div><strong>Grand Total</strong><small>Inclusive of all applicable charges</small></div><b><strong>${money(total)}</strong><small>${esc(numberToWordsIndian(total))} Rupees Only</small></b></div>` : '';
  return `<table class="estimate-table"><colgroup><col style="width:6%"><col style="width:23%"><col style="width:29%"><col style="width:13%"><col style="width:12%"><col style="width:17%"></colgroup><thead><tr><th>#</th><th>Room / Area</th><th>Package Details</th><th>Area</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>${totalHtml}`;
}
function footer(page, pages) {
  return `<footer class="page-footer"><img src="${asset('assets/images/dhoond-logo-black.png')}" alt="Dhoond"><div class="contact"><b>+91 72094 84579</b><span>hello@dhoond.co</span><span>www.dhoond.co</span></div><div class="thanks">Thank you<br>for choosing Dhoond!</div><small>Page ${page} of ${pages}</small></footer>`;
}
function smallHeader(q, continued = false) {
  return `<div class="small-header"><img src="${asset('assets/images/dhoond-logo-black.png')}" alt="Dhoond"><div><span>${continued ? 'PROJECT ESTIMATE · CONTINUED' : 'PAINTING QUOTATION'}</span><b>${esc(q.quotationNo)} &nbsp; | &nbsp; ${esc(q.date)}</b></div></div>`;
}
function customerDetails(q) {
  const card = (title, icon, rows) => `<section class="detail-card"><h3><i>${icon}</i>${title}</h3>${rows.filter(([, v]) => v).map(([k, v]) => `<p><span>${esc(k)}</span><b>${esc(v)}</b></p>`).join('')}</section>`;
  return `<div class="detail-grid">${card('Customer Details', '01', [['Name', q.customerName], ['Mobile', q.customerMobile], ['Address', q.customerAddress]])}${card('Service Details', '02', [['Service', q.scope], ['Property', q.propertyStatus], ['Site address', q.siteAddress]])}</div>`;
}
function firstPage(q, lines, page, pages, showTotal) {
  return `<article class="pdf-page page-one"><main class="page-content">
    <section class="hero"><div class="hero-copy"><img class="hero-logo" src="${asset('assets/images/dhoond-logo-black.png')}" alt="Dhoond — Kar toh Dekho!"><p class="hero-promise-intro">Professional Painting Services<br>for Cleaner, Brighter Homes</p><div class="categories">INTERIOR <i></i> EXTERIOR <i></i> VACANT HOUSE</div><h1>PAINTING<br><span>QUOTATION</span></h1><p class="quality">Quality Work <b>·</b> Trusted Professionals <b>·</b> Hassle-Free Experience</p></div><img class="hero-photo" src="${asset('assets/images/quotation-hero.jpg')}" alt="Freshly painted living room"></section>
    <section class="meta"><div><i>Q</i><span><small>Quotation No.</small><b>${esc(q.quotationNo)}</b></span></div><div><i>D</i><span><small>Date</small><b>${esc(q.date)}</b></span></div><div><i>⌂</i><span><small>Property Type</small><b>${esc(q.propertyStatus)}</b></span></div></section>
    ${customerDetails(q)}
    <section class="estimate"><div class="section-heading"><h2>Project Estimate</h2><span>Room-wise pricing based on the selected paint package</span></div>${estimateTable(lines, { showTotal, total: q.total })}${!showTotal ? '<p class="continue-note">Additional estimate items continue on the next page.</p>' : ''}</section>
  </main>${footer(page, pages)}</article>`;
}
function continuationPage(q, lines, page, pages, showTotal) {
  return `<article class="pdf-page continuation-page"><main class="page-content">${smallHeader(q, true)}<div class="continued-intro"><h1>Room-wise estimate</h1><p>${esc(q.customerName)} · ${esc(q.quotationNo)}</p></div>${estimateTable(lines, { showTotal, total: q.total })}<p class="estimate-note">Pricing reflects the selected room areas, paint packages and add-ons shown in this quotation.</p></main>${footer(page, pages)}</article>`;
}
const PROCESS = [
  ['01', 'Surface Preparation', 'assets/images/quotation-process-preparation.jpg', 'Preparing the wall surface', ['Clean, sand and prepare the surface', 'Patch minor cracks within scope', 'Protect nearby fittings and floors']],
  ['02', 'Primer & Putty', 'assets/images/quotation-process-primer.jpg', 'Applying primer and wall preparation', ['Apply putty when included in scope', 'Use primer as per selected package', 'Allow coats to dry before the next step']],
  ['03', 'Painting', 'assets/images/quotation-process-painting.jpg', 'Applying finish paint with a roller', ['Apply selected paint and shade', 'Follow the coat count in the package', 'Finish edges and details carefully']],
  ['04', 'Final Inspection', 'assets/images/quotation-process-inspection.jpg', 'Painter checking a wall finish', ['Review completed surfaces together', 'Touch up agreed items if required', 'Clean the site after completion']]
];
const COMPARISON = [
  ['Quotation', 'Room-wise areas, packages and rates are listed in this quote.', 'Ask each provider for a room-wise breakdown and written final price.'],
  ['Transparency', 'Selected package, add-ons and total are itemised here.', 'Confirm inclusions, exclusions, taxes and additional charges.'],
  ['Paint Packages', 'The selected product package and rate appear by room.', 'Compare available brands, coats and primer coverage.'],
  ['Project Team', 'Painting labour and supervision are included in this scope.', 'Ask who will attend and how the project team is assigned.'],
  ['Customer Support', 'Contact Dhoond directly using the details below.', 'Confirm your support contact and response channel.'],
  ['Final Inspection', 'Site cleaning after completion is included in this scope.', 'Confirm inspection, touch-ups and clean-up in writing.']
];
function processPage(q, page, pages) {
  const cards = PROCESS.map(([n, title, path, alt, bullets]) => `<article class="process-card"><img src="${asset(path)}" alt="${esc(alt)}"><b class="step-no">${n}</b><h3>${title}</h3><ul>${bullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('');
  const comparisons = COMPARISON.map(([feature, d, other]) => `<tr><th>${feature}</th><td>${esc(d)}</td><td>${esc(other)}</td></tr>`).join('');
  return `<article class="pdf-page process-page"><main class="page-content">
    ${smallHeader(q)}
    <section class="process-section"><div class="section-heading"><h2>Our Painting Process</h2><span>A clean and professional process for long-lasting results</span></div><div class="process-grid">${cards}</div></section>
    <section class="comparison"><div class="section-heading"><h2>Why Choose Dhoond?</h2><span>Compare the written scope before you book</span></div><table><colgroup><col style="width:20%"><col style="width:39%"><col style="width:41%"></colgroup><thead><tr><th>Feature</th><th>Dhoond</th><th>NoBroker / Urban Company / Aapka Painter</th></tr></thead><tbody>${comparisons}</tbody></table><p class="comparison-note">Provider services vary by city, project and package. Confirm current inclusions, exclusions and terms directly with each provider.</p></section>
    <section class="scope-grid"><article class="scope-card included"><h3><i>✓</i> What’s Included</h3><ul><li>Surface cleaning and preparation</li><li>Primer as per the selected package</li><li>Selected paint and materials</li><li>Basic patch work for minor cracks and holes</li><li>Skilled painting labour and supervision</li><li>Standard tools and site cleaning after completion</li></ul></article><article class="scope-card excluded"><h3><i>×</i> What’s Not Included</h3><ul><li>Major civil repairs, leakage or structural cracks</li><li>Electrical or plumbing work</li><li>Carpentry or false-ceiling work</li><li>Furniture shifting unless agreed</li><li>Texture or designer finishes unless selected</li><li>Additional coats or work outside approved scope</li></ul></article></section>
    <section class="terms-grid"><article><h3>Payment Terms</h3><ul><li>50% advance before work starts.</li><li>40% after painting work is complete.</li><li>10% after final inspection and handover.</li><li>Payments by bank transfer, UPI or agreed method.</li></ul></article><article><h3>Refund & Cancellation Policy</h3><ul><li>Advance is non-refundable once work starts.</li><li>If cancelled before work starts, the advance is refunded after material costs.</li><li>Refunds are processed within 7–10 working days.</li></ul></article><article><h3>Validity & Timeline</h3><ul><li>Valid for 30 days from the date of issue.</li><li>Work commencement depends on approval and schedule.</li><li>Estimated duration: 7–15 days, depending on site size and scope.</li></ul></article></section>
    <p class="terms-note">Final pricing follows the approved scope and measurements. Additional requests need separate confirmation. Paint brand, shade and package specifications are subject to customer approval and availability.</p>
  </main>${footer(page, pages)}</article>`;
}
function addPdfStyles() {
  document.getElementById('dhoond-pdf-page-styles')?.remove();
  const s = document.createElement('style'); s.id = 'dhoond-pdf-page-styles';
  s.textContent = `
    .dhoond-pdf-render-root{position:fixed;left:-10000px;top:0;z-index:-1;width:${PDF_W}px;pointer-events:none}.dhoond-pdf-render-root *{box-sizing:border-box}
    .pdf-page{position:relative;width:${PDF_W}px;height:${PDF_H}px;overflow:hidden;background:#fff;color:#15263b;font:10px/1.28 'Montserrat','Segoe UI',Arial,sans-serif}
    .page-content{padding:34px 40px 92px}.hero{height:184px;display:grid;grid-template-columns:1fr 282px;gap:22px;border-bottom:1px solid #bdc9d5;padding-bottom:16px}
    .hero-copy{position:relative}.hero-logo{display:block;width:148px;height:50px;object-fit:contain;object-position:left center}.hero-promise-intro{position:absolute;top:2px;left:164px;border-left:1px solid #718196;padding-left:13px;margin:0;font-size:10px;line-height:1.35;color:#29394d}
    .categories{position:absolute;right:0;top:57px;font-size:8px;letter-spacing:.6px;white-space:nowrap}.categories i{display:inline-block;height:9px;border-left:1px solid #718196;margin:0 8px -1px}
    .hero h1{margin:7px 0;font:31px/.99 Georgia,'Times New Roman',serif;letter-spacing:-.5px;color:#101d31}.hero h1 span{color:#0876c9}.quality{margin:0;font-size:9px;color:#314155;white-space:nowrap}.quality b{color:#1381d0;padding:0 3px}.hero-photo{width:282px;height:166px;object-fit:cover;object-position:center;align-self:end}
    .meta{height:59px;margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);background:#f1f7fb;border-radius:6px}.meta>div{position:relative;display:flex;align-items:center;gap:9px;padding:8px 12px}.meta>div+div:before{content:'';position:absolute;left:0;top:11px;bottom:11px;border-left:1px solid #d2deea}.meta i,.detail-card h3 i{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#14314b;font-style:normal;font-weight:800;font-size:11px}.meta small,.meta b{display:block}.meta small{color:#66758a;font-size:8.5px;margin-bottom:2px}.meta b{font-size:10.5px}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.detail-card{min-height:91px;padding:9px 11px;border:1px solid #dde6ed;background:linear-gradient(120deg,#f4f8fb,#fff)}.detail-card h3{display:flex;align-items:center;gap:7px;margin:0 0 5px;font:12px Georgia,'Times New Roman',serif}.detail-card h3 i{width:23px;height:23px;background:#e5f1f9;color:#176da9;font:700 8px 'Segoe UI',sans-serif}.detail-card p{display:grid;grid-template-columns:65px 1fr;gap:7px;margin:3px 0;font-size:8.5px;line-height:1.2}.detail-card p span{color:#68778b}.detail-card p b{font-weight:500;overflow-wrap:anywhere}
    .estimate{margin-top:14px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:0 0 8px}.section-heading h2{margin:0;color:#102039;font:20px/1 Georgia,'Times New Roman',serif;text-transform:uppercase}.section-heading>span{font-size:8px;color:#68778a;text-align:right}
    .estimate-table{width:100%;table-layout:fixed;border-collapse:collapse;border:1px solid #cfdae4;font-size:8.6px}.estimate-table th{padding:8px 6px;background:#18394f;color:#fff;text-align:left;font-size:8.2px}.estimate-table td{padding:7px 6px;border:1px solid #d9e1e9;vertical-align:middle;overflow-wrap:anywhere}.estimate-table .paint-row td{height:39px}.estimate-table .addon-row td{height:26px;background:#fbfcfd;font-size:8.2px}.estimate-table td strong{display:block;font-weight:700}.estimate-table td small{display:block;margin-top:2px;color:#66778a;font-size:7.6px;font-weight:400}.center{text-align:center;white-space:nowrap}.amount{text-align:right;white-space:nowrap;font-weight:700}.addon-detail{margin-left:4px;color:#6b798a;font-size:7.6px}.empty-row{padding:18px!important;text-align:center;color:#66778a}.grand-total{display:grid;grid-template-columns:1fr 230px;min-height:62px;margin-top:7px;background:#eaf2f8;border:1px solid #d2e1ec}.grand-total>div{padding:9px 13px}.grand-total>div strong{display:block;font:18px/1.1 Georgia,'Times New Roman',serif}.grand-total small{display:block;margin-top:3px;font-size:7.8px;color:#4e5f73}.grand-total>b{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:8px 13px;background:#164763;color:white;text-align:right}.grand-total>b strong{font-size:21px;line-height:1}.grand-total>b small{color:#fff;font-size:7.2px}.continue-note{text-align:right;color:#68778a;font-size:8px;margin:6px 0}
    .page-footer{position:absolute;left:40px;right:40px;bottom:24px;height:53px;display:flex;align-items:center;gap:13px;border-top:1px solid #aab8c6;padding-top:8px}.page-footer>img{width:89px;height:36px;object-fit:contain;object-position:left}.contact{display:flex;flex-direction:column;gap:1px;padding-left:11px;border-left:1px solid #aab8c6;color:#34465b;font-size:7.8px}.contact b{font-size:8px}.thanks{margin-left:auto;text-align:right;font:italic 13px/1.1 Georgia,serif;color:#132a43}.page-footer>small{position:absolute;right:0;bottom:-14px;color:#68788a;font-size:7px}
    .small-header{height:45px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #aab8c6;padding-bottom:8px}.small-header img{width:111px;height:39px;object-fit:contain;object-position:left}.small-header div{display:flex;flex-direction:column;align-items:flex-end;gap:3px;font-size:8px}.small-header span{color:#56677a;letter-spacing:.4px}.small-header b{font-size:9px}.continued-intro{margin:22px 0 13px}.continued-intro h1{margin:0;font:22px Georgia,serif}.continued-intro p,.estimate-note{margin:4px 0;color:#68788a;font-size:8.5px}
    .process-section{margin-top:14px}.process-section .section-heading h2,.comparison .section-heading h2{font-size:18px;text-transform:none}.process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:8px}.process-card{min-width:0;border-right:1px solid #d6dee7;padding-right:7px}.process-card:last-child{border:0;padding-right:0}.process-card img{display:block;width:100%;height:82px;object-fit:cover;object-position:center 38%}.step-no{display:inline-block;margin-top:5px;padding:2px 5px;background:#0876c9;color:#fff;font-size:8px}.process-card h3{margin:4px 0 3px;font:10px/1.15 Georgia,serif}.process-card ul{margin:0;padding-left:12px}.process-card li{margin:2px 0;font-size:7.4px;line-height:1.23;color:#48586b}
    .comparison{margin-top:12px}.comparison .section-heading{margin-bottom:6px}.comparison table{width:100%;table-layout:fixed;border-collapse:collapse;border:1px solid #d3dde6;font-size:7.7px}.comparison thead th{height:25px;padding:5px 7px;background:#193c55;color:#fff;text-align:left;font-size:7.7px}.comparison thead th:nth-child(2){background:#0876c9;text-align:center}.comparison tbody th,.comparison td{padding:5px 7px;border:1px solid #d8e0e8;line-height:1.17;vertical-align:middle}.comparison tbody th{background:#f1f7fb;text-align:left;font-size:7.8px}.comparison tbody td:nth-child(2){background:#f4f9fd}.comparison tbody td:nth-child(3){color:#4f5f73}.comparison-note{margin:4px 0 0;color:#65758a;font-size:7px;line-height:1.2}
    .scope-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}.scope-card{border:1px solid #d5dfe7;padding:8px 10px}.scope-card.included{border-left:3px solid #16825c;background:#f7fbf9}.scope-card.excluded{border-left:3px solid #b93737;background:#fffafa}.scope-card h3{display:flex;align-items:center;gap:6px;margin:0 0 4px;font:11px Georgia,serif}.scope-card h3 i{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;background:#e3f3ec;color:#087248;font:700 11px Arial,sans-serif}.excluded h3 i{background:#faeaea;color:#b32727}.scope-card ul,.terms-grid ul{margin:0;padding-left:13px}.scope-card li{margin:2px 0;font-size:7.4px;line-height:1.2;color:#46566a}
    .terms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.terms-grid article{border:1px solid #d6dfe7;padding:7px 8px}.terms-grid h3{margin:0 0 4px;font:9px/1.15 Georgia,serif}.terms-grid li{margin:2px 0;color:#495a6d;font-size:7px;line-height:1.17}.terms-note{margin:7px 0 0;border-top:1px solid #d5dfe7;padding-top:5px;color:#637388;font-size:7px;line-height:1.22}.continuation-page .paint-row td{height:45px}
    .estimate-table td small,.addon-detail{font-size:8px}.process-card li{font-size:8.1px;line-height:1.2}.comparison table{font-size:8.2px}.comparison thead th{font-size:8px}.comparison tbody th,.comparison td{line-height:1.2}.comparison tbody th{font-size:8.2px}.comparison-note,.terms-note{font-size:7.7px}.scope-card li{font-size:8.1px}.terms-grid li{font-size:7.8px}.page-footer>small{font-size:7.4px}
  `;
  document.head.appendChild(s);
}
function estimatePages(lines, firstLimit = 12, nextLimit = 16) {
  const groups = [];
  lines.forEach(line => {
    const previous = groups[groups.length - 1];
    if (previous && previous.roomIndex === line.roomIndex) previous.lines.push(line);
    else groups.push({ roomIndex: line.roomIndex, lines: [line] });
  });
  const result = [];
  let page = [], limit = firstLimit;
  groups.forEach(group => {
    if (page.length && page.length + group.lines.length > limit) {
      result.push(page);
      page = [];
      limit = nextLimit;
    }
    page.push(...group.lines);
  });
  if (page.length || !result.length) result.push(page);
  return result;
}
function quotePages(q, lines) {
  const parts = estimatePages(lines), processNo = parts.length + 1, count = processNo + 1;
  const html = [firstPage(q, parts[0], 1, count, parts.length === 1)];
  parts.slice(1).forEach((part, i) => html.push(continuationPage(q, part, i + 2, count, i === parts.length - 2)));
  html.push(processPage(q, processNo, count)); return html;
}
function waitForImage(img) {
  return new Promise((resolve, reject) => {
    const finish = () => img.naturalWidth ? resolve() : reject(new Error(`Quotation image could not be loaded: ${img.currentSrc || img.src}`));
    if (img.complete) { finish(); return; }
    const timeout = setTimeout(() => reject(new Error('Quotation images are taking too long to load. Please try again.')), 12000);
    img.addEventListener('load', () => { clearTimeout(timeout); finish(); }, { once: true });
    img.addEventListener('error', () => { clearTimeout(timeout); reject(new Error(`Quotation image could not be loaded: ${img.src}`)); }, { once: true });
  });
}
async function renderPreviewToPdf() {
  if (!window.jspdf?.jsPDF) throw new Error('PDF generator is still loading. Please try again in a moment.');
  if (!window.html2canvas) throw new Error('PDF page renderer is still loading. Please try again in a moment.');
  const { modal, wasHidden } = ensurePreviewIsReady();
  if (!window.__dhoondPreviewQuote) throw new Error('Quotation details are not ready. Please reopen the preview and try again.');
  const quote = normalizeQuote(window.__dhoondPreviewQuote), lines = estimateLines(quote);
  addPdfStyles();
  const root = document.createElement('div'); root.className = 'dhoond-pdf-render-root'; root.innerHTML = quotePages(quote, lines).join('');
  document.body.appendChild(root);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(Array.from(root.querySelectorAll('img'), waitForImage));
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const pages = Array.from(root.querySelectorAll('.pdf-page'));
    for (let i = 0; i < pages.length; i++) {
      const canvas = await window.html2canvas(pages[i], {
        backgroundColor: '#fff', scale: 2, useCORS: true, allowTaint: false, logging: false,
        imageTimeout: 12000, windowWidth: PDF_W, windowHeight: PDF_H, scrollX: 0, scrollY: 0
      });
      if (i) doc.addPage('a4', 'portrait');
      doc.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      canvas.width = 0; canvas.height = 0;
    }
    const safe = quote.customerName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Customer';
    return { doc, blob: doc.output('blob'), fileName: `Painting_Quotation_${safe}.pdf`, quote };
  } finally { root.remove(); if (wasHidden) modal.classList.add('hidden'); }
}
async function buildQuotationPdf() { return renderPreviewToPdf(); }
async function downloadQuotationPdf() {
  const button = document.querySelector('[onclick="downloadQuotationPdf()"]'), original = button?.innerHTML || '';
  try {
    if (button) { button.disabled = true; button.innerHTML = 'Preparing PDF…'; }
    const { doc, fileName } = await buildQuotationPdf(); doc.save(fileName);
  } catch (error) { console.error('Quotation PDF error:', error); alert(error?.message || 'Could not generate the quotation PDF. Please try again.'); }
  finally { if (button) { button.disabled = false; button.innerHTML = original; } }
}
async function shareWhatsApp() {
  const button = document.querySelector('[onclick="shareWhatsApp()"]'), original = button?.innerHTML || '';
  try {
    if (button) { button.disabled = true; button.innerHTML = 'Preparing PDF…'; }
    const { doc, blob, fileName, quote } = await buildQuotationPdf();
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: `Painting Quotation · ${quote.customerName}`, text: `Painting quotation for ${quote.customerName} — ${money(quote.total)}.`, files: [file] }); return;
    }
    doc.save(fileName);
    const message = `Hello ${quote.customerName}, your ${quote.scope.toLowerCase()} quotation is ready. Total: ${money(quote.total)}. Please find the attached quotation PDF.`;
    window.open(`https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
    alert('The quotation PDF was downloaded and WhatsApp was opened. Please attach the downloaded PDF in WhatsApp.');
  } catch (error) {
    if (error?.name === 'AbortError') return;
    console.error('Quotation PDF error:', error); alert(error?.message || 'Could not generate the quotation PDF. Please try again.');
  } finally { if (button) { button.disabled = false; button.innerHTML = original; } }
}
window.downloadQuotationPdf = downloadQuotationPdf;
window.shareWhatsApp = shareWhatsApp;
window.buildQuotationPdf = buildQuotationPdf;
