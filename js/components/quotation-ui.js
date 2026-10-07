// Main quotation UI and calculations
function setOccupancy(vacant) {
      isVacant = vacant;

      const vacantBtn = document.getElementById('btnVacant');
      const occupiedBtn = document.getElementById('btnOccupied');
      const vacantIcon = document.getElementById('vacantIcon');
      const occupiedIcon = document.getElementById('occupiedIcon');

      vacantBtn.className = vacant
        ? "flex-1 py-2 rounded-lg text-center transition-all bg-white text-[#2196F3] shadow-sm font-bold"
        : "flex-1 py-2 rounded-lg text-center transition-all text-gray-500 hover:text-gray-800";
      occupiedBtn.className = !vacant
        ? "flex-1 py-2 rounded-lg text-center transition-all bg-white text-[#2196F3] shadow-sm font-bold"
        : "flex-1 py-2 rounded-lg text-center transition-all text-gray-500 hover:text-gray-800";

      vacantIcon.className = `fa-solid fa-house-chimney mr-1.5 ${vacant ? 'text-[#2196F3]' : 'text-gray-500'}`;
      occupiedIcon.className = `fa-solid fa-couch mr-1.5 ${!vacant ? 'text-[#2196F3]' : 'text-gray-500'}`;

      renderPackageList();
      renderActiveRoom();
    }


function renderTabs() {
      const container = document.getElementById('roomTabsContainer');
      container.innerHTML = rooms.map((r, i) => `
        <button onclick="switchRoom(${i})" class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
          i === activeRoomIndex 
            ? 'bg-gray-900 text-white shadow-sm' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }">
          ${r.name}
        </button>
      `).join('');
    }


function switchRoom(index) {
      activeRoomIndex = index;
      renderTabs();
      renderActiveRoom();
    }


