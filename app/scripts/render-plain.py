"""Render the "surprise" variation's un-personalised art: pizza and caffe
without the kraft label area (sleeve / bar card), from templates/figma.

- plain-pizza.webp: the margherita slice, cut above the sleeve line with a
  crust edge drawn at the bottom (the print slice has none; the sleeve hid it).
- plain-caffe.webp: the cappuccino cup and saucer only.

Gelato keeps its normal art: the cup is part of the product, not the label.
Run: python3 scripts/render-plain.py   (needs Google Chrome and cwebp)
"""
import os, re, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
FIGMA = os.path.join(APP, '../../../templates/figma')
OUT = os.path.join(APP, 'src/art')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
WIDTH = 360  # 2x the largest display width

def strip_label(svg: str) -> str:
    svg = re.sub(r'<metadata>.*?</metadata>', '', svg, flags=re.S)
    svg = re.sub(r'<style>.*?</style>', '', svg, flags=re.S)
    svg = re.sub(r'<g id="FACE SLOT.*?</g>', '', svg, flags=re.S)
    svg = re.sub(r'<text id="(NAME|FAVOURITE).*?</text>', '', svg, flags=re.S)
    svg = re.sub(r'<g id="Guides.*?</g>', '', svg, flags=re.S)
    return svg

def set_viewbox(svg: str, vb):
    h = round(WIDTH * vb[3] / vb[2])
    svg = re.sub(r'width="[^"]*mm" height="[^"]*mm" viewBox="[^"]*"',
                 f'width="{WIDTH}" height="{h}" viewBox="{" ".join(map(str, vb))}"', svg, count=1)
    return svg, h

# Pizza: the slice edge reaches +-159 at y=120, just inside the old sleeve width.
CRUST = (
    '<path d="M-159.1 120 Q0 150 159.1 120 Z" fill="#cf4a2e"/>'
    '<path d="M-166 124 Q0 168 166 124 L152 104 Q0 140 -152 104 Z" fill="#f1cf86"/>'
    '<path d="M-166 124 Q0 168 166 124" stroke="#e0b465" stroke-width="3" fill="none"/>'
    '<path d="M-152 104 Q0 140 152 104" stroke="#d9a95a" stroke-width="2.5" fill="none" opacity="0.6"/>'
)

def pizza(svg: str) -> str:
    svg = strip_label(svg)
    svg = svg.replace('<rect x="-400" y="-500" width="800" height="594"/>',
                      '<rect x="-400" y="-500" width="800" height="620"/>')
    # Drop the sleeve: everything between the clipped slice group and the end of PRODUCT ART.
    start = svg.index('<g id="TOPPINGS">')
    end_toppings = svg.index('</g>', start) + len('</g>')
    end_clip = end_toppings + len('</g></g>')
    assert svg[end_toppings:end_clip] == '</g></g>'
    end_art = svg.index('</g>', end_clip)
    svg = svg[:end_clip] + CRUST + svg[end_art:]
    return set_viewbox(svg, (-170, -296, 340, 468))

def caffe(svg: str) -> str:
    svg = strip_label(svg)
    start = svg.index('<g id="VESSEL')
    # VESSEL has no nested groups: its first </g> closes it.
    end_vessel = svg.index('</g>', start) + len('</g>')
    end_art = svg.index('</g>', end_vessel)
    svg = svg[:end_vessel] + svg[end_art:]
    return set_viewbox(svg, (-160, -232, 320, 320))

JOBS = [
    ('product-pizza-own-answer.svg', pizza, 'plain-pizza.webp'),
    ('product-caffe-cappuccino.svg', caffe, 'plain-caffe.webp'),
]

with tempfile.TemporaryDirectory() as tmp:
    for src, fn, dest in JOBS:
        svg, h = fn(open(os.path.join(FIGMA, src)).read())
        html = os.path.join(tmp, 'p.html')
        open(html, 'w').write(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        png = os.path.join(tmp, 'p.png')
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
                        f'--window-size={WIDTH},{h}', '--default-background-color=00000000',
                        f'--screenshot={png}', 'file://' + html], check=True, capture_output=True)
        subprocess.run(['cwebp', '-quiet', '-q', '82', '-alpha_q', '90', png, '-o', os.path.join(OUT, dest)], check=True)
        print('wrote', f'src/art/{dest}', f'{WIDTH}x{h}')
