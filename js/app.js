// Restore an in-progress quotation before initializing the visible form.
const restoredQuoteSession = restoreQuoteSession();
if (restoredQuoteSession) {
  document.getElementById('customerNameInput').value = customerName;
  document.getElementById('customerMobileInput').value = customerMobile;
  document.getElementById('customerAddressInput').value = customerAddress;
  document.getElementById('siteAddressInput').value = siteAddress;
  document.getElementById('customerWelcome').innerText = `Customer: ${customerName} • ${customerMobile}`;
  if (restoredQuoteSession.step === 'scope') {
    document.getElementById('customerStep').classList.remove('active');
    document.getElementById('scopeStep').classList.add('active');
  } else if (restoredQuoteSession.step === 'quote') {
    document.getElementById('partnerStartScreen').classList.add('hidden');
    document.getElementById('estimateScopeTabs').classList.toggle('hidden', paintScope !== 'both');
    document.getElementById('customerMeta').innerText = `${customerName} • ${customerMobile}`;
  }
}

window.addEventListener('load', function () {
  const splash = document.getElementById('svgSplashScreen');
  if (!splash) return;
  setTimeout(function () {
    splash.classList.add('splash-hidden');
    setTimeout(function () {
      splash.remove();
      if (!restoredQuoteSession || restoredQuoteSession.step !== 'quote') {
        document.getElementById('partnerStartScreen').classList.remove('hidden');
      }
    }, 200);
  }, 1500);
});

init();
