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

## Product queries

Customers select variants, add products and quantities to their bag, provide their name and phone number (required), and optionally email and location. **Place query** performs reCAPTCHA v3 verification and saves the query in the `product query` table through `/api/product-query`. It uses current server-side catalogue prices and stores the selected product/variant names, SKUs, units, quantities and estimated total. No WhatsApp message or payment is created. Successful persistence shows **we will contact you soon**. Errors retain the bag and contact fields. Retries use the same submission ID to avoid duplicates.

Apply `migrations/reviews/0003_product_query.sql` to `REVIEWS_DB` before deploying. The local SQLite adapter initializes the table automatically. Query records and contact details have no public read endpoint. General WhatsApp contact links still use the configured shop number.

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

Tests cover box/piece pricing, rounding, current prices, invalid quantities, query persistence, duplicate submissions, CAPTCHA rejection, and contact validation. HTTP checks verify the live catalogue and rendered page. Interactive browser verification was unavailable because the browser tool could not initialize in this environment.

## Order security (Google reCAPTCHA v3)

Register a v3 site at https://www.google.com/recaptcha/admin/create with the production hostname and `localhost` for local testing. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to `.env.local`, using `.env.example` as a reference. Use v3 keys, not v2 or Enterprise-only keys. Set `NEXT_PUBLIC_SITE_URL` to the actual public origin for production hostname verification. Configure the secret on the production server and the public key before building; restart development after changing keys. Never commit the secret.

Clicking Place query runs the `place_query` action and posts a fresh token, submission ID, cart and contact details to `/api/product-query`. The server verifies success, action, hostname, age and score (at least 0.5) before saving. Missing configuration or failed verification blocks the submission. Login uses separate `customer_login_send` and `customer_login_verify` actions with the same keys.

## Customer phone login

The header supports phone OTP through Supabase Auth. Login remains unavailable until configured; shopping as a guest is unchanged.

1. Create a Supabase project. Enable Phone under Authentication > Providers and configure an SMS provider. See https://supabase.com/docs/guides/auth/phone-login. SMS delivery can incur provider charges.
2. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to `.env.local`, then restart `npm run dev`. Use the project publishable key (or legacy anon key), never a service-role key. Set the same variables in the deployed Worker environment for production.
3. Use six-digit OTP codes. Configure Supabase OTP expiry, resend limits, and rate limits. The UI has a 60-second resend cooldown; Supabase enforces server-side limits.
4. First use Supabase test phone numbers/codes, then verify real SMS delivery, incorrect/expired code handling, session restoration, and sign-out before launch. This implementation does not bypass verification.

Customer sessions use HTTP-only SameSite cookies (Secure over HTTPS); credentials are verified by Supabase. No seller access is granted.

Testimonial copy in `src/data/testimonials.ts` is explicitly marked as sample content. Replace it with approved customer quotes before publication.

## Customer reviews

Reviews use the dedicated Cloudflare D1 database `baji-market-reviews`, bound as `REVIEWS_DB`; the catalogue database is unchanged. Schema lives in `migrations/reviews`.

- Local database: `npx wrangler d1 migrations apply REVIEWS_DB --local`
- Remote database: `npx wrangler d1 migrations apply REVIEWS_DB --remote`
- Deploy the updated Worker with `npm run deploy` to publish the routes and binding.

`Add review` checks the customer session and opens phone login when needed. Successful verification resumes the review form. The API revalidates the customer with Supabase; browser state alone never authorizes a write. Each verified customer can publish or update one review. Public responses include only the display name, rating, review text, ID and timestamps, never phone numbers or authentication IDs. The latest 50 database reviews populate the carousel; loading, empty and error states never show sample quotes. Local development uses a separate local D1 instance, not the remote database.

On macOS 12, which cannot run Cloudflare's local runtime, `next dev` uses `.data/reviews.sqlite` through the installed Python 3 SQLite library. The schema is initialized automatically; records remain local. Supported development systems use Wrangler's local D1 database. Production always uses the separate remote D1 binding.

## Web management

Website content is edited at the seller app's `#/seller/web-management` tab. `src/lib/web-content.ts` fetches `/api/web-content` from the same origin as the product catalog, without credentials or caching. The page renders saved copy, metadata, banner media, gallery items, FAQs and extra sections. Initial content in `src/data/web-content.ts` is a fallback only when the content service cannot be reached. Empty saved lists remain empty. Images uploaded in the manager are served by the catalog Worker; banner Drive videos remain restricted to IDs present in the saved slider list. Testimonials continue using the separate reviews database.

### Customer profile fields

The phone-login form requires a name and a 10-digit Indian phone number (fixed +91). Email and location are optional. The server validates all fields and saves them in `customer_profiles`, in the existing `REVIEWS_DB` database, only after Supabase verifies the phone. Profiles use the verified Supabase account ID, never a browser-supplied identifier, and are returned only through that customer's authenticated session. Repeated sign-ins update the same profile. Profile-save failures do not create a local signed-in session.

Before deploying this change, apply `migrations/reviews/0002_customer_profiles.sql` to the remote `baji-market-reviews` database. The local macOS SQLite adapter initializes it automatically. Working phone authentication still requires Supabase credentials and SMS configuration; adding profile fields does not replace OTP verification.
