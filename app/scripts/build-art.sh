#!/bin/sh
# Converts the product art and the header logo to WebP for the app.
# Source: ../../../templates/cloudinary and ../../../logo. Needs cwebp (brew install webp).
# The product-base PNGs are 756 x 1257 (whole product, transparent); the app shows
# them at most ~170 CSS px wide, so 2x display size = 360 px wide.
set -e
cd "$(dirname "$0")/.."
ROOT=../../..
OUT=src/art
mkdir -p "$OUT"
for f in "$ROOT"/templates/cloudinary/product-base-*.png; do
  name=$(basename "$f" .png)
  cwebp -quiet -q 82 -alpha_q 90 -resize 360 0 "$f" -o "$OUT/$name.webp"
done
cwebp -quiet -q 90 -alpha_q 100 -resize 120 120 "$ROOT/logo/cloudinary-everywhere-field-navy-cloud13.png" -o "$OUT/badge.webp"
# Surprise variation: pizza and caffe without the label area.
python3 scripts/render-plain.py
ls -la "$OUT" | awk '{s+=$5} END {print "art total bytes:", s}'
