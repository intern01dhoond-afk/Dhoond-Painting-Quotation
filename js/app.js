// Application bootstrap
window.addEventListener('load', function () {
  const splash = document.getElementById('svgSplashScreen');
  if (!splash) return;
  setTimeout(function () {
    splash.classList.add('splash-hidden');
    setTimeout(function () {
      splash.remove();
      if (loadPartnerSession()) {
        enterQuotation();
      } else {
        document.getElementById('partnerStartScreen').classList.remove('hidden');
      }
    }, 200);
  }, 1500);
});

init();
