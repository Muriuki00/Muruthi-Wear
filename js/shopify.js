// Loads products from the Shopify Storefront API.
// In Shopify admin, set each product's "Product type" to Food or Clothing.
// Options (Size, Heat...) and variants come straight from Shopify.
const QUERY = `{products(first:48){nodes{id title description productType featuredImage{url}
  options{name values}
  variants(first:100){nodes{id price{amount} selectedOptions{name value}}}}}}`;
const tail = gid => gid.split("/").pop();

export async function fetchShopifyProducts(cfg) {
  const res = await fetch(`https://${cfg.shopifyDomain}/api/${cfg.apiVersion}/graphql.json`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": cfg.storefrontToken},
    body: JSON.stringify({query: QUERY})
  });
  if (!res.ok) throw new Error("Shopify request failed: " + res.status);
  const json = await res.json();
  return json.data.products.nodes.map(p => ({
    id: tail(p.id),
    category: /cloth|wear|apparel/i.test(p.productType) ? "Clothing" : "Food",
    title: p.title,
    description: p.description,
    image: p.featuredImage ? p.featuredImage.url : "",
    options: p.options.filter(o => o.name !== "Title"),
    variants: p.variants.nodes.map(v => ({
      id: tail(v.id), shopifyId: tail(v.id), price: parseFloat(v.price.amount),
      selected: Object.fromEntries(v.selectedOptions.filter(o => o.name !== "Title").map(o => [o.name, o.value]))
    }))
  }));
}
