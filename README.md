# Baji Market website

A separate, single-page Next.js website.

## Run locally

```sh
npm install
npm run dev
```

Open the Local URL printed by Next.js. Requires Node.js 22.12 or newer.

## Live products from D1

The server reads the existing public Worker endpoint:
`https://market.soumya-pal-webskitters.workers.dev/api/state`

That Worker reads the existing Cloudflare D1 database. No Cloudflare token, database credential, seller session or private state is sent to the browser. `src/lib/catalog.ts` explicitly projects public product and contact fields. Reads are uncached, so reloading the page retrieves current data. Checkout fetches current prices again. An upstream failure shows a retry state instead of demo products.

The existing catalogue stores per-piece prices. A box-selling variant costs `price × itemsPerBox`; an item-selling variant uses `price` directly. Stock is not disclosed by the public API, so availability must be confirmed with the shop.

## WhatsApp buying

Customers select variants, add products, adjust quantities, and click **Order on WhatsApp**. Current prices are fetched again; customers review the updated total and click **Continue to WhatsApp**. The final message is sent only when the customer presses Send in WhatsApp. This website does not collect payments, reserve stock or create D1 order records.

Set the shop WhatsApp number in the existing management app's seller profile, or create `.env.local` with:

```env
SHOP_WHATSAPP=your_international_number
```

Use country code and digits only, without spaces. Restart the dev server after changing environment variables. Checkout stays unavailable while no valid number is configured. The catalogue verified during implementation had no saved WhatsApp number.

## Content and SEO

- Page sections and draft policies: `src/app/page.tsx`
- Brand defaults and FAQs: `src/data/site.ts`
- Live catalogue adapter: `src/lib/catalog.ts`
- Cart and products: `src/components/Storefront.tsx`
- Lenis, mobile navigation and contact: `src/components/Experience.tsx`
- Responsive styling: `src/app/globals.css`

Navigation, collection, bag, About, FAQ, contact, Terms and Privacy are all on `/`. Footer links expand their policy section. Lenis anchor scrolling, entrance animations, hover effects and decorative motion respect reduced-motion preferences.

Before publishing, set `NEXT_PUBLIC_SITE_URL` to the real domain and review the draft policies. Without a configured domain, indexing is disabled. Canonical metadata, Open Graph image, Twitter card, Organization structured data, robots and sitemap are included. All illustrations are local assets; real product images come from the catalogue.

## Cloudflare deployment

The storefront deploys as the separate `baji-market-website` Worker using OpenNext:
https://baji-market-website.soumya-pal-webskitters.workers.dev

```sh
npm run deploy
```

Set `NEXT_PUBLIC_SITE_URL` in `.env.production` to that URL (or the custom domain) before building. Keep `SHOP_WHATSAPP` in `.env.local`; OpenNext includes the server environment in its Worker bundle. Do not commit environment files or `.open-next`. The existing catalogue Worker and D1 database are accessed through the public API and are not modified by this deployment.

`npm run preview` builds and runs the Cloudflare version locally on systems supported by the Workers runtime.

Deployment uses `OPEN_NEXT_DEPLOY=true wrangler deploy` to upload the built bundle directly, avoiding OpenNext's local runtime initialization on macOS 12. The storefront uses uncached catalogue requests and does not configure an incremental cache backend.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Cart tests cover box/piece pricing, rounding, refreshed prices, message contents, invalid quantities, deleted variants and WhatsApp number validation. HTTP checks verify the live catalogue and rendered page. Interactive browser verification was unavailable because the browser tool could not initialize in this environment.

## Order security (Google reCAPTCHA v3)

Register a v3 site at https://www.google.com/recaptcha/admin/create with the production hostname and `localhost` for local testing. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to `.env.local`, using `.env.example` as a reference. Use v3 keys, not v2 or Enterprise-only keys. Set `NEXT_PUBLIC_SITE_URL` to the actual public origin for production hostname verification. Configure the secret on the production server and the public key before building; restart development after changing keys. Never commit the secret.

Clicking Order runs the `place_order` action and posts its token and cart to `/api/checkout`. The server verifies success, action, hostname, token age and a score of at least 0.5 before fetching current prices and generating the WhatsApp link. Missing configuration, failed verification or Google downtime blocks checkout; each retry obtains a new token. Cart changes discard any previously prepared order link. The Google badge remains visible. This protects the website checkout flow; WhatsApp messages are still sent by the customer in WhatsApp.