function renderActiveRoom() {
      const room = rooms[activeRoomIndex];
      const pkg = PACKAGES[room.packageIndex];

      document.getElementById('headerRoomTitle').innerText = room.name;
      document.getElementById('inputRoomArea').value = room.area;

      if (pkg) {
        document.getElementById('displayPackageName').innerText = `${pkg.name} (₹ ${pkg.rate}/sq.ft.)`;
        document.getElementById('displayPackageRate').innerText = `₹ ${pkg.rate + room.puttyRate}/sq.ft. (incl. putty)`;
      } else {
        document.getElementById('displayPackageName').innerText = `${paintScope === 'exterior' ? 'Exterior packages not configured yet' : 'Select a paint package'}`;
        document.getElementById('displayPackageRate').innerText = paintScope === 'exterior' ? 'Add exterior rates to enable package selection' : 'Select a package';
      }

      // Putty styling
      [0, 2, 7].forEach((val, idx) => {
        const el = document.getElementById(`puttyOpt${idx}`);
        if (room.puttyRate === val) {
          el.className = "cursor-pointer border-2 border-[#2196F3] bg-[#F7FBFF]/50 rounded-lg p-2.5 text-center text-xs flex flex-col justify-between";
        } else {
          el.className = "cursor-pointer border border-gray-200 rounded-lg p-2.5 text-center text-xs flex flex-col justify-between text-gray-600";
        }
      });

      // Door Calculations & UI (Doors have 2 sides: sqft = W * H * 2)
      const selectedDoor = ADDON_CATALOG.door.find(d => d.id === room.doorSelection.id) || ADDON_CATALOG.door[0];
      const doorSqftPerUnit = (room.doorSelection.width * room.doorSelection.height) * 2; 
      const singleDoorCost = Math.round(doorSqftPerUnit * selectedDoor.sqftRate);
      const totalDoorCost = singleDoorCost * room.doorSelection.qty;

      document.getElementById('displayDoorName').innerText = selectedDoor.name;
      if (selectedDoor.sqftRate > 0) {
        document.getElementById('displayDoorRate').innerText = `₹ ${selectedDoor.sqftRate}/sq.ft • ₹ ${singleDoorCost}/door • Total: ₹ ${totalDoorCost.toLocaleString('en-IN')}`;
        document.getElementById('displayDoorRate').className = "text-[11px] text-[#2196F3] font-bold mt-0.5";
        document.getElementById('doorConfigBox').classList.remove('hidden');
        document.getElementById('qtyDoorDisplay').innerText = room.doorSelection.qty;
        document.getElementById('doorCalculatedArea').innerText = `${room.doorSelection.width}×${room.doorSelection.height} ft (${doorSqftPerUnit} sq.ft both sides)`;
        updatePresetButtonUI('door');
      } else {
        document.getElementById('displayDoorRate').innerText = "Tap to select treatment";
        document.getElementById('displayDoorRate').className = "text-[11px] text-gray-400 mt-0.5";
        document.getElementById('doorConfigBox').classList.add('hidden');
      }

      // Grill Calculations & UI
      const selectedGrill = ADDON_CATALOG.grill.find(g => g.id === room.grillSelection.id) || ADDON_CATALOG.grill[0];
      const grillSqftPerUnit = (room.grillSelection.width * room.grillSelection.height);
      const singleGrillCost = Math.round(grillSqftPerUnit * selectedGrill.sqftRate);
      const totalGrillCost = singleGrillCost * room.grillSelection.qty;

      document.getElementById('displayGrillName').innerText = selectedGrill.name;
      if (selectedGrill.sqftRate > 0) {
        document.getElementById('displayGrillRate').innerText = `₹ ${selectedGrill.sqftRate}/sq.ft • ₹ ${singleGrillCost}/grill • Total: ₹ ${totalGrillCost.toLocaleString('en-IN')}`;
        document.getElementById('displayGrillRate').className = "text-[11px] text-[#2196F3] font-bold mt-0.5";
        document.getElementById('grillConfigBox').classList.remove('hidden');
        document.getElementById('qtyGrillDisplay').innerText = room.grillSelection.qty;
        document.getElementById('grillCalculatedArea').innerText = `${room.grillSelection.width}×${room.grillSelection.height} ft (${grillSqftPerUnit} sq.ft)`;
        updatePresetButtonUI('grill');
      } else {
        document.getElementById('displayGrillRate').innerText = "Tap to select grill spec";
        document.getElementById('displayGrillRate').className = "text-[11px] text-gray-400 mt-0.5";
        document.getElementById('grillConfigBox').classList.add('hidden');
      }

      const customAddon = room.customAddon || { name: '', price: 0 };
      document.getElementById('inputCustomAddonName').value = customAddon.name || '';
      document.getElementById('inputCustomAddonPrice').value = customAddon.price || '';

      // Total Room Calculation
      const paintingCost = pkg ? room.area * (pkg.rate + room.puttyRate) : 0;
      const customAddonCost = customAddon.name ? Math.max(0, Number(customAddon.price) || 0) : 0;
      const totalAddonCost = (selectedDoor.sqftRate > 0 ? totalDoorCost : 0) + (selectedGrill.sqftRate > 0 ? totalGrillCost : 0) + customAddonCost;
      const totalRoomCost = paintingCost + totalAddonCost;

      let subtotalDetail = room.area === '' ? `Enter area × ₹${pkg.rate + room.puttyRate}/sq.ft` : `${room.area} sq.ft × ₹${pkg.rate + room.puttyRate}/sq.ft`;
      if (totalAddonCost > 0) {
        subtotalDetail += ` + ₹${totalAddonCost.toLocaleString('en-IN')} add-ons`;
      }

      document.getElementById('roomSubtotalLabel').innerText = subtotalDetail;
      document.getElementById('roomSubtotalVal').innerText = `₹ ${totalRoomCost.toLocaleString('en-IN')}`;

      recalcGrandTotal();
    }

function updateCustomAddon() {
      const room = rooms[activeRoomIndex];
      room.customAddon = {
        name: document.getElementById('inputCustomAddonName').value.trim(),
        price: Math.max(0, Number(document.getElementById('inputCustomAddonPrice').value) || 0)
      };
      renderActiveRoom();
    }

    // Set Preset Dimensions


function setPresetSize(type, w, h) {
      const room = rooms[activeRoomIndex];
      const target = type === 'door' ? room.doorSelection : room.grillSelection;
      target.width = w;
      target.height = h;
      target.isCustom = false;
      document.getElementById(`${type}CustomInputs`).classList.add('hidden');
      renderActiveRoom();
    }

    // Toggle Custom Dimensions


function toggleCustomSize(type, isCustom) {
      const room = rooms[activeRoomIndex];
      const target = type === 'door' ? room.doorSelection : room.grillSelection;
      target.isCustom = isCustom;
      if (isCustom) {
        document.getElementById(`${type}CustomInputs`).classList.remove('hidden');
        document.getElementById(type === 'door' ? 'inputDoorWidth' : 'inputGrillWidth').value = target.width;
        document.getElementById(type === 'door' ? 'inputDoorHeight' : 'inputGrillHeight').value = target.height;
      }
      renderActiveRoom();
    }


