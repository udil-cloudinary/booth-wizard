# Prompt for Claude Code: build the booth wizard

How to use: open Claude Code in the `Cloudinary Everywhere` project folder and paste everything below the line. It is written to be pasted as is; fill the three values in "Config" first if you have them (otherwise the app ships with placeholders).

---

Build the booth wizard: a mobile web app that visitors at our Cloudinary booth (Gathering 2026, Lago Maggiore) open from a QR code on their own phone. In about 60 seconds they pick their name, take a selfie, pick an Italian classic (pizza, gelato or caffè) and a favourite, and the app uploads the selfie with all answers as structured metadata to the booth's Cloudinary cloud. Everything else at the booth (two demo stations, the TV loop, the printed magnet) reads from that asset. This is the ONLY app we build for the booth.

## Read first, in this order

1. `products/booth-wizard/WIZARD-CONTENT.md`: the source of truth. Every screen's copy, the rules, the chips, the product art per answer, the unsigned upload, hosting, and the asset and metadata contract. Use the copy exactly as written there.
2. `products/booth-wizard/CLAUDE.md`: context and what NOT to mix in.
3. `templates/TEMPLATES.md` (sections "Answer layers" and "The label system"): the product art and the label look.

Do not use anything in `products/mobile-app/`: that is a different, native product.

## Stack

- Static site, no server code, no framework: Vite + vanilla TypeScript, plain CSS. `npm run build` outputs `dist/` that deploys as is to Cloudflare Pages, AWS (S3 + CloudFront or Amplify) or Vercel. Add a short README section for each of the three.
- Put the app in `products/booth-wizard/app/`.
- Config via env (Vite `import.meta.env`), with a `.env.example`: `VITE_CLOUD_NAME`, `VITE_UPLOAD_PRESET` (unsigned preset, e.g. `booth_wizard`), `VITE_ASSET_FOLDER` (default `booth/visitors`). No API key or secret anywhere in the code.
- Target: iOS Safari 16+ and Android Chrome, portrait, 360 to 430 px wide. Works on slow booth Wi-Fi: total first load under 1.5 MB.

## Screens and state

Six screens as in WIZARD-CONTENT.md: 01 Welcome, 02 Who are you, 03 Strike a pose (selfie), 04 Pick your Italian classic, 05 Favourite, 06 Done. One page, a small state machine, a 4-segment progress bar on screens 02 to 05, Back on every step except 01 and 06. Keep state in memory and in `sessionStorage` so a reload mid-wizard does not lose it. After Done, a "Start over" link clears everything (for a shared booth phone).

Screen rules that matter:
- 02: the name is free text (trimmed, max 40). The email field takes only the part before the @; `@cloudinary.com` is fixed and shown next to it. (Changed 2026-09-28: the employee list was dropped.)
- 03: camera via `<input type="file" accept="image/*" capture="user">`, plus "Choose from library". Show the photo, then run a face check in the browser (see "Face check"). Next is disabled until a face is found. Retake always available.
- 04: three cards, nothing preselected, one required.
- 05: question and 5 chips per type (exact order from the doc) plus "Write your own" (max 18 chars, trimmed, no word filter). Next ("Make my product") disabled until an answer exists. After the first tap, show the live product preview card (see "Label preview"); it swaps art on every tap.
- 06: copy from the doc with `{first}`, `{answer}`, `{type}` filled in, e.g. "Your Artichoke pizza is in the Cloudinary DAM."
- Welcome: no privacy or consent footer. Do not add one.

## Face check and upload (important: unsigned uploads cannot be edited later)

