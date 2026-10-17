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
        area: '', ceilingArea: '', ceilingRate: 6,
        packageIndex: 17, // Premium Emulsion - Double Coat - With Primer (₹18)
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Living Room", 
        area: '', ceilingArea: '', ceilingRate: 6,
        packageIndex: 6, 
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Kitchen", 
        area: '', ceilingArea: '', ceilingRate: 6,
        packageIndex: 1, 
        puttyRate: 0,
        customAddon: { name: '', price: 0 },
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      }
    ];

    let interiorRooms = rooms;
    let exteriorRooms = [{
      name: 'Exterior Walls', area: '', ceilingArea: '', ceilingRate: 6, packageIndex: 0, puttyRate: 0,
      customAddon: { name: '', price: 0 },
      doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
      grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
    }];
    let PACKAGES = INTERIOR_PACKAGES;

function getPackageRate(pkg) {
  return Math.max(0, Number(pkg?.rate) || 0);
}

function getEffectivePaintRate(pkg, puttyRate = 0) {
  return pkg ? getPackageRate(pkg) + (Number(puttyRate) || 0) : 0;
}

const QUOTE_SESSION_KEY = 'partnerQuotationSession';

function saveQuoteSession() {
  try {
    const session = {
      version: 1,
      customerName: document.getElementById('customerNameInput')?.value ?? customerName,
      customerMobile: document.getElementById('customerMobileInput')?.value ?? customerMobile,
      customerAddress: document.getElementById('customerAddressInput')?.value ?? customerAddress,
      siteAddress: document.getElementById('siteAddressInput')?.value ?? siteAddress,
      interiorRooms, exteriorRooms, activeRoomIndex, activeEstimateScope, paintScope,
      isVacant,
      step: document.getElementById('partnerStartScreen')?.classList.contains('hidden') ? 'quote'
        : document.getElementById('scopeStep')?.classList.contains('active') ? 'scope' : 'customer'
    };
    localStorage.setItem(QUOTE_SESSION_KEY, JSON.stringify(session));
  } catch (error) { console.warn('Could not save quotation progress.', error); }
}

function restoreQuoteSession() {
  try {
    const saved = localStorage.getItem(QUOTE_SESSION_KEY);
    if (!saved) return false;
    const session = JSON.parse(saved);
    if (!session || session.version !== 1) return false;
    customerName = session.customerName || '';
    customerMobile = session.customerMobile || '';
    customerAddress = session.customerAddress || '';
    siteAddress = session.siteAddress || '';
    if (Array.isArray(session.interiorRooms)) interiorRooms = session.interiorRooms;
    if (Array.isArray(session.exteriorRooms)) exteriorRooms = session.exteriorRooms;
    [...interiorRooms, ...exteriorRooms].forEach(room => {
      if (![6, 7, 8].includes(Number(room.ceilingRate))) room.ceilingRate = 6;
      if (room.ceilingArea === undefined) room.ceilingArea = '';
    });
    paintScope = ['interior', 'exterior', 'both'].includes(session.paintScope) ? session.paintScope : 'interior';
    activeEstimateScope = session.activeEstimateScope === 'exterior' ? 'exterior' : 'interior';
    activeRoomIndex = Math.max(0, Number(session.activeRoomIndex) || 0);
    isVacant = session.isVacant !== false;
    rooms = activeEstimateScope === 'exterior' ? exteriorRooms : interiorRooms;
    activeRoomIndex = Math.min(activeRoomIndex, Math.max(0, rooms.length - 1));
    PACKAGES = activeEstimateScope === 'exterior' ? EXTERIOR_PACKAGES : INTERIOR_PACKAGES;
    return session;
  } catch (error) {
    console.warn('Could not restore quotation progress.', error);
    return false;
  }
}

window.QuoteState = { get rooms(){return rooms;}, get activeRoomIndex(){return activeRoomIndex;}, get customerName(){return customerName;}, get customerMobile(){return customerMobile;}, get paintScope(){return paintScope;} };

document.addEventListener('input', saveQuoteSession);
document.addEventListener('change', saveQuoteSession);
document.addEventListener('click', () => setTimeout(saveQuoteSession, 0));
window.addEventListener('pagehide', saveQuoteSession);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveQuoteSession(); });