function updateCustomDim(type) {
      const room = rooms[activeRoomIndex];
      const target = type === 'door' ? room.doorSelection : room.grillSelection;
      const w = parseFloat(document.getElementById(type === 'door' ? 'inputDoorWidth' : 'inputGrillWidth').value) || 1;
      const h = parseFloat(document.getElementById(type === 'door' ? 'inputDoorHeight' : 'inputGrillHeight').value) || 1;
      target.width = Math.max(0.5, w);
      target.height = Math.max(0.5, h);
      renderActiveRoom();
    }


function updatePresetButtonUI(type) {
      const room = rooms[activeRoomIndex];
      const sel = type === 'door' ? room.doorSelection : room.grillSelection;
      
      const activeClass = "py-1.5 px-2 bg-[#F7FBFF] border-2 border-[#2196F3] text-[#2196F3] rounded-lg text-center font-bold";
      const inactiveClass = "py-1.5 px-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-center font-medium";

      if (type === 'door') {
        document.getElementById('doorPreset_3_7').className = (!sel.isCustom && sel.width === 3 && sel.height === 7) ? activeClass : inactiveClass;
        document.getElementById('doorPreset_5_75').className = (!sel.isCustom && sel.width === 5 && sel.height === 7.5) ? activeClass : inactiveClass;
        document.getElementById('doorPreset_custom').className = sel.isCustom ? activeClass : inactiveClass;
      } else {
        document.getElementById('grillPreset_4_4').className = (!sel.isCustom && sel.width === 4 && sel.height === 4) ? activeClass : inactiveClass;
        document.getElementById('grillPreset_6_45').className = (!sel.isCustom && sel.width === 6 && sel.height === 4.5) ? activeClass : inactiveClass;
        document.getElementById('grillPreset_custom').className = sel.isCustom ? activeClass : inactiveClass;
      }
    }


function adjustAddonQty(type, delta) {
      const room = rooms[activeRoomIndex];
      const target = type === 'door' ? room.doorSelection : room.grillSelection;
      target.qty = Math.max(1, target.qty + delta);
      renderActiveRoom();
    }

    // Open/Close Addon Bottom Sheet


function openAddonPicker(type) {
      activeAddonType = type;
      const room = rooms[activeRoomIndex];
      const title = type === 'door' ? "Select Door Treatment" : "Select Grill Specification";
      document.getElementById('addonSheetTitle').innerText = title;

      const currentSelectedId = type === 'door' ? room.doorSelection.id : room.grillSelection.id;
      const options = ADDON_CATALOG[type];

      const container = document.getElementById('addonOptionsContainer');
      container.innerHTML = options.map(opt => `
        <div onclick="selectAddonOption('${opt.id}')" class="px-4 py-3.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition ${
          opt.id === currentSelectedId ? 'bg-[#F7FBFF]/70 text-[#2196F3] font-bold' : ''
        }">
          <div>
            <p class="text-sm font-semibold leading-snug">${opt.name}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">${opt.desc}</p>
          </div>
          <div class="text-right pl-3">
            <span class="text-xs font-bold ${opt.sqftRate > 0 ? 'text-[#2196F3]' : 'text-gray-400'}">
              ${opt.sqftRate > 0 ? '₹ ' + opt.sqftRate + '/sqft' : 'None'}
            </span>
            ${opt.id === currentSelectedId ? '<i class="fa-solid fa-check text-[#2196F3] text-xs block mt-1"></i>' : ''}
          </div>
        </div>
      `).join('');

      document.getElementById('addonPickerSheet').classList.remove('hidden');
    }


function closeAddonPicker() {
      document.getElementById('addonPickerSheet').classList.add('hidden');
    }


function selectAddonOption(id) {
      const room = rooms[activeRoomIndex];
      const optId = id === "null" || !id ? null : id;

      if (activeAddonType === 'door') {
        room.doorSelection.id = optId;
      } else if (activeAddonType === 'grill') {
        room.grillSelection.id = optId;
      }

      closeAddonPicker();
      renderActiveRoom();
    }


function updateRoomArea(val) {
      rooms[activeRoomIndex].area = val === '' ? '' : Math.max(0, parseInt(val) || 0);
      renderActiveRoom();
    }


