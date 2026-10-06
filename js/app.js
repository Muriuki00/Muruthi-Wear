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

async function loadProducts() {
  if (CONFIG.storefrontToken) {
    try { return await fetchShopifyProducts(CONFIG); }
    catch (err) { console.warn("Shopify failed, using local products.", err); }
  }
  const res = await fetch("data/products.json");
  if (!res.ok) throw new Error("Could not load data/products.json");
  return res.json();
}

function card(p) {
  const img = el("img", {src: p.image || PLACEHOLDER, alt: p.title, width: "400", height: "300", loading: "lazy"});
  img.addEventListener("error", () => { img.src = PLACEHOLDER; }, {once: true});
  return el("article", {class: "card"}, img,
    el("div", {class: "info"},
      el("span", {class: "tag"}, p.category === "Food" ? "Food and drink" : "Clothing"),
      el("h3", {}, p.title),
      el("p", {}, p.description),
      el("div", {class: "row"},
        el("span", {class: "price"}, money(p.price)),
        el("button", {class: "add", type: "button", onclick: () => { cart.add(p); setDrawer(true); }}, "Add to cart"))));
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
