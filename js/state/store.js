// Runtime quotation state
// State
    let isVacant = true;
    let activeRoomIndex = 0;
    let activeAddonType = null;
    let paintScope = 'interior';
    let customerName = '';
    let customerMobile = '';

    let rooms = [
      { 
        name: "Master Bedroom", 
        area: 300, 
        packageIndex: 6, // Premium - Single Coat - With Primer (₹18)
        puttyRate: 0,
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Living Room", 
        area: 450, 
        packageIndex: 6, 
        puttyRate: 0,
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      },
      { 
        name: "Kitchen", 
        area: 160, 
        packageIndex: 1, 
        puttyRate: 0,
        doorSelection: { id: null, width: 3, height: 7, isCustom: false, qty: 1 },
        grillSelection: { id: null, width: 4, height: 4, isCustom: false, qty: 1 }
      }
    ];

window.QuoteState = { get rooms(){return rooms;}, get activeRoomIndex(){return activeRoomIndex;}, get customerName(){return customerName;}, get customerMobile(){return customerMobile;}, get paintScope(){return paintScope;} };