function adjustArea(delta) {
      rooms[activeRoomIndex].area = Math.max(0, (Number(rooms[activeRoomIndex].area) || 0) + delta);
      renderActiveRoom();
    }


function setPutty(rate) {
      rooms[activeRoomIndex].puttyRate = rate;
      renderActiveRoom();
    }


function openPackagePicker() {
      document.getElementById('sheetTitle').innerText = `${rooms[activeRoomIndex].name} - ${paintScope === 'interior' ? 'Interior' : 'Exterior'} Paint Package`;
      renderPackageList();
      document.getElementById('pickerSheet').classList.remove('hidden');
    }


function closePackagePicker() {
      document.getElementById('pickerSheet').classList.add('hidden');
    }


function selectPackage(idx) {
      rooms[activeRoomIndex].packageIndex = idx;
      closePackagePicker();
      renderActiveRoom();
    }


function renderPackageList() {
      const query = (document.getElementById('searchPackageInput')?.value || '').toLowerCase();
      const container = document.getElementById('packageListContainer');
      const activePkgIdx = rooms[activeRoomIndex].packageIndex;

      if (PACKAGES.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center">
            <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <i class="fa-solid fa-paint-roller text-gray-400"></i>
            </div>
            <p class="font-bold text-sm text-gray-800">Exterior packages not configured yet</p>
            <p class="text-xs text-gray-500 mt-1.5 leading-relaxed">Please add the exterior package names and rates before using this section.</p>
          </div>`;
        return;
      }

      const filtered = PACKAGES.map((pkg, idx) => ({ ...pkg, originalIndex: idx }))
        .filter(item => {
          if (isVacant && item.occupiedOnly) return false;
          if (!isVacant && item.vacantOnly) return false;
          if (query && !item.name.toLowerCase().includes(query)) return false;
          return true;
        });

      container.innerHTML = filtered.map(item => `
        <div onclick="selectPackage(${item.originalIndex})" class="px-4 py-3.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition ${
          item.originalIndex === activePkgIdx ? 'bg-[#F7FBFF]/70 text-[#2196F3] font-bold' : ''
        }">
          <span class="pr-2 leading-relaxed">${item.name} (₹ ${item.rate}/sq.ft.)</span>
          ${item.originalIndex === activePkgIdx ? '<i class="fa-solid fa-check text-[#2196F3] text-sm"></i>' : ''}
        </div>
      `).join('');
    }


function recalcGrandTotal() {
      let grandTotal = 0;
      rooms.forEach(r => {
        const pkg = PACKAGES[r.packageIndex];
        let roomCost = pkg ? r.area * (pkg.rate + r.puttyRate) : 0;

        const d = ADDON_CATALOG.door.find(x => x.id === r.doorSelection.id);
        if (d && d.sqftRate > 0) {
          const doorSqft = (r.doorSelection.width * r.doorSelection.height * 2);
          roomCost += Math.round(doorSqft * d.sqftRate) * r.doorSelection.qty;
        }

        const g = ADDON_CATALOG.grill.find(x => x.id === r.grillSelection.id);
        if (g && g.sqftRate > 0) {
          const grillSqft = (r.grillSelection.width * r.grillSelection.height);
          roomCost += Math.round(grillSqft * g.sqftRate) * r.grillSelection.qty;
        }

        if (r.customAddon && r.customAddon.name) {
          roomCost += Math.max(0, Number(r.customAddon.price) || 0);
        }

        grandTotal += roomCost;
      });
      document.getElementById('grandTotalText').innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;
    }


function copyToAllRooms() {
      const currentPkg = rooms[activeRoomIndex].packageIndex;
      const currentPutty = rooms[activeRoomIndex].puttyRate;
      rooms.forEach(r => {
        r.packageIndex = currentPkg;
        r.puttyRate = currentPutty;
      });
      renderActiveRoom();
      alert(`Applied current paint spec to all spaces.`);
    }


function addNewRoomPrompt() {
      const name = prompt("Enter space name (e.g., Balcony, Kids Room, Guest Bedroom):");
      if (name && name.trim()) {
        rooms.push({
          name: name.trim(),
          area: '',
          packageIndex: rooms[activeRoomIndex].packageIndex,
          puttyRate: 0,
          doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
          grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
        });
        activeRoomIndex = rooms.length - 1;
        renderTabs();
        renderActiveRoom();
      }
    }
