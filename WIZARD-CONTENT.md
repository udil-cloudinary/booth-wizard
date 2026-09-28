# Booth wizard v2: content and data contract

Status: v1 built (see "Build decisions"), updated 2026-09-28 (final product templates, product art per answer, label preview, unsigned upload at step 05). Build prompt for Claude Code: `BUILD-PROMPT.md`. Screens: "Wizard v2 · two stations" row on The Agent Show Screens canvas.
Replaces the Act 1 wizard (topic: food / place / football team). Serves both stations: Agent and Everywhere.

## Flow (4 steps, about 60 seconds)

| # | Screen | Copy | Rules |
|---|--------|------|-------|
| 01 | Welcome | "Ciao! Become an Italian classic." / "Take a selfie and pick your flavour. Then head to a station and make it real, with an AI agent or right inside the tools you already use." Chips: 60 seconds, magnet + keychain. No privacy or consent footer (Udi 2026-09-27: not needed). CTA: Start | |
| 02 | Who are you? | "Your first name goes on your product label." NAME: employee list picker. Helper: "Pick yourself from the employee list. Remember it, you will type it at the station." EMAIL: auto-filled, editable. CTA: Next | Name must come from the list (full name, exact spelling). Email must be valid. |
| 03 | Strike a pose | "This face is about to be famous." Success: "Face found. Looking great, {first}". Fail: "We could not find a face" / "Face the camera, find some light, and keep sunglasses off for a second." CTAs: Retake, Next | Next disabled until a face is found (checked in the browser, see "Upload and auth"). Library upload allowed. |
| 04 | Pick your Italian classic | "It becomes your product, with your face on the label." Cards: Pizza "Wood-fired, obviously" / Gelato "One scoop is never enough" / Caffè "Standing at the bar, like a local". CTA: Next | One required. Nothing preselected. Card art: see "Product art in the app" below. |
| 05 | Favourite (per type) | Helper for all: "One tap, or write your own." Live product preview card (appears after the first tap): the product art for the tapped answer + "YOUR PRODUCT / {FIRST} / {answer}" + "Your selfie goes in the sticker." CTA: Make my product | Next disabled until a chip or own answer. Preview swaps art on every tap. |
| 06 | Done | "Grazie, {first}!" / "Your {answer} {type} is in the Cloudinary DAM. Now make it real at one of our stations." Agent station: "Pick Claude or ChatGPT, give it your name, and watch the agent build your magnet with Cloudinary." Everywhere station: "Write a page in WordPress, Shopify and more. Your assets find you, without leaving the page." "Finish either one and collect your magnet + keychain at the counter." P.S. "Keep an eye on the big screen. Your product might just show up." | |

## Step 05 questions and chips

| Type | Question | Chips (in this order) |
|------|----------|-----------------------|
| pizza | Your topping? | Burrata, Truffle, Pineapple, Olives, Artichoke (all meat-free, decided 2026-09-24 because many guests keep religious dietary rules) |
| gelato | Your flavour? | Pistachio, Stracciatella, Nocciola, Limone, Tiramisù |
| caffe | How do you take it? | Espresso, Cappuccino, Macchiato, Affogato, Ristretto |

"Write your own": max 18 characters, trimmed. NO automated word filter (decided 2026-09-23): the staff Print tap and the operator Hide button on the TV are the human check. If free text ever proves a problem, drop the "Write your own" chip rather than add a filter.

## Product label rule

Two lines, always: line 1 `first_name` in caps (e.g. MAYA), line 2 `favorite` in italic (e.g. Truffle). Each line is its own Cloudinary text overlay with a fixed box and fit, so a long name and a long answer shrink independently and never collide. No possessive, so no "Jonas's" problem. The magnet FRAME stays name-free.

## Product art in the app

All art is exported, in `templates/cloudinary/` (see `templates/TEMPLATES.md`). The app bundles the web-size PNGs (or loads them from the booth cloud, `booth/templates/`).

