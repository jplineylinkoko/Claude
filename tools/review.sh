#!/usr/bin/env bash
# Boucle de critique : planche de 30 images-clés + GIF basse définition par séquence.
#   bash tools/review.sh [lang] [config]   → render/review/
set -e
cd "$(dirname "$0")/.."
LANG_=${1:-fr}; CFG=${2:+--config $2}
OUT=render/review; rm -rf $OUT; mkdir -p $OUT
TIMES=$(python3 -c "print(','.join(str(round(3+i*6,2)) for i in range(30)))")
node tools/render.js --lang $LANG_ $CFG --frames $TIMES --out $OUT/frames >/dev/null
python3 tools/sheet.py $OUT/planche.png 6 $OUT/frames/*.png
node tools/render.js --lang $LANG_ $CFG --scale 0.25 --fps 12 --out $OUT/preview.mp4 >/dev/null
python3 - "$OUT" <<'PY'
import json, subprocess, sys
out = sys.argv[1]; t = json.load(open('config/timing.json')); acc = 0
for s in t['sequences']:
    subprocess.run(['ffmpeg','-loglevel','error','-y','-ss',str(acc),'-t',str(s['dur']),'-i',f'{out}/preview.mp4','-vf','fps=10,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',f"{out}/seq{s['id']:02d}.gif"], check=True)
    acc += s['dur']
PY
echo "→ $OUT"
