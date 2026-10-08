// Application bootstrap
function resetCustomerEntry() {
  try {
    localStorage.removeItem('partnerQuotationSession');
    sessionStorage.removeItem('partnerQuotationSession');
  } catch (e) {}

  const nameInput = document.getElementById('customerNameInput');
  const mobileInput = document.getElementById('customerMobileInput');
  const customerAddressInput = document.getElementById('customerAddressInput');
  const siteAddressInput = document.getElementById('siteAddressInput');
  if (nameInput) nameInput.value = '';
  if (mobileInput) mobileInput.value = '';
  if (customerAddressInput) customerAddressInput.value = '';
  if (siteAddressInput) siteAddressInput.value = '';

  customerName = '';
  customerMobile = '';
  customerAddress = '';
  siteAddress = '';
}

// Clear browser-restored form values on both a normal open and a back/forward-cache restore.
resetCustomerEntry();
window.addEventListener('pageshow', function () {
  setTimeout(resetCustomerEntry, 0);
});

window.addEventListener('load', function () {
  resetCustomerEntry();
  const splash = document.getElementById('svgSplashScreen');
  if (!splash) return;
  setTimeout(function () {
    splash.classList.add('splash-hidden');
    setTimeout(function () {
      splash.remove();
      document.getElementById('partnerStartScreen').classList.remove('hidden');
    }, 200);
  }, 1500);
});

init();
