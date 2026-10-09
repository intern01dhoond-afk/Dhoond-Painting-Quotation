function formatIndianMoney(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function previewNumberToWordsIndian(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const under100 = n => n < 20 ? ones[n] : tens[Math.floor(n/10)] + (n%10 ? `-${ones[n%10]}` : '');
  const under1000 = n => n < 100 ? under100(n) : `${ones[Math.floor(n/100)]} Hundred${n%100 ? ` ${under100(n%100)}` : ''}`;
  const parts=[];
  const crore=Math.floor(num/10000000); num%=10000000;
  const lakh=Math.floor(num/100000); num%=100000;
  const thousand=Math.floor(num/1000); num%=1000;
  if(crore) parts.push(`${under1000(crore)} Crore`);
  if(lakh) parts.push(`${under1000(lakh)} Lakh`);
  if(thousand) parts.push(`${under1000(thousand)} Thousand`);
  if(num) parts.push(under1000(num));
  return parts.join(' ');
}

function previewFormatDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPreviewQuoteData() {
  let total = 0;
  const quoteRooms = rooms.map((r, index) => {
    const pkg = PACKAGES[r.packageIndex];
    const area = Number(r.area) || 0;
    const hasArea = area > 0;
    const paintCost = pkg && hasArea ? area * (pkg.rate + r.puttyRate) : 0;
    let addonCost = 0;
    const addons = [];
    const d = ADDON_CATALOG.door.find(x => x.id === r.doorSelection.id);
    if (d && d.sqftRate > 0) {
      const cost = Math.round(r.doorSelection.width * r.doorSelection.height * 2 * d.sqftRate) * r.doorSelection.qty;
      addonCost += cost;
      addons.push({ label: `${r.doorSelection.qty} × Door`, detail: `${d.name}`, amount: cost });
    }
    const g = ADDON_CATALOG.grill.find(x => x.id === r.grillSelection.id);
    if (g && g.sqftRate > 0) {
      const cost = Math.round(r.grillSelection.width * r.grillSelection.height * g.sqftRate) * r.grillSelection.qty;
      addonCost += cost;
      addons.push({ label: `${r.grillSelection.qty} × Grill`, detail: `${g.name}`, amount: cost });
    }
    const customAddon = r.customAddon || {};
    const customAddonPrice = Math.max(0, Number(customAddon.price) || 0);
    if (customAddon.name && customAddonPrice > 0) {
      addonCost += customAddonPrice;
      addons.push({ label: customAddon.name, detail: 'Custom add-on', amount: customAddonPrice });
    }
    const row = {
      index: index + 1,
      name: r.name,
      area,
      hasArea,
      pkg: pkg ? pkg.name : '',
      rate: pkg ? pkg.rate + r.puttyRate : 0,
      amount: paintCost,
      addons
    };
    total += paintCost + addonCost;
    return row;
  });
  return {
    quoteRooms,
    total,
    customerName: String(customerName || '').trim(),
    customerMobile: String(customerMobile || '').trim(),
    customerAddress: String(customerAddress || '').trim(),
    siteAddress: String(siteAddress || '').trim(),
    scope: paintScope === 'interior' ? 'Interior Painting' : 'Exterior Painting',
    propertyStatus: isVacant ? 'Vacant House' : 'Occupied / Furnished'
  };
}

function setPreviewField(id, value) {
  const field = document.getElementById(id);
  const text = String(value || '').trim();
  field.textContent = text;

  const row = field.closest('.quote-info-row');
  if (row) row.hidden = !text;

  return Boolean(text);
}

function toggleSummaryModal(show) {
  const modal = document.getElementById('summaryModal');
  if (!show) { modal.classList.add('hidden'); return; }

  const quote = getPreviewQuoteData();
  const quotationNo = window.__dhoondQuotationNumber || (() => {
    try { return getQuotationNumber(); } catch (_) { return 'QTN-2026-00125'; }
  })();
  window.__dhoondQuotationNumber = quotationNo;
  window.__dhoondPreviewQuote = { ...quote, quotationNo, date: formatDate() };

  if (typeof window.renderQuotationPreviewPages === 'function') {
    modal.classList.remove('hidden');
    window.renderQuotationPreviewPages(window.__dhoondPreviewQuote);
    return;
  }

  document.getElementById('previewQuotationNo').textContent = quotationNo;
  document.getElementById('previewDate').textContent = window.__dhoondPreviewQuote.date;
  document.getElementById('previewProperty').textContent = quote.propertyStatus;
  const hasCustomerName = setPreviewField('previewCustomer', quote.customerName);
  const hasCustomerMobile = setPreviewField('previewMobile', quote.customerMobile);
  const hasCustomerAddress = setPreviewField('previewCustomerAddress', quote.customerAddress);
  const hasService = setPreviewField('previewService', quote.scope);
  const hasPropertyStatus = setPreviewField('previewStatus', quote.propertyStatus);
  const hasSiteAddress = setPreviewField('previewSiteAddress', quote.siteAddress);

  const customerBlock = document.getElementById('previewCustomer').closest('.quote-info-block');
  customerBlock.hidden = !hasCustomerName && !hasCustomerMobile && !hasCustomerAddress;
  const serviceBlock = document.getElementById('previewService').closest('.quote-info-block');
  serviceBlock.hidden = !hasService && !hasPropertyStatus && !hasSiteAddress;
  const infoGrid = customerBlock.parentElement;
  const visibleInfoBlocks = Array.from(infoGrid.querySelectorAll('.quote-info-block')).filter(block => !block.hidden);
  infoGrid.classList.toggle('has-one-info-block', visibleInfoBlocks.length === 1);
  infoGrid.hidden = visibleInfoBlocks.length === 0;

  const footerMobile = document.getElementById('previewFooterMobile');
  footerMobile.textContent = quote.customerMobile;
  footerMobile.closest('span').hidden = !quote.customerMobile;
  document.getElementById('previewTotal').textContent = formatIndianMoney(quote.total);
  document.getElementById('previewTotalWords').textContent = 'Inclusive of all applicable charges';

  const visibleRooms = quote.quoteRooms.filter(room =>
    (room.hasArea && room.pkg) || room.addons.length > 0
  );

  document.getElementById('previewRows').innerHTML = visibleRooms.map((room, index) => {
    const hasPaintLine = room.hasArea && room.pkg;
    return `
    <tr>
      <td>${index + 1}</td>
      <td><div class="quote-room-cell"><div><span class="quote-room-name">${room.name}</span>${room.hasArea ? `<span class="quote-room-area">${room.area} sq.ft</span>` : ''}</div></div></td>
      <td>${hasPaintLine ? `<div class="quote-package"><strong>${room.pkg.split(' - ')[0]}</strong><span>${room.pkg.split(' - ').slice(1).join(' · ')}</span></div>` : ''}</td>
      <td>${room.hasArea ? `${room.area}<br><span style="font-weight:400;color:#687b8c">sq.ft</span>` : ''}</td>
      <td>${hasPaintLine ? `₹${room.rate}` : ''}</td>
      <td>${hasPaintLine ? formatIndianMoney(room.amount) : ''}</td>
    </tr>
    ${room.addons.map(a => `<tr class="quote-addon-row"><td></td><td></td><td colspan="2"><span style="font-weight:800">${a.label}</span> <span style="color:#687b8c">${a.detail}</span></td><td></td><td>${formatIndianMoney(a.amount)}</td></tr>`).join('')}
  `;
  }).join('');

  const hasQuotedItems = visibleRooms.length > 0;
  document.querySelector('.official-section-head').hidden = !hasQuotedItems;
  document.querySelector('.official-table-wrap').hidden = !hasQuotedItems;
  document.getElementById('previewTableHint').hidden = !hasQuotedItems;
  document.querySelector('.official-total-card').hidden = !hasQuotedItems;

  modal.classList.remove('hidden');
}
