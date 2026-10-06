// Cart state, saved in the browser. Checkout uses a Shopify cart link.
const KEY = "savanna-cart";
let items = {};
const listeners = [];

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  for (const [id, i] of Object.entries(saved)) {
    if (/^\d+$/.test(id) && Number.isInteger(i.qty) && i.qty > 0 && typeof i.title === "string" && typeof i.price === "number") items[id] = i;
  }
} catch (e) { items = {}; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  listeners.forEach(fn => fn());
}

export const onChange = fn => listeners.push(fn);
export const list = () => Object.entries(items).map(([id, i]) => ({id, ...i}));
export const count = () => list().reduce((n, i) => n + i.qty, 0);
export const subtotal = () => list().reduce((n, i) => n + i.qty * i.price, 0);

export function add(p) {
  const i = items[p.variantId] || {title: p.title, price: p.price, qty: 0};
  i.qty += 1; items[p.variantId] = i; save();
}
export function change(id, delta) {
  if (!items[id]) return;
  items[id].qty += delta;
  if (items[id].qty <= 0) delete items[id];
  save();
}
export function checkoutUrl(domain) {
  if (!list().length || domain.startsWith("your-store")) return null;
  return `https://${domain}/cart/` + list().map(i => `${i.id}:${i.qty}`).join(",");
}
