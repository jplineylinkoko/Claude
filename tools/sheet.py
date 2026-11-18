# Planche d'images-clés : python3 tools/sheet.py <sortie.png> <cols> img1.png img2.png ...
import sys, os, re
from PIL import Image, ImageDraw, ImageFont
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th, pad, lab = 640, 360, 14, 34
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (pad + cols * (tw + pad), pad + rows * (th + lab + pad)), '#14171C')
d = ImageDraw.Draw(S); f = ImageFont.truetype(os.path.join(R, 'assets/fonts/Inter-Medium.otf'), 20)
for i, fn in enumerate(files):
    x = pad + (i % cols) * (tw + pad); y = pad + (i // cols) * (th + lab + pad)
    m = re.search(r'frame_0*([\d.]+)\.png', fn); t = float(m.group(1)) if m else 0
    d.text((x, y + 6), f'{int(t // 60)}:{t % 60:05.2f}', font=f, fill='#C9D3E0')
    S.paste(Image.open(fn).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lab))
S.save(out); print(out)
