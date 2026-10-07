// Application bootstrap
window.addEventListener('load', function () {
  // Each page opening starts a new quotation. Discard any session saved by older versions.
  try { localStorage.removeItem('partnerQuotationSession'); } catch (e) {}
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
