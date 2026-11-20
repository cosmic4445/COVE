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