| Where | File |
|---|---|
| Welcome hero (3 products) and step 04 cards | `product-base-pizza-own-answer.png` (margherita slice), `product-base-gelato-pistachio.png`, `product-base-caffe-cappuccino.png` |
| Step 05 preview | `product-base-{type}-{answer}.png` for the tapped chip; `{type}-own-answer` while "Write your own" is active |

The art key is the `variant` metadata value (see the asset contract below): chip in lower case, `Tiramisù` becomes `tiramisu`, any typed answer becomes `own-answer`. Own-answer art: pizza margherita, gelato strawberry pink, caffè moka pot.

The product-base PNGs have NO label text and no face, so the preview draws the label in HTML next to the art, the same way the print does it:
- Card: kraft `#d2ab74`, text `#3B1F12`.
- NAME: Playfair Display 800, caps. Favourite: Playfair Display 500 italic, `#9A3A22`. Both from Google Fonts. Shrink to fit on one line each, never wrap.
- Face: the visitor's selfie in a circle with a white ring (after upload, a `c_thumb,g_face` URL; before upload, the local capture).

Pizza is the full takeaway slice (triangle) in a kraft sleeve, gelato the coppetta, caffè the real cup per drink behind a kraft bar card. The Wizard v2 boards on the canvas show exactly this.

## Upload and auth

No visitor login and NO backend for the wizard. UNSIGNED upload (decided 2026-09-27 with the devs), the same way our demo clouds do it. Good enough because the booth cloud is used only for the gathering and only by the people at it.

1. On the booth cloud, create ONE unsigned upload preset (e.g. `booth_wizard`). The preset, not the phone, fixes everything that matters: asset folder `booth/visitors/`, tag `booth-visitor`, `faces: true`, the eager renditions (async), allowed formats jpg/png/heic/webp, a max file size (e.g. 10 MB), `unique_filename`, no overwrite.
2. The phone posts the selfie straight to `https://api.cloudinary.com/v1_1/<booth-cloud>/image/upload` with `upload_preset`, `public_id`, the `type-{pizza|gelato|caffe}` tag, and the structured `metadata` (fields below). Only the cloud name and the preset name live in the app, no API key or secret.
3. ONE upload per attempt, at "Make my product" on step 05, with every metadata field filled: an unsigned upload cannot edit metadata afterwards. So the step 03 face check runs in the browser (e.g. MediaPipe Face Detector), and Cloudinary's `faces` in the upload response is the backstop: if it is empty, send the visitor back to step 03 with the fail copy; the retake is a new upload and the latest per email wins.
4. The employee list check happens in the app: the name picker only offers names from the list bundled with the app.

What this trades away, and how we cover it:
- Anyone who finds the cloud name + preset name could upload. Cover: formats and size limited by the preset, nothing is published without the staff Print tap and the TV Hide button, and the preset is DISABLED right after the gathering, then `booth/visitors/` is deleted.
- Nobody can overwrite or delete an existing asset through an unsigned upload, so visitors cannot touch each other's photos.
- Verify on the first test upload: that the structured `metadata` parameter and the `faces` / eager settings are honoured for unsigned uploads on the booth cloud. If metadata is refused, send the same fields as `context` and have the staff side copy them into metadata.

## Hosting and deployment

