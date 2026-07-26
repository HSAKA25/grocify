// ----- Shared unit metadata, used by the inventory + shopping list forms -----
// Modelled on how grocery apps (BigBasket, Blinkit, Instacart) let you pick a
// measure instead of typing free text: grouped by Count / Weight / Volume,
// each with a sane quantity step and a few one-tap quick amounts.

const UNIT_GROUPS = [
  {
    label: "Count",
    units: [
      { value: "pcs",   label: "Pieces",  short: "pcs",  step: 1,    quick: [1, 2, 6, 12] },
      { value: "dozen", label: "Dozen",   short: "dz",   step: 1,    quick: [1, 2, 3] },
      { value: "pack",  label: "Pack",    short: "pack", step: 1,    quick: [1, 2, 3] },
      { value: "box",   label: "Box",     short: "box",  step: 1,    quick: [1, 2] },
    ],
  },
  {
    label: "Weight",
    units: [
      { value: "g",  label: "Grams",     short: "g",  step: 25,   quick: [100, 250, 500, 750] },
      { value: "kg", label: "Kilograms", short: "kg", step: 0.25, quick: [0.5, 1, 2, 5] },
    ],
  },
  {
    label: "Volume",
    units: [
      { value: "ml", label: "Millilitres", short: "ml", step: 50,  quick: [250, 500, 1000] },
      { value: "L",  label: "Litres",      short: "L",  step: 0.5, quick: [0.5, 1, 2] },
    ],
  },
];

const UNIT_MAP = Object.fromEntries(
  UNIT_GROUPS.flatMap((g) => g.units).map((u) => [u.value, u])
);

// Fills a <select> with grouped <optgroup>s and selects the given unit
// (falling back to "pcs" for legacy/unknown values already in the DB).
function populateUnitSelect(select, selected = "pcs") {
  select.innerHTML = UNIT_GROUPS.map(
    (group) => `<optgroup label="${group.label}">
      ${group.units
        .map((u) => `<option value="${u.value}">${u.label} (${u.short})</option>`)
        .join("")}
    </optgroup>`
  ).join("");
  select.value = UNIT_MAP[selected] ? selected : "pcs";
}

function unitMeta(unit) {
  return UNIT_MAP[unit] || { value: unit, label: unit, short: unit || "pcs", step: "any", quick: [] };
}

// "500" + "g" -> "500 g", "1.50" + "kg" -> "1.5 kg"
function formatQty(qty, unit) {
  const n = Number(qty) || 0;
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${text} ${unitMeta(unit).short}`;
}

function formatMoney(n) {
  return `₹${(Number(n) || 0).toFixed(2)}`;
}
