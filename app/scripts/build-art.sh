#!/bin/sh
# Converts the product art and the header badge to WebP for the app.
# Source: ../../../templates (cloudinary PNGs, figma SVGs for pizza) and ../../../logo. Needs cwebp (brew install webp).
# The product-base PNGs are 678 x 1096; the app shows them at most ~170 CSS px wide,
# so 2x display size = 340 px wide.
set -e
cd "$(dirname "$0")/.."
ROOT=../../..
OUT=public/art
mkdir -p "$OUT"
for f in "$ROOT"/templates/cloudinary/product-base-gelato-*.png "$ROOT"/templates/cloudinary/product-base-caffe-*.png; do
  name=$(basename "$f" .png)
  cwebp -quiet -q 82 -alpha_q 90 -resize 340 0 "$f" -o "$OUT/$name.webp"
done
cwebp -quiet -q 90 -alpha_q 100 -resize 120 120 "$ROOT/logo/cloudinary-everywhere-field-navy-cloud13.png" -o "$OUT/badge.webp"
ls -la "$OUT" | awk '{s+=$5} END {print "art total bytes:", s}'
# Pizza comes from the Figma SVGs so the full slice (tip included) is visible.
python3 scripts/render-pizza.py