The wizard is a static site (HTML, CSS, JS and the bundled art and employee list), with no server code, so it deploys anywhere. Cloudinary picks one of: **Cloudflare** (Pages), **AWS** (S3 + CloudFront, or Amplify Hosting) or **Vercel**. Requirements whichever is chosen:
- HTTPS (the phone camera only opens on HTTPS) on a short URL for the QR code, e.g. `everywhere.cloudinary.com`.
- Fast on phone networks: CDN-cached, art as optimized web images.
- The TV, operator page and print queue go on the same provider (their small backend runs as that provider's functions: Cloudflare Workers, AWS Lambda or Vercel Functions).

## Asset contract (what the stations, the TV and the print agent read)

- Folder: `booth/visitors/`. Public ID: `{first}-{last}-{4 random chars}`.
- Tags: `booth-visitor`, `type-{pizza|gelato|caffe}`.
- Structured metadata: `visitor_name` (full, as in list), `first_name`, `email`, `product_type`, `variant`, `favorite`, `face_detected` (bool), `tv_status` (auto, hidden), `print_status` (none, printed).
  - Visitor fields: `visitor_name` (text, full name exactly as in the employee list: the Agent station finds the visitor by it), `first_name` (text, what the label prints in caps), `email` (text, where the Part 2 email on the TV and any follow-up goes; also the key for "latest upload wins").
  - `product_type`: single-select, `pizza` | `gelato` | `caffe`.
  - `variant`: single-select, which ART to use. The chip slugs (pizza `burrata`, `truffle`, `pineapple`, `olives`, `artichoke`; gelato `pistachio`, `stracciatella`, `nocciola`, `limone`, `tiramisu`; caffe `espresso`, `cappuccino`, `macchiato`, `affogato`, `ristretto`) plus `own-answer`. Optional: a Cloudinary conditional metadata rule so each product type only offers its own variants.
  - `favorite`: free text, what the LABEL prints, exactly as the visitor picked or typed it (e.g. `Artichoke`, `Nonna's Fig`).
  - Art file = `{product_type}-{variant}`, e.g. `magnet-layer-pizza-artichoke.png`, `product-base-gelato-own-answer.png`. Nobody derives it from `favorite`.
  - Own answer: `variant` = `own-answer` (default art: margherita, strawberry pink, moka pot), `favorite` = the typed text. If the typed text matches one of that type's chips (case and accents ignored, e.g. "pistachio"), the app stores that chip's variant instead, so the art matches the words.
  - `favorite_source` is dropped: `variant` = `own-answer` already says it.
- Eager renditions at upload: payoff renditions (landing hero, PDP, email header) and the magnet print file, so the TV never waits.
- Repeat visitors: latest upload per email wins everywhere.

## Build decisions (v1, confirmed by Udi 2026-09-28)

The app is built: `products/booth-wizard/app/` (README for run and deploy, TESTING.md for the manual test list and the first-run check).

- Step 03 camera button: "Take a selfie" before the first photo, "Retake" after. Library: "Choose from library".
- Upload error at step 05: the button turns into "Retry", no extra message. Answers are kept. Timeout 30 s.
- A photo the phone cannot read at all (e.g. HEIC on Android) shows the normal fail copy ("We could not find a face").
- Step 06 sentence uses the type in lower case: "Your Espresso caffè is in the Cloudinary DAM", "Your Nonna's Fig gelato ...".
- Step 06 shows "Agent station" and "Everywhere station" as the headings of the two station cards.
- Folder: the app sends `asset_folder` = `booth/visitors` (dynamic folders); the preset fixes the folder too. If the booth cloud uses fixed folders, switch to `folder` in `app/src/cloudinary.ts` after the first test upload.
- Face check: MediaPipe runtime bundled with the app and loaded only on step 03; if it has not loaded in 8 s, Next is allowed and Cloudinary's `faces` is the backstop.

## Open items

- Product templates SETTLED and EXPORTED 2026-09-24 (`templates/`: figma, cloudinary, proofs). Pizza = full-triangle takeaway slice in a kraft sleeve (shape D), gelato = paper cup (coppetta) with the first scoop coloured by the chosen flavour (own answer = strawberry pink), caffè = the real cup per drink (demitasse, cappuccino cup, macchiato glass, affogato coppa, ristretto cup; moka pot for own answers) in front of a kraft bar card. Shared label: 9.6 mm face sticker over the paper edge, NAME caps, favourite italic. Still to do: run the draft `t_magnet` transformation once on the booth cloud.
- Retention: disable the unsigned preset and delete `booth/visitors/` after the gathering.

- Answer layers (2026-09-24): every product's art changes with the chip answer (pizza toppings, gelato scoop colour, caffè cup). Own answers get a default (margherita, strawberry pink, moka pot). Files and geometry: templates/TEMPLATES.md.
