# Planche comparative des style frames : python3 tools/board.py
from PIL import Image, ImageDraw, ImageFont
import os
R = os.path.join(os.path.dirname(__file__), '..')
out = os.path.join(R, 'styleframes/out')
rows = [('A — Clair chaud', ['s2_A_clair', 's3_A_clair', 's7_A_clair']),
        ('B — Bleu nuit profond', ['s2_B_nuit', 's3_B_nuit', 's7_B_nuit']),
        ('C — Hybride (séq. 2 et 10 sombres)', ['s2_B_nuit', 's3_A_clair', 's7_A_clair'])]
tw, th, pad, lab = 960, 540, 24, 64
W = pad + 3 * (tw + pad); H = pad + 3 * (th + lab + pad)
board = Image.new('RGB', (W, H), '#1B1F26'); d = ImageDraw.Draw(board)
f = ImageFont.truetype(os.path.join(R, 'assets/fonts/Inter-SemiBold.otf'), 30)
fs = ImageFont.truetype(os.path.join(R, 'assets/fonts/Inter-Regular.otf'), 22)
cols = ['Séq. 2 — Deux types', 'Séq. 3 — Connaissance critique', 'Séq. 7 — Parcours']
for r, (name, files) in enumerate(rows):
    y = pad + r * (th + lab + pad)
    d.text((pad, y + 14), name, font=f, fill='#F3F6FA')
    for c, fn in enumerate(files):
        x = pad + c * (tw + pad)
        if c: d.text((x, y + 22), cols[c], font=fs, fill='#9AA8BB')
        else: d.text((x + 560, y + 22), cols[c], font=fs, fill='#9AA8BB')
        board.paste(Image.open(os.path.join(out, fn + '.png')).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lab))
board.save(os.path.join(R, 'styleframes/planche_style_frames.png'))
for name, files in rows:
    key = name[0]
    s = Image.new('RGB', (1920, 1080 * 3))
    for i, fn in enumerate(files): s.paste(Image.open(os.path.join(out, fn + '.png')).convert('RGB'), (0, 1080 * i))
    s.save(os.path.join(R, f'styleframes/style_frame_{key}.png'))
print('ok')
