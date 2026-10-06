// Door and grill add-on catalog
const ADDON_CATALOG = {
      door: [
        { id: null, name: "No Door Service", sqftRate: 0, desc: "Not required for this room" },
        { id: "door_enamel_1", name: "Door Enamel Single Coat w/o Primer", sqftRate: 15, desc: "Rental touchup (₹15/sq.ft)" },
        { id: "door_enamel_2", name: "Door Enamel Double Coat without Primer", sqftRate: 20, desc: "Standard synthetic enamel (₹20/sq.ft)" },
        { id: "door_enamel_primer", name: "Door Enamel Double Coat with Primer", sqftRate: 26, desc: "Anti-rust primer + 2 coats (₹26/sq.ft)" },
        { id: "door_polish_melamine", name: "Door Melamine Polish (Matt / Glossy)", sqftRate: 38, desc: "Wood sanding + 2 coats melamine (₹38/sq.ft)" },
        { id: "door_polish_pu", name: "Door PU Polish Luxury Finish", sqftRate: 60, desc: "Scratch-resistant polyurethane (₹60/sq.ft)" }
      ],
      grill: [
        { id: null, name: "No Grill Painting", sqftRate: 0, desc: "Not required for this room" },
        { id: "grill_single", name: "Window Grill Single Coat Touchup", sqftRate: 14, desc: "Quick anti-rust coat (₹14/sq.ft)" },
        { id: "grill_double", name: "Window Grill Double Coat Enamel", sqftRate: 22, desc: "Sanding + 2 coats enamel (₹22/sq.ft)" },
        { id: "grill_primer", name: "Window Grill Double Coat with Zinc Primer", sqftRate: 30, desc: "Rust preventive red-oxide + 2 coats (₹30/sq.ft)" }
      ]
    };
window.ADDON_CATALOG = ADDON_CATALOG;
