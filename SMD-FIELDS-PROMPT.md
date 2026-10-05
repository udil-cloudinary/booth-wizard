# Task: create the booth wizard's structured metadata fields on `cld-everywhere-demo`

The booth wizard (a mobile web app) does ONE unsigned upload per visitor to the Cloudinary cloud `cld-everywhere-demo`, with the upload preset `booth_wizard`. Every upload sends 9 structured metadata (SMD) fields. If a field is missing or a value is not an allowed option, the upload fails. Create those 9 fields so the uploads succeed.

## Credentials

- Use the Admin API (`https://api.cloudinary.com/v1_1/cld-everywhere-demo/metadata_fields`, basic auth with API key and secret), or a Cloudinary MCP server that manages structured metadata if you have one.
- Read the key and secret from the `CLOUDINARY_URL` environment variable (`cloudinary://<key>:<secret>@cld-everywhere-demo`). Never print, log or commit the secret. If `CLOUDINARY_URL` is not set, stop and ask.

## Hard rules (the app depends on these)

1. **Each field's `external_id` is exactly the name below.** The app sends `visitor_name=...|first_name=...|...` and Cloudinary matches on `external_id`. The `label` is only for display.
2. **For single-select (`enum`) fields, each option's `external_id` is exactly the value the app sends** (the IDs below). The option's `value` is the display label. The app sends the option ID, not the label.
3. **No boolean type exists in Cloudinary SMD.** `face_detected` is an `enum` with options `true` and `false`. The app sends the string `true`.
4. **Do NOT make any field mandatory.** This is a shared demo cloud, and a mandatory field applies to every upload in the cloud, not just the booth ones. Leave `mandatory` false and do not set a `default_value`. The app always sends every field.
5. **Do not delete or rename any existing field or option.** First list existing fields (`GET /metadata_fields`). If a field with one of these `external_id`s already exists:
   - Same type, all options present: leave it alone.
   - Same type, options missing: add only the missing options (`PUT /metadata_fields/{external_id}/datasource`).
   - Different type: STOP and report it. Do not change it.

## The 9 fields

| external_id | label | type | options (`external_id` → label) |
|---|---|---|---|
| `visitor_name` | Visitor name | `string` | none |
| `first_name` | First name | `string` | none |
| `email` | Email | `string` | none |
| `favorite` | Favourite | `string` | none |
| `product_type` | Product type | `enum` | `pizza` → Pizza, `gelato` → Gelato, `caffe` → Caffè |
| `variant` | Variant | `enum` | 16 options, listed below |
| `face_detected` | Face detected | `enum` | `true` → Yes, `false` → No |
| `tv_status` | TV status | `enum` | `auto` → Auto, `hidden` → Hidden |
| `print_status` | Print status | `enum` | `none` → None, `printed` → Printed |

`variant` options (`external_id` → label):

- Pizza: `burrata` → Burrata, `truffle` → Truffle, `pineapple` → Pineapple, `olives` → Olives, `artichoke` → Artichoke
- Gelato: `pistachio` → Pistachio, `stracciatella` → Stracciatella, `nocciola` → Nocciola, `limone` → Limone, `tiramisu` → Tiramisù
- Caffè: `espresso` → Espresso, `cappuccino` → Cappuccino, `macchiato` → Macchiato, `affogato` → Affogato, `ristretto` → Ristretto
- Any product: `own-answer` → Own answer

Note: the option ID is `tiramisu` with no accent, and `own-answer` has a hyphen.

### Request body shapes (Admin API, `POST /metadata_fields`)

```json
{ "type": "string", "external_id": "visitor_name", "label": "Visitor name" }
```

```json
{
  "type": "enum",
  "external_id": "tv_status",
  "label": "TV status",
  "datasource": { "values": [
    { "external_id": "auto", "value": "Auto" },
    { "external_id": "hidden", "value": "Hidden" }
  ] }
}
```

## Verify the fields

`GET /metadata_fields` and check, for all 9 fields: the `external_id`, the type, the full option list with the exact option IDs, and that `mandatory` is false.

## Verify a real unsigned upload

Confirmed on `cld-everywhere-demo` on 2026-10-04 (all 9 fields stored on unsigned uploads). Re-check on any other cloud. Test it the way the phone does: no API key, preset only. Use any small JPEG.

```sh
curl -s https://api.cloudinary.com/v1_1/cld-everywhere-demo/image/upload \
  -F file=@test.jpg \
  -F upload_preset=booth_wizard \
  -F public_id=smd-test-$(date +%s) \
  -F asset_folder=booth/visitors \
  -F tags=type-pizza \
  -F "metadata=visitor_name=Smd Test|first_name=Smd|email=smd.test@cloudinary.com|product_type=pizza|variant=burrata|favorite=Burrata|face_detected=true|tv_status=auto|print_status=none"
```

- Success means HTTP 200 and the response's `metadata` object holds all 9 values. If the response has no `metadata`, check the asset with the Admin API (`GET /resources/image/upload/<public_id>?metadata=true`).
- If the upload is refused because of `metadata` (as opposed to an error about one field's value), report the exact error message. The app then has to switch to `VITE_META_MODE=context`.
- **Delete the test asset right after checking it** (`POST /image/destroy` or `DELETE /resources/image/upload?public_ids[]=<public_id>`). It carries the `booth-visitor` tag, so the booth TV would show it otherwise.

## Report back

- Which fields you created, which already existed, and which options you added.
- The unsigned test result: worked, or the exact error.
- Anything you stopped on (type conflicts, missing credentials).
