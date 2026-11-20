<<<<<<< HEAD
# Cove key service on Cloudflare

Runs the key checks and the `/key` page's claims without a server. Free plan is enough.

1. Create a free Cloudflare account, then from this folder run `npx wrangler login`.
2. Create storage: `npx wrangler kv namespace create KV`. Copy the `id` it prints into `wrangler.toml`.
3. In `wrangler.toml` set `ALLOW_ORIGIN` to your site's address, for example `https://yourname.github.io`.
4. Set your admin password: `npx wrangler secret put ADMIN_TOKEN`
5. Deploy: `npx wrangler deploy`. It prints your address, like `https://cove-keys.yourname.workers.dev`.
6. Put that address in `../js/config.js` (`api`) and in the app's `src/config.js` (`api`).

## Day to day

    set COVE_API=https://cove-keys.yourname.workers.dev
    set ADMIN_TOKEN=your-password
    node admin.js buyer someone@example.com
    node admin.js key "for a friend"

PowerShell: `$env:COVE_API="..."; $env:ADMIN_TOKEN="..."`

## Automatic keys from Buy Me a Coffee

1. In your Buy Me a Coffee dashboard, create a webhook (under Integrations). Set its address to `https://cove-keys.yourname.workers.dev/webhook/bmc` and pick the events for your pre-order, such as supports and extras.
2. Copy the secret it gives you and run `npx wrangler secret put BMC_SECRET`.
3. Set `MIN_AMOUNT` in `wrangler.toml` to your pre-order price, so smaller donations don't create a buyer. Run `npx wrangler deploy`.
4. Send a test from the dashboard, then run `node admin.js last` to see exactly what Buy Me a Coffee sent. If a purchase didn't add the buyer, that output shows why.

Each valid payment adds the buyer's email, and they can get their key on the website's `/key` page straight away. Refunds and cancellations are ignored.

## Release

Change `RELEASED` to `"true"` in `wrangler.toml` and run `npx wrangler deploy` again. You can also edit it under the Worker's Settings, Variables in the Cloudflare dashboard.

## Limits

The free plan allows 1,000 key writes per day and 100,000 reads per day, which is far more than pre-orders need. Each app launch uses one read.
=======
# Cove website

Static pages plus a small Node server for keys. No dependencies.

    ADMIN_TOKEN=choose-a-secret npm start

Windows PowerShell: `$env:ADMIN_TOKEN="choose-a-secret"; npm start`

If port 3000 is taken, pick another one:

    $env:PORT=3001; npm start

The Cove app then needs to know where to look: set `COVE_API=http://localhost:3001` before `npm start` in the app, or edit `src/config.js`.

## Pages

- `/` landing page
- `/key` where a buyer enters their pre-order email and gets their key

Edit `js/config.js` for your Buy Me a Coffee links and download addresses.

## Keys

Generate keys from the command line:

    npm run keygen 5 "batch one"
    npm run keygen buyer someone@example.com

`buyer` records a pre-order. That person can then open `/key` and enter their email to receive a key. Calling it again for the same email changes nothing, and they always get the same key back.

The same actions over HTTP, with `Authorization: Bearer <ADMIN_TOKEN>`:

    POST /api/issue     {"note": "anything"}
    POST /api/purchase  {"email": "someone@example.com"}

Use `/api/purchase` from a Buy Me a Coffee webhook once you know the format it sends.

## Release switch

`server/data/config.json` holds `"released": false`. Set it to `true` and valid keys open the main app. The site also unlocks the download buttons. No restart needed.

## Before you deploy

Delete the placeholder entries in `server/data/keys.json` and `server/data/purchases.json`. They are `COVE-TST-0001` and `test@example.com`.

An email is not a secret, so anyone who knows a buyer's email could claim their key. That is fine for a small pre-order, and a webhook from Buy Me a Coffee would remove the risk.
>>>>>>> 6d82d9392afcec26899027f53b9decfe3322a19f
