// Customer and Interior/Exterior flow
function currentPackages() {
      return activeEstimateScope === 'exterior' ? EXTERIOR_PACKAGES : INTERIOR_PACKAGES;
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
      customerAddress = document.getElementById('customerAddressInput').value.trim();
      siteAddress = document.getElementById('siteAddressInput').value.trim();
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
      document.getElementById('bothOption').classList.toggle('selected', scope === 'both');
      document.getElementById('interiorCheck').classList.toggle('hidden', scope !== 'interior');
      document.getElementById('exteriorCheck').classList.toggle('hidden', scope !== 'exterior');
      document.getElementById('bothCheck').classList.toggle('hidden', scope !== 'both');

      const note = document.getElementById('scopeNote');
      if (scope === 'exterior') {
        note.innerText = 'Exterior packages: Ace ₹14, Apex ₹18, Ultima ₹22, Ultima Pro ₹26.';
      } else if (scope === 'both') {
        note.innerText = 'Interior rooms and exterior surfaces are priced separately and combined in one quotation.';
      } else {
        note.innerText = 'Interior package rates are loaded in the Selected Paint Package section.';
      }
    }


function enterQuotation() {
      if (!paintScope) return;

      activeEstimateScope = paintScope === 'exterior' ? 'exterior' : 'interior';
      rooms = activeEstimateScope === 'exterior' ? exteriorRooms : interiorRooms;
      PACKAGES = currentPackages();
      document.getElementById('partnerStartScreen').classList.add('hidden');
      document.getElementById('estimateScopeTabs').classList.toggle('hidden', paintScope !== 'both');
      document.getElementById('customerMeta').innerText = `${customerName} • ${customerMobile}`;
      document.getElementById('headerRoomTitle').innerText = rooms[activeRoomIndex].name;

      rooms.forEach(room => { room.packageIndex = Math.min(room.packageIndex, PACKAGES.length - 1); });
      updateEstimateScopeTabs();
      renderTabs();
      renderActiveRoom();
      renderPackageList();
    }

function updateEstimateScopeTabs() {
  ['interior', 'exterior'].forEach(scope => {
    const button = document.getElementById(`${scope}EstimateTab`);
    const selected = activeEstimateScope === scope;
    button.className = `flex-1 py-2 rounded-lg ${selected ? 'bg-white text-[#2196F3] shadow-sm font-bold' : 'text-gray-500'}`;
  });
}

function switchEstimateScope(scope) {
  if (scope === activeEstimateScope || (scope !== 'interior' && scope !== 'exterior')) return;
  if (activeEstimateScope === 'interior') interiorRooms = rooms;
  else exteriorRooms = rooms;
  activeEstimateScope = scope;
  rooms = scope === 'interior' ? interiorRooms : exteriorRooms;
  PACKAGES = currentPackages();
  rooms.forEach(room => { room.packageIndex = Math.min(room.packageIndex, PACKAGES.length - 1); });
  activeRoomIndex = Math.min(activeRoomIndex, rooms.length - 1);
  updateEstimateScopeTabs();
  document.getElementById('headerRoomTitle').innerText = rooms[activeRoomIndex].name;
  renderTabs();
  renderActiveRoom();
  renderPackageList();
}


function init() {
      renderTabs();
      renderActiveRoom();
      renderPackageList();
    }
