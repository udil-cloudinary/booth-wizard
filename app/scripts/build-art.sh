#!/bin/sh
# Converts the product art and the header badge to WebP for the app.
# Source: ../../../templates/cloudinary and ../../../logo. Needs cwebp (brew install webp).
# The product-base PNGs are 678 x 1096; the app shows them at most ~170 CSS px wide,
# so 2x display size = 340 px wide.
set -e
cd "$(dirname "$0")/.."
ROOT=../../..
OUT=public/art
mkdir -p "$OUT"
for f in "$ROOT"/templates/cloudinary/product-base-*.png; do
  name=$(basename "$f" .png)
  cwebp -quiet -q 82 -alpha_q 90 -resize 340 0 "$f" -o "$OUT/$name.webp"
done
cwebp -quiet -q 90 -resize 96 96 "$ROOT/logo/cloudinary-everywhere-badge-mirrored.png" -o "$OUT/badge.webp"
ls -la "$OUT" | awk '{s+=$5} END {print "art total bytes:", s}'
