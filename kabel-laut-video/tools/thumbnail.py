# Compose YouTube thumbnail (1280x720) from a clean 3D frame (build/preview/thumb_bg.jpg)
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
R = os.path.join(os.path.dirname(__file__), '..')
FB = lambda w, s: ImageFont.truetype(f'{R}/node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-{w}-normal.woff', s)
bg = Image.open(f'{R}/build/preview/thumb_bg.jpg').convert('RGB').resize((1280, 720), Image.LANCZOS)
im = bg.copy(); d = ImageDraw.Draw(im, 'RGBA')
# left gradient panel for legibility
grad = Image.new('L', (1280, 720)); gd = ImageDraw.Draw(grad)
for x in range(1280): gd.line([(x, 0), (x, 720)], fill=int(max(0, 235 - x * 0.34)))
white = Image.new('RGB', (1280, 720), (240, 247, 251)); im = Image.composite(white, im, grad); d = ImageDraw.Draw(im, 'RGBA')
NAVY, RED, CYAN = (19, 36, 59), (232, 71, 60), (18, 181, 229)
def stroke_text(xy, s, font, fill, sw=0, sf=(255, 255, 255)):
    d.text(xy, s, font=font, fill=fill, stroke_width=sw, stroke_fill=sf)
stroke_text((48, 40), '90%', FB(700, 300), RED, 10, (255, 255, 255))
stroke_text((60, 345), 'INTERNET RI', FB(700, 104), NAVY)
stroke_text((60, 445), 'LEWAT SINGAPURA?', FB(700, 104), NAVY)
# cut? stamp
st = Image.new('RGBA', (420, 170), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
sd.rounded_rectangle([6, 6, 414, 164], 18, outline=RED, width=10, fill=(255, 255, 255, 235)); sd.text((210, 85), 'CUT?', font=FB(700, 120), fill=RED, anchor='mm')
st = st.rotate(9, expand=True, resample=Image.BICUBIC); im.paste(st, (820, 470), st)
# badge
d.rounded_rectangle([60, 590, 520, 650], 10, fill=NAVY); d.text((80, 620), 'KABEL BAWAH LAUT · ANIMASI 3D', font=FB(600, 36), fill=(255, 255, 255), anchor='lm')
im.save(f'{R}/out/THUMBNAIL_1280x720.jpg', quality=93); print('thumb ok')
