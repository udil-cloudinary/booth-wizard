# Booth wizard (web app)

The mobile web app visitors open from the booth QR code: name, selfie, Italian classic, favourite, then ONE unsigned upload to the booth Cloudinary cloud. Copy, rules and the asset contract: [`../WIZARD-CONTENT.md`](../WIZARD-CONTENT.md). Manual tests: [`TESTING.md`](TESTING.md).

Static site, Vite + vanilla TypeScript, no server code, no API key or secret.

## Setup

```sh
npm install          # also copies the MediaPipe wasm runtime into public/mediapipe/wasm
cp .env.example .env # fill VITE_CLOUD_NAME and VITE_UPLOAD_PRESET
```

| Env | Default | What |
|---|---|---|
| `VITE_CLOUD_NAME` | `your-booth-cloud` | Booth cloud name |
| `VITE_UPLOAD_PRESET` | `booth_wizard` | The UNSIGNED preset (folder, `booth-visitor` tag, `faces`, eager, formats, size limit live there) |
| `VITE_ASSET_FOLDER` | `booth/visitors` | Sent as `asset_folder` (the preset should fix it too) |
| `VITE_META_MODE` | `metadata` | `context` sends the same fields as `context` if the cloud refuses structured metadata on unsigned uploads |
| `VITE_MOCK_UPLOAD` | `false` | `true` skips the network and fakes a response with one face |
| `VITE_FACE_MODEL_URL` | Google-hosted BlazeFace | Set to `mediapipe/blaze_face_short_range.tflite` after `npm run fetch-model` to self-host |

## Run

```sh
npm run dev        # https://<your-mac-ip>:5173 on a phone on the same Wi-Fi
npm run dev:mock   # same, no uploads (or MOCK_UPLOAD=1 npm run dev)
```

Dev runs over HTTPS with a self-signed certificate (the camera only opens on HTTPS). On the phone, accept the certificate warning once.

## Build

```sh
npm run build      # -> dist/, deploy as is
npm run preview    # serve dist/ locally
```

First load is about 45 KB of app (HTML, CSS, JS, badge, 3 hero images) plus Google Fonts. The face check (MediaPipe runtime, ~11 MB wasm, compresses to a few MB) loads only when screen 03 opens; if it has not loaded in 8 s, the visitor can continue and Cloudinary's `faces` check is the backstop.

`dist/` uses relative paths, so it works at a domain root or a sub-path.

## Name and email

The name is free text; the first word goes on the label. The email field takes only the part before the @; the domain is fixed to `@cloudinary.com` (`emailDomain` in `src/config.ts`).

## Product art

`public/art/` holds WebP copies (340 px wide, 2x display size) of the 18 `templates/cloudinary/product-base-*.png` files and the header badge. Regenerate after art changes with `npm run art` (needs `cwebp`: `brew install webp`).

## Deploy

All three serve `dist/` as static files over HTTPS on a CDN. Point the short QR domain (e.g. `everywhere.cloudinary.com`) at it.

**Cloudflare Pages**
- Dashboard: Workers & Pages → Create → Pages → connect the repo. Root directory `products/booth-wizard/app`, build command `npm run build`, output `dist`. Add the `VITE_*` variables under Settings → Environment variables.
- Or from a laptop: `npm run build && npx wrangler pages deploy dist --project-name booth-wizard`.
- Custom domain: Pages project → Custom domains.

**AWS (S3 + CloudFront)**
- `npm run build`, then `aws s3 sync dist/ s3://<bucket>/ --delete`.
- CloudFront distribution with the bucket as origin (Origin Access Control), default root object `index.html`, compression on, an ACM certificate for the custom domain.
- Cache: long TTL for `assets/*` (hashed names), short for `index.html`. After a deploy: `aws cloudfront create-invalidation --distribution-id <id> --paths /index.html`.
- Amplify Hosting is the simpler alternative: connect the repo, app root `products/booth-wizard/app`, build `npm run build`, artifacts `dist`, and set the env variables in the console.

**Vercel**
- Import the repo, Root Directory `products/booth-wizard/app`, framework preset Vite (build `npm run build`, output `dist`). Add the `VITE_*` variables in Project Settings → Environment Variables.
- Or: `npx vercel --prod` from this folder.

## Code map

| File | What |
|---|---|
| `src/content.ts` | All visitor copy, chips and product info (verbatim from WIZARD-CONTENT.md) |
| `src/state.ts` | Wizard state, persisted to `sessionStorage` |
| `src/cloudinary.ts` | The only Cloudinary call: unsigned upload, progress, 30 s timeout, metadata/context switch, mock |
| `src/face.ts` | Lazy MediaPipe face detector |
| `src/image.ts` | Downscale to 1600 px JPEG 0.85, sticker crop |
| `src/text.ts` | Accent folding, slugs, `variant`, public ID, name cleanup, email prefix rules, metadata escaping |
| `src/labelPreview.ts` | Screen 05 kraft label preview |
| `src/screens/*` | One file per screen |
