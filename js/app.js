import {CONFIG} from "./config.js";
import {fetchShopifyProducts} from "./shopify.js";
import * as cart from "./cart.js";

const $ = s => document.querySelector(s);
const PLACEHOLDER = "assets/images/placeholder.svg";
const money = n => "A$" + n.toFixed(2);
let products = [], filter = "all";

// Builds elements safely: text is never parsed as HTML.
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  e.append(...kids);
  return e;
}

// Turns a products.json entry into {options:[{name,values}], variants:[{id,shopifyId,price,selected}]}.
// Shopify products already arrive in this shape.
function normalise(p) {
  if (p.variants) return p;
  const opts = (p.options || []).map(o => ({name: o.name, values: o.values.map(v => typeof v === "string" ? {label: v} : v)}));
  let combos = [{}];
  for (const o of opts) combos = combos.flatMap(c => o.values.map(v => ({...c, [o.name]: v})));
  return {...p,
    options: opts.map(o => ({name: o.name, values: o.values.map(v => v.label)})),
    variants: combos.map(c => {
      const picks = Object.values(c), priced = picks.find(v => v.price !== undefined);
      return {id: [p.id, ...picks.map(v => v.label)].join("|"), shopifyId: "",
        price: priced ? priced.price : p.price,
        selected: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.label]))};
    })};
}

async function loadProducts() {
  let list;
  if (CONFIG.storefrontToken) {
    try { list = await fetchShopifyProducts(CONFIG); }
    catch (err) { console.warn("Shopify failed, using local products.", err); }
  }
  if (!list) {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error("Could not load data/products.json");
    list = await res.json();
  }
  return list.map(normalise);
}

function picture(p) {
  const img = el("img", {src: p.image || PLACEHOLDER, alt: p.title, width: "400", height: "300", loading: "lazy"});
  img.addEventListener("error", () => { img.src = PLACEHOLDER; }, {once: true});
  return img;
}

function card(p) {
  const prices = p.variants.map(v => v.price), lo = Math.min(...prices), hi = Math.max(...prices);
  return el("article", {class: "card", onclick: () => openModal(p)}, picture(p),
    el("div", {class: "info"},
      el("span", {class: "tag"}, p.category === "Food" ? "Kenyan goodies" : "Clothing"),
      el("h3", {}, p.title),
      el("p", {}, p.description),
      el("div", {class: "row"},
        el("span", {class: "price"}, (lo < hi ? "From " : "") + money(lo)),
        el("button", {class: "add", type: "button"}, "Details"))));
}

function openModal(p) {
  const modal = $("#modal"), sel = {};
  p.options.forEach(o => { sel[o.name] = o.values[0]; });
  const find = () => p.variants.find(v => p.options.every(o => v.selected[o.name] === sel[o.name]));
  const price = el("span", {class: "price"});
  const addBtn = el("button", {class: "btn", type: "button"}, "Add to cart");
  const update = () => { const v = find(); price.textContent = v ? money(v.price) : "Unavailable"; addBtn.disabled = !v; };
  const groups = p.options.map((o, g) => el("fieldset", {class: "opt"}, el("legend", {}, o.name),
    ...o.values.map((val, i) => {
      const id = `opt-${g}-${i}`;
      const input = el("input", {type: "radio", name: "opt-" + g, id});
      if (i === 0) input.checked = true;
      input.addEventListener("change", () => { sel[o.name] = val; update(); });
      return el("span", {class: "pick"}, input, el("label", {for: id}, val));
    })));
  addBtn.addEventListener("click", () => {
    const v = find(); if (!v) return;
    const extra = Object.values(sel).join(", ");
    cart.add({id: v.id, shopifyId: v.shopifyId, title: p.title + (extra ? ` (${extra})` : ""), price: v.price});
    modal.close(); setDrawer(true);
  });
  modal.replaceChildren(el("div", {class: "sheet"},
    el("button", {class: "chip x", type: "button", onclick: () => modal.close()}, "Close"),
    picture(p),
    el("div", {class: "body"}, el("h2", {}, p.title), el("p", {}, p.description), ...groups, price, addBtn)));
  update();
  modal.showModal();
}

function renderProducts() {
  const shown = products.filter(p => filter === "all" || p.category === filter);
  $("#grid").replaceChildren(...shown.map(card));
}

function renderCart() {
  const lines = cart.list();
  $("#count").textContent = cart.count();
  $("#subtotal").textContent = money(cart.subtotal());
  $("#lines").replaceChildren(...(lines.length ? lines.map(i =>
    el("div", {class: "line"},
      el("div", {}, el("b", {}, i.title), el("div", {class: "note"}, money(i.price) + " each")),
      el("div", {class: "qty"},
        el("button", {type: "button", "aria-label": "Remove one", onclick: () => cart.change(i.id, -1)}, "−"),
        ` ${i.qty} `,
        el("button", {type: "button", "aria-label": "Add one", onclick: () => cart.change(i.id, 1)}, "+")))
  ) : [el("p", {class: "empty"}, "Your cart is empty. Add a product to get started.")]));
}

function setDrawer(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", String(!open));
  if (open) $("#close-cart").focus();
}

$("#modal").addEventListener("click", e => { if (e.target.id === "modal") e.target.close(); });
$("#filters").addEventListener("click", e => {
  const b = e.target.closest("[data-f]"); if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll("[data-f]").forEach(c => c.setAttribute("aria-pressed", String(c === b)));
  renderProducts();
});
$("#open-cart").addEventListener("click", () => setDrawer(true));
$("#close-cart").addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });
$("#checkout").addEventListener("click", () => {
  const url = cart.checkoutUrl(CONFIG.shopifyDomain);
  if (url) location.href = url;
  else $("#msg").textContent = cart.count() ? "Checkout is not connected to Shopify yet. See the README." : "Add a product first.";
});

cart.onChange(renderCart);
renderCart();
loadProducts().then(p => { products = p; renderProducts(); })
  .catch(() => { $("#grid").replaceChildren(el("p", {class: "empty"}, "Products could not be loaded. Please refresh the page.")); });
