// Customer and Interior/Exterior flow
function currentPackages() {
      return paintScope === 'exterior' ? EXTERIOR_PACKAGES : INTERIOR_PACKAGES;
    }


function goToPaintScope() {
      const name = document.getElementById('customerNameInput').value.trim();
      const mobile = document.getElementById('customerMobileInput').value.replace(/\D/g, '');
      const error = document.getElementById('customerError');

      if (!name) {
        error.innerText = 'Please enter the customer name.';
        error.classList.remove('hidden');
        return;
      }

      if (!/^[6-9]\d{9}$/.test(mobile)) {
        error.innerText = 'Please enter a valid 10-digit Indian mobile number.';
        error.classList.remove('hidden');
        return;
      }

      customerName = name;
      customerMobile = mobile;
      customerAddress = document.getElementById('customerAddressInput')?.value.trim() || '';
      siteAddress = document.getElementById('siteAddressInput')?.value.trim() || '';
      error.classList.add('hidden');

      document.getElementById('customerWelcome').innerText = `Customer: ${customerName} • ${customerMobile}`;
      document.getElementById('customerStep').classList.remove('active');
      document.getElementById('scopeStep').classList.add('active');
      selectPaintScope('interior');
    }


function backToCustomerStep() {
      document.getElementById('scopeStep').classList.remove('active');
      document.getElementById('customerStep').classList.add('active');
    }


function backToPaintScopeSelection() {
      const startScreen = document.getElementById('partnerStartScreen');
      const customerStep = document.getElementById('customerStep');
      const scopeStep = document.getElementById('scopeStep');

      // Keep the saved customer details, but return to the Interior / Exterior selection.
      document.getElementById('customerWelcome').innerText = `Customer: ${customerName} • ${customerMobile}`;
      customerStep.classList.remove('active');
      scopeStep.classList.add('active');
      startScreen.classList.remove('hidden');
      selectPaintScope(paintScope || 'interior');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }


function selectPaintScope(scope) {
      paintScope = scope;
      PACKAGES = currentPackages();

      document.getElementById('interiorOption').classList.toggle('selected', scope === 'interior');
      document.getElementById('exteriorOption').classList.toggle('selected', scope === 'exterior');
      document.getElementById('interiorCheck').classList.toggle('hidden', scope !== 'interior');
      document.getElementById('exteriorCheck').classList.toggle('hidden', scope !== 'exterior');

      const note = document.getElementById('scopeNote');
      if (scope === 'exterior') {
        note.innerText = 'Exterior packages: Ace ₹14, Apex ₹18, Ultima ₹22, Ultima Pro ₹26.';
      } else {
        note.innerText = 'Interior package rates are loaded in the Selected Paint Package section.';
      }
    }


function enterQuotation() {
      if (!paintScope) return;

      PACKAGES = currentPackages();
      document.getElementById('partnerStartScreen').classList.add('hidden');
      document.getElementById('customerMeta').innerText = `${customerName} • ${customerMobile}`;
      document.getElementById('headerRoomTitle').innerText = rooms[activeRoomIndex].name;

      if (paintScope === 'interior') {
        rooms.forEach((room, index) => {
          room.packageIndex = Math.min(room.packageIndex, PACKAGES.length - 1);
        });
        renderTabs();
        renderActiveRoom();
        renderPackageList();
      } else {
        renderPackageList();
        renderActiveRoom();
      }
    }


function init() {
      renderTabs();
      renderActiveRoom();
      renderPackageList();
    }
