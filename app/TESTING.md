# Booth wizard: manual tests

Run on a real iPhone (Safari) and a real Android phone (Chrome), portrait. Use `npm run dev:mock` for the flow tests, and the real booth cloud for the first-run check at the end. Between runs, tap "Start over" on screen 06.

## Flow

- [ ] 01: hero shows margherita slice, pistachio gelato, cappuccino. Tricolore strip under the header. No privacy footer. Start opens 02.
- [ ] 02: type a name with extra spaces ("  Maya   Sol "): stored as "Maya Sol", label shows MAYA.
- [ ] 02: `@cloudinary.com` sits fixed after the email field; tapping it focuses the field.
- [ ] 02: type or paste a full address (`maya.sol@gmail.com`): only `maya.sol` stays, sent as `maya.sol@cloudinary.com`.
- [ ] 02: invalid prefixes (`.maya`, `maya.`, `ma..ya`, `ma!ya`): field turns red, Next disabled.
- [ ] 02: Next needs both a name and a valid prefix.
- [ ] 02: a very long name (40 characters): the field stops at 40; later the label shrinks the first name on one line.
- [ ] 02: a Hebrew name (אודי לי-הוד): accepted; public ID uses the email prefix (`udi-li-hod-xxxx`).
- [ ] 03: Take a selfie opens the FRONT camera. Photo shows, then "Face found. Looking great, {first}". Next enables.
- [ ] 03: no face (point at the ceiling): fail copy, Next stays disabled, Retake works.
- [ ] 03: Choose from library: a portrait from the gallery works, including an iPhone HEIC and a rotated photo (shows upright).
- [ ] 03: Back to 02 and forward again: photo and status kept.
- [ ] 04: nothing preselected, Next disabled. Pick each card: yellow border and check.
- [ ] 05: every chip of every type (pizza 5, gelato 5, caffè 5) swaps the art to `product-base-{type}-{variant}` and the label line 2.
- [ ] 05: Write your own: art switches to the own-answer default (margherita, pink gelato, moka pot).
- [ ] 05: own answer that matches a chip, e.g. "PISTACHIO" or "tiramisu": art becomes that chip's art. In the upload, `variant` = `pistachio` / `tiramisu`, `favorite` = the text exactly as typed.
- [ ] 05: own answer at 18 characters: input stops at 18, label line shrinks and never wraps.
- [ ] 05: own answer with `=` or `|` (e.g. `Fig=|x`): upload succeeds and `favorite` in the Media Library shows the characters as typed.
- [ ] 05: the sticker shows the selfie, face centred.
- [ ] 05: Make my product: progress fills the button, then 06.
- [ ] 06: "Grazie, {first}!" and "Your {answer} {type} is in the Cloudinary DAM." with the real values (e.g. "Your Artichoke pizza").
- [ ] 06: Start over returns to 01 with everything cleared.

## Resilience

- [ ] Reload on each of 02 to 05: you stay on the same step with your answers (photo included).
- [ ] Airplane mode, then Make my product: after the error the button reads Retry, answers are kept. Turn the network back on, Retry succeeds.
- [ ] Very slow network (Chrome DevTools, Slow 3G): upload times out after 30 s and offers Retry.
- [ ] Face model blocked (DevTools: block `*.tflite`): after about 8 s Next enables anyway.
- [ ] Cloudinary returns no faces (e.g. a library photo of a hand when the model is blocked): back on 03 with the fail copy; the retake is a fresh upload with a new public ID.
- [ ] VoiceOver / TalkBack: each step announces its heading; chips announce pressed state; the progress bar reads "Step n of 4".
- [ ] iOS: Settings → Accessibility → Reduce Motion on: no slide or pop animations.

## First run on the real booth cloud

Do this once, before printing the QR code.

1. Create the unsigned preset `booth_wizard` (see WIZARD-CONTENT.md, "Upload and auth"): asset folder `booth/visitors`, tag `booth-visitor`, `faces: true`, allowed formats jpg/png/heic/webp, max size ~10 MB, unique filename, no overwrite.
2. Create the structured metadata fields with these exact external IDs: `visitor_name`, `first_name`, `email`, `product_type` (single-select pizza/gelato/caffe), `variant` (single-select, the 15 chip slugs + `own-answer`), `favorite`, `face_detected`, `tv_status` (auto/hidden), `print_status` (none/printed).
3. Set `VITE_CLOUD_NAME` and `VITE_UPLOAD_PRESET`, `npm run dev`, go through the wizard once on a phone.
4. In the Media Library, open the new asset and confirm:
   - [ ] It is in the `booth/visitors` folder, public ID `{first}-{last}-{4 chars}`.
   - [ ] Tags: `booth-visitor` and `type-{type}`.
   - [ ] All 9 metadata fields are filled with the values you picked.
   - [ ] The magnet and TV images render from `templates/cloudinary-setup` (`npm run sample`); they are built on the templates, not eager on the selfie.
   - [ ] The upload response had a non-empty `faces` array (browser DevTools → Network).
5. If the upload fails with a metadata error, set `VITE_META_MODE=context`, redo step 3, and confirm the fields arrive as contextual metadata instead (the staff side then copies them into structured metadata).
