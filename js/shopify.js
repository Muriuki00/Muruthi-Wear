// Loads products from the Shopify Storefront API.
// In Shopify admin, set each product's "Product type" to Food or Clothing.
const QUERY = `{products(first:48){nodes{title description productType
  priceRange{minVariantPrice{amount}} featuredImage{url}
  variants(first:1){nodes{id}}}}}`;

export async function fetchShopifyProducts(cfg) {
  const res = await fetch(`https://${cfg.shopifyDomain}/api/${cfg.apiVersion}/graphql.json`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": cfg.storefrontToken},
    body: JSON.stringify({query: QUERY})
  });
  if (!res.ok) throw new Error("Shopify request failed: " + res.status);
  const json = await res.json();
  return json.data.products.nodes.map(p => ({
    variantId: p.variants.nodes[0].id.split("/").pop(),
    category: /cloth|wear|apparel/i.test(p.productType) ? "Clothing" : "Food",
    title: p.title,
    description: p.description.slice(0, 90),
    price: parseFloat(p.priceRange.minVariantPrice.amount),
    image: p.featuredImage ? p.featuredImage.url : ""
  }));
}
