// Runtime quotation state
// State
    let isVacant = true;
    let activeRoomIndex = 0;
    let activeAddonType = null;
    let paintScope = 'interior';
    let activeEstimateScope = 'interior';
    let customerName = '';
    let customerMobile = '';
    let customerAddress = '';
    let siteAddress = '';

    let rooms = [
      { 
        name: "Master Bedroom", 
        area: '',
        packageIndex: 6, // Premium - Single Coat - With Primer (₹18)
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Living Room", 
        area: '',
        packageIndex: 6, 
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Kitchen", 
        area: '',
        packageIndex: 1, 
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      }
    ];

    let interiorRooms = rooms;
    let exteriorRooms = [{
      name: 'Exterior Walls', area: '', packageIndex: 0, puttyRate: 0,
      customAddon: { name: '', price: 0 },
      doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
      grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
    }];
    let PACKAGES = INTERIOR_PACKAGES;

function getPackageRate(pkg) {
  return Math.max(0, Number(pkg?.rate) - (isVacant ? 1 : 0));
}

function getEffectivePaintRate(pkg, puttyRate = 0) {
  return pkg ? getPackageRate(pkg) + (Number(puttyRate) || 0) : 0;
}

window.QuoteState = { get rooms(){return rooms;}, get activeRoomIndex(){return activeRoomIndex;}, get customerName(){return customerName;}, get customerMobile(){return customerMobile;}, get paintScope(){return paintScope;} };
