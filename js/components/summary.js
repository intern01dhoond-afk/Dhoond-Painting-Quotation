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
  const buildScope = (scopeRooms, packages, scopeLabel) => {
    let scopeTotal = 0;
    const scopeRoomsData = scopeRooms.map((r, index) => {
    const pkg = packages[r.packageIndex];
    const area = Number(r.area) || 0;
    const ceilingArea = Number(r.ceilingArea) || 0;
    const billableArea = area + ceilingArea;
    const hasWallArea = area > 0;
    const hasCeilingArea = ceilingArea > 0;
    const hasArea = billableArea > 0;
    const effectiveRate = getEffectivePaintRate(pkg, r.puttyRate);
    const ceilingRate = [6, 7, 8].includes(Number(r.ceilingRate)) ? Number(r.ceilingRate) : 6;
    const wallCost = pkg && hasWallArea ? area * effectiveRate : 0;
    const ceilingCost = ceilingArea * ceilingRate;
    const paintCost = wallCost + ceilingCost;
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
      scope: scopeLabel,
      name: r.name,
      area,
      ceilingArea,
      ceilingRate,
      ceilingCost,
      billableArea,
      hasArea,
      hasWallArea,
      hasCeilingArea,
      pkg: pkg ? pkg.name : '',
      rate: effectiveRate,
      amount: wallCost,
      addons
    };
    scopeTotal += paintCost + addonCost;
    return row;
  });
    return { label: scopeLabel, quoteRooms: scopeRoomsData, total: scopeTotal };
  };
  const quoteScopes = paintScope === 'both'
    ? [buildScope(interiorRooms, INTERIOR_PACKAGES, 'Interior'), buildScope(exteriorRooms, EXTERIOR_PACKAGES, 'Exterior')]
    : [paintScope === 'exterior'
      ? buildScope(exteriorRooms, EXTERIOR_PACKAGES, 'Exterior')
      : buildScope(interiorRooms, INTERIOR_PACKAGES, 'Interior')];
  const quoteRooms = quoteScopes.flatMap(scope => scope.quoteRooms);
  const total = quoteScopes.reduce((sum, scope) => sum + scope.total, 0);
  return {
    quoteRooms,
    quoteScopes,
    total,
    customerName: String(customerName || '').trim(),
    customerMobile: String(customerMobile || '').trim(),
    customerAddress: String(customerAddress || '').trim(),
    siteAddress: String(siteAddress || '').trim(),
    scope: paintScope === 'both' ? 'Interior & Exterior Painting' : paintScope === 'interior' ? 'Interior Painting' : 'Exterior Painting',
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
  const scopeSubtotals = quote.quoteScopes.length > 1
    ? `${quote.quoteScopes.map(scope => `${scope.label}: ${formatIndianMoney(scope.total)}`).join(' · ')} · `
    : '';
  document.getElementById('previewTotalWords').textContent = `${scopeSubtotals}Inclusive of all applicable charges`;

  const visibleRooms = quote.quoteRooms.filter(room =>
    (room.hasWallArea && room.pkg) || room.hasCeilingArea || room.addons.length > 0
  );

  let lastVisibleScope = '';
  document.getElementById('previewRows').innerHTML = visibleRooms.map((room, index) => {
    const hasPaintLine = room.hasWallArea && room.pkg;
    const hasCeilingLine = room.hasCeilingArea;
    const scopeHeading = room.scope !== lastVisibleScope ? `<tr class="quote-scope-heading"><td colspan="6">${room.scope} estimate</td></tr>` : '';
    lastVisibleScope = room.scope;
    return `
    ${scopeHeading}
    ${hasPaintLine ? `<tr>
      <td>${index + 1}</td>
      <td><div class="quote-room-cell"><div><span class="quote-room-name">${room.name}</span><span class="quote-room-area">Walls ${room.area} sq.ft</span></div></div></td>
      <td><div class="quote-package"><strong>${room.pkg.split(' - ')[0]}</strong><span>${room.pkg.split(' - ').slice(1).join(' · ')}</span></div></td>
      <td>${room.area}<br><span style="font-weight:400;color:#687b8c">sq.ft</span></td>
      <td>₹${room.rate}</td>
      <td>${formatIndianMoney(room.amount)}</td>
    </tr>` : ''}
    ${hasCeilingLine ? `<tr class="quote-addon-row ceiling-quote-row"><td></td><td><span class="quote-room-name">Ceiling Painting</span><span class="quote-room-area">${room.name}</span></td><td><div class="quote-package"><strong>Ceiling Paint</strong><span>${room.name}</span></div></td><td>${room.ceilingArea}<br><span style="font-weight:400;color:#687b8c">sq.ft</span></td><td>₹${room.ceilingRate}</td><td>${formatIndianMoney(room.ceilingCost)}</td></tr>` : ''}
    ${room.addons.map(a => `<tr class="quote-addon-row"><td></td><td></td><td colspan="2"><span style="font-weight:800">${a.label}</span> <span style="color:#687b8c">${a.detail}</span></td><td></td><td>${formatIndianMoney(a.amount)}</td></tr>`).join('')}
  `;
  }).join('');
  const scopeStyle = document.getElementById('quoteScopeHeadingStyle') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'quoteScopeHeadingStyle', textContent: '.quote-scope-heading td{background:#eaf2f8;color:#164763;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:9px 12px}' }));

  const hasQuotedItems = visibleRooms.length > 0;
  document.querySelector('.official-section-head').hidden = !hasQuotedItems;
  document.querySelector('.official-table-wrap').hidden = !hasQuotedItems;
  document.getElementById('previewTableHint').hidden = !hasQuotedItems;
  document.querySelector('.official-total-card').hidden = !hasQuotedItems;

  modal.classList.remove('hidden');
}
