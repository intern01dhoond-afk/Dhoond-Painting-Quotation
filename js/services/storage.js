function savePartnerSession() {
  try {
    localStorage.setItem('partnerQuotationSession', JSON.stringify({ customerName, customerMobile, paintScope }));
  } catch (e) { console.warn('Could not save quotation session locally.', e); }
}

function loadPartnerSession() {
  try {
    const saved = JSON.parse(localStorage.getItem('partnerQuotationSession') || 'null');
    if (!saved || !saved.customerName || !/^[6-9]\d{9}$/.test(saved.customerMobile || '')) return false;
    customerName = saved.customerName;
    customerMobile = saved.customerMobile;
    paintScope = saved.paintScope === 'exterior' ? 'exterior' : 'interior';
    const nameInput = document.getElementById('customerNameInput');
    const mobileInput = document.getElementById('customerMobileInput');
    if (nameInput) nameInput.value = customerName;
    if (mobileInput) mobileInput.value = customerMobile;
    selectPaintScope(paintScope);
    return true;
  } catch (e) { console.warn('Could not load quotation session.', e); return false; }
}
window.SessionStorageService = { savePartnerSession, loadPartnerSession };
