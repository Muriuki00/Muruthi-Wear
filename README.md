# Savanna Pantry

Static store. No build step. Products come from `data/products.json` until Shopify is connected.

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000 (file:// will not work).

## Publish
GitHub repo > Settings > Pages > Deploy from branch `main` / root.

## Add a product
Open `data/products.json` and copy an existing product block. Fields:
- `id`: unique, lowercase, no spaces (e.g. `chilli-oil`). Also the photo's file name.
- `category`: `"Food"` or `"Clothing"` (exactly). This controls the filter buttons.
- `title`, `description`, `price` (AUD, number, no $ sign).
- `image`: `assets/images/products/<id>.jpg`
- `options` (optional): choices shown in the pop-up. Each option has a `name` and `values`.
  - Plain choices: `{"name": "Heat", "values": ["Mild", "Chilli"]}`
  - Choices that change the price: `{"name": "Size", "values": [{"label": "100g", "price": 6.5}, {"label": "1kg", "price": 45}]}`

Mind the commas: every product block is followed by a comma except the last one.

## Upload photos
Add the image to `assets/images/products/` (GitHub: Add file > Upload files). JPG or WebP, about 800px wide, under 200 KB. File name must match the `image` path. No photo = shuka placeholder.

## Colours
`css/styles.css`, top block `:root{ ... }` (light) and the dark-mode block under it:
`--red` buttons and accents, `--green` tags and selected states, `--bg` page, `--ink` text, `--card` cards.

## Text
- Page text (banner, headline, delivery points, footer): `index.html`
- Product text and prices: `data/products.json`
- Cart and pop-up wording: `js/app.js` (search for e.g. "Add to cart")
- Fonts: the Google Fonts link in `index.html` and `--font-head` / `--font-body` in `css/styles.css`

## Connect Shopify
1. Shopify admin: create a custom app, enable Storefront API read access, copy the Storefront token.
2. Edit `js/config.js`: `shopifyDomain` and `storefrontToken`.
3. Set each product's Product type to `Food` or `Clothing`. Options, prices, photos and variants come from Shopify.
4. Checkout opens your Shopify checkout with the cart items. Test with a real order.
Never commit an Admin API token.
