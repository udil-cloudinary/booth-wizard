# Claude Code context: Booth wizard (Gathering 2026, Lago Maggiore)

You are building the booth's mobile WEB app: a short wizard a visitor opens on their own phone. It is the ONLY app we build for the booth.

## What it is

- A mobile web app (opened from a QR code in the phone browser). No native app, no App Store, no TestFlight, no login.
- 6 screens, about 60 seconds: Welcome, Who are you (name from the employee list + email), Selfie with face check, Pick your Italian classic (pizza, gelato, caffè), Favourite (5 chips or write your own), Done.
- It does one thing: put the visitor's selfie + answers into the booth Cloudinary cloud (UNSIGNED upload with an upload preset, like our demo clouds: no backend, no API secret in the app; structured metadata). Both stations (Agent and Everywhere), the TV and the magnet print all read from there.
- A static site with no server code. Hosting: Cloudflare, AWS or Vercel (Cloudinary picks), HTTPS required for the camera. See "Hosting and deployment" in `WIZARD-CONTENT.md`.

## Read first

0. `BUILD-PROMPT.md`: the ready-to-paste build prompt.
1. `WIZARD-CONTENT.md`: every screen's copy and rules, the chips, the label rule, the product art per answer, the unsigned upload, the asset and metadata contract.
2. `../../templates/TEMPLATES.md`: the product art files and print geometry the app shows and the print uses.
3. `../../specs/spec-tv-orchestrator.md` (section on `/api/tv/visitors`): what the TV reads from the assets you create.

## Not this

`../mobile-app/` is the long-term native Cloudinary mobile app (capture-to-DAM). It is a separate product and is NOT built for the booth. Do not mix the two.
