// Cart state, saved in the browser. Checkout uses a Shopify cart link.
const KEY = "savanna-cart-v2";
let items = {};
const listeners = [];

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  for (const [id, i] of Object.entries(saved)) {
    if (Number.isInteger(i.qty) && i.qty > 0 && typeof i.title === "string" && typeof i.price === "number" && typeof i.shopifyId === "string") items[id] = i;
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

// item = {id, shopifyId, title, price}
export function add(item) {
  const i = items[item.id] || {shopifyId: item.shopifyId, title: item.title, price: item.price, qty: 0};
  i.qty += 1; items[item.id] = i; save();
}
export function change(id, delta) {
  if (!items[id]) return;
  items[id].qty += delta;
  if (items[id].qty <= 0) delete items[id];
  save();
}
export function checkoutUrl(domain) {
  const l = list();
  if (!l.length || domain.startsWith("your-store") || !l.every(i => /^\d+$/.test(i.shopifyId))) return null;
  return `https://${domain}/cart/` + l.map(i => `${i.shopifyId}:${i.qty}`).join(",");
}
