// Paint package catalog. Rates are per sq.ft.; vacant and furnished prices
// are explicit where the price list provides both.
const INTERIOR_PACKAGES = [
  { name: "Distemper - Tractor Uno - Single Coat - Without Primer", rate: 6 },
  { name: "Distemper - Tractor Uno - Single Coat - With Primer", rate: 7 },
  { name: "Distemper - Tractor Uno - Double Coat - Without Primer - Vacant", rate: 7, vacantOnly: true },
  { name: "Distemper - Tractor Uno - Double Coat - Without Primer", rate: 8, occupiedOnly: true },
  { name: "Distemper - Tractor Uno - Double Coat - With Primer - Vacant", rate: 8, vacantOnly: true },
  { name: "Distemper - Tractor Uno - Double Coat - With Primer", rate: 9, occupiedOnly: true },

  { name: "Tractor Emulsion - Double Coat - With Primer - Vacant", rate: 12, vacantOnly: true },
  { name: "Tractor Emulsion - Single Coat - Without Primer - Vacant", rate: 9, vacantOnly: true },
  { name: "Tractor Emulsion - Double Coat - Without Primer - Vacant", rate: 10, vacantOnly: true },
  { name: "Tractor Emulsion - Single Coat - Without Primer", rate: 10, occupiedOnly: true },
  { name: "Tractor Emulsion - Double Coat - Without Primer", rate: 13, occupiedOnly: true },
  { name: "Tractor Emulsion - Double Coat - With Primer", rate: 14, occupiedOnly: true },

  { name: "Tractor Shyne - Single Coat", rate: 11 },
  { name: "Tractor Shyne - Double Coat", rate: 12 },
  { name: "Tractor Shyne - Double Coat With Primer", rate: 15 },

  { name: "Premium Emulsion - Single Coat - Without Primer", rate: 15 },
  { name: "Premium Emulsion - Double Coat - Without Primer", rate: 16 },
  { name: "Premium Emulsion - Double Coat - With Primer", rate: 18 },

  { name: "Royale - With Primer", rate: 26 },
  { name: "Royale Matte - With Primer", rate: 27 },
  { name: "Royale Shyne", rate: 28 },
  { name: "Royale Aspira", rate: 28 },
  { name: "Royale Glitz", rate: 29 }
];
const EXTERIOR_PACKAGES = [
  { name: "Ace", rate: 14 },
  { name: "Apex", rate: 18 },
  { name: "Ultima", rate: 22 },
  { name: "Ultima Pro", rate: 26 }
];
window.PAINT_PACKAGES = { INTERIOR_PACKAGES, EXTERIOR_PACKAGES };