An unsigned upload cannot update an asset's metadata afterwards, so upload ONCE, at "Make my product" on screen 05, with every field filled:
- On screen 03, check for a face in the browser with MediaPipe Face Detector (tasks-vision, load the model lazily when screen 03 opens). One or more faces = success copy, none = fail copy. If the model fails to load, allow Next (Cloudinary's check below is the backstop).
- Before upload, downscale to max 1600 px long side and re-encode as JPEG quality 0.85 in a canvas (also fixes HEIC and EXIF rotation).
- POST `multipart/form-data` to `https://api.cloudinary.com/v1_1/${VITE_CLOUD_NAME}/image/upload` with: `file`, `upload_preset`, `public_id` = `{first}-{last}-{4 random a-z0-9}` (lower case, accents stripped, spaces to hyphens), `tags` = `type-{product_type}` (the preset adds `booth-visitor`), and `metadata` as a pipe-separated `key=value` string (escape `=` and `|` in values per the Cloudinary upload API docs):
  `visitor_name`, `first_name`, `email`, `product_type`, `variant`, `favorite`, `face_detected=true`, `tv_status=auto`, `print_status=none`.
- `variant`: chip in lower case, accents stripped (`Tiramisù` becomes `tiramisu`); a typed answer becomes `own-answer`, unless it matches one of that type's chips ignoring case and accents, then use that chip's slug. `favorite` is always the text exactly as picked or typed.
- If the response's `faces` array is empty, send the visitor back to screen 03 with the fail copy; the next attempt is a fresh upload (latest per email wins downstream, nothing to clean up).
- Show upload progress on the button; on network error, keep the state and offer Retry. Time out after 30 s.
- Put all Cloudinary calls in one module (`src/cloudinary.ts`) so the metadata-vs-context fallback in the doc is a one-line switch (`VITE_META_MODE=metadata|context`).

## Product art

- Copy these from `templates/cloudinary/` into the app, converted to WebP at 2x display size: all 18 `product-base-{type}-{variant}.png` (678 x 1096, transparent).
- Welcome hero and screen 04 cards: `pizza-own-answer` (margherita slice), `gelato-pistachio`, `caffe-cappuccino`.
- Screen 05 preview: `product-base-{type}-{variant}`, with `own-answer` while "Write your own" is active.
- Preload the 6 images of the chosen type as soon as screen 04 is answered.

## Label preview (screen 05)

A card next to or under the product art, built in HTML (the PNGs have no text and no face):
- Kraft background `#d2ab74`, text `#3B1F12`, rounded 14 px.
- Small caption "YOUR PRODUCT".
- Line 1: first name in caps, Playfair Display 800. Line 2: the favourite, Playfair Display 500 italic, `#9A3A22`. Each line shrinks to fit its width and never wraps (max 24 px and 17 px).
- The selfie as a round sticker with a white ring (the local photo, face-centred if the detector gave a box).
- "Your selfie goes in the sticker."

## Look

Match the "Wizard v2 · two stations" boards:
- Background: radial gradient from `#232b5e` at the top to `#141833` to `#0C0F22`. Text white, secondary `#aab3e8`, muted `#8b93c9`.
- Accent / primary button: `#FFD23F` with `#0C0F22` text, 54 px tall, radius 14. Disabled: `#3a3f5e` with `#7d84ad`.
- Chips: 46 px, radius 23, `#1B2148` with a `#3a4275` border; selected = yellow border. "Write your own" = dashed yellow.
- Cards: `#1B2148`, border `#3a4275`, radius 16; selected `#252c5c` with a 2 px yellow border and a yellow check.
- Fonts (Google Fonts): Space Grotesk 500/600/700 for headings and UI, Inter for small text, Playfair Display only in the label preview.
- Header: Cloudinary Everywhere badge (`logo/cloudinary-everywhere-badge-mirrored.png`) + "Cloudinary *Everywhere*". Welcome has a green, white and red tricolore strip under the header.
- Touch targets at least 44 px, real `<button>` and `<label>` elements, text contrast 4.5:1, respects `prefers-reduced-motion`. No emoji.

## Name and email

- No employee list (dropped 2026-09-28). `first_name` = the first word of the typed name.
- `email` = the typed prefix + `@cloudinary.com`.

## Done means

- `npm run dev` works on a phone on the same network (Vite `--host`, HTTPS via `@vitejs/plugin-basic-ssl` so the camera opens).
- `npm run build` produces a static `dist/` under 1.5 MB first load.
- A `MOCK_UPLOAD=1` mode (or `VITE_MOCK_UPLOAD=true`) that skips the network and returns a fake response with one face, so the whole flow can be demoed without the booth cloud.
- A short `TESTING.md`: the manual test list (every chip per type, own answer that matches a chip, own answer at 18 chars, a very long name, no face, library photo, airplane mode at upload, reload mid-wizard) and the first-run check on the real booth cloud: upload once and confirm in the Media Library that the metadata, the tags, the `booth/visitors` folder and the eager renditions arrived.
- Do not invent copy. If something in WIZARD-CONTENT.md is unclear or contradicts this prompt, follow WIZARD-CONTENT.md and list the question at the end of your summary.

Start by reading the three files, then give me a short plan (files, modules, order) before writing code.
