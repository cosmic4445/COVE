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
