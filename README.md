# Savanna Pantry

A simple static store. No build step. Products come from `data/products.json` until Shopify is connected.

## Run it locally
Browsers block ES modules and JSON on `file://`, so use a local server:
`python3 -m http.server 8000` then open http://localhost:8000
(or use the VS Code "Live Server" extension).

## Put it on GitHub and publish it
1. Create a repository on GitHub and upload all these files (or `git push`).
2. Settings > Pages > Deploy from branch > `main` / root.
3. Your site appears at `https://USERNAME.github.io/REPO/`.

## Add or change products and photos
1. Upload the photo to `assets/images/products/` (JPG or WebP, around 800px wide, under 200 KB).
2. Edit `data/products.json`. Each product needs: `variantId`, `category` (`Food` or `Clothing`), `title`, `description`, `price`, `image` (path to the photo).
3. Commit. The site updates in about a minute. A missing photo shows the shuka placeholder.

## Change the look
Colours and fonts are at the top of `css/styles.css`. Text is in `index.html`.

## Connect Shopify
1. In Shopify admin create a custom app, enable the Storefront API (read products), and copy the Storefront token.
2. Edit `js/config.js`: set `shopifyDomain` and `storefrontToken`.
3. Set each Shopify product's Product type to `Food` or `Clothing`.
4. Checkout then opens your Shopify checkout with the cart items. Test with a real order.

Only the Storefront token goes in this repo. Never commit an Admin API token.

## Known limits (next steps)
- One variant per product (no size picker yet).
- No product detail pages, about, contact, or policy pages yet.
- Add security headers (CSP, HSTS) at your host once you move beyond GitHub Pages.
