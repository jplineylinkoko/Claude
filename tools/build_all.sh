#!/usr/bin/env bash
# Production complète en UNE commande (hors session) :
#   bash tools/build_all.sh [chemin/vers/texts.json] [chemin/vers/media.json]
# Produit dans deliverables/ :
#   video_neutre_en.mp4, video_neutre_en_sans_son.mp4, video_neutre_fr.mp4,
#   video_placeholders_en.mp4, music.wav, sfx.wav, mix.wav, gabarits voix off / sous-titres.
set -euo pipefail
cd "$(dirname "$0")/.."
TEXTS=${1:-config/texts.json}
MEDIA=${2:-config/media.json}
OUT=deliverables; mkdir -p "$OUT"

echo "1/5 Bande son…";            python3 tools/audio.py
cp render/audio/music.wav render/audio/sfx.wav render/audio/mix.wav "$OUT"/
echo "2/5 Gabarits…";             python3 tools/templates.py && cp templates/* "$OUT"/
echo "3/5 Vidéo EN…";             node tools/render.js --lang en --config "$TEXTS" --media "$MEDIA" --audio render/audio/mix.wav --out "$OUT/video_neutre_en.mp4"
ffmpeg -y -loglevel error -i "$OUT/video_neutre_en.mp4" -an -c:v copy -movflags +faststart "$OUT/video_neutre_en_sans_son.mp4"
echo "4/5 Vidéo FR…";             node tools/render.js --lang fr --config "$TEXTS" --media "$MEDIA" --audio render/audio/mix.wav --out "$OUT/video_neutre_fr.mp4"
echo "5/5 Version placeholders…"; node tools/render.js --lang en --config "$TEXTS" --media "$MEDIA" --placeholders on --audio render/audio/mix.wav --out "$OUT/video_placeholders_en.mp4"
echo "Terminé → $OUT/"
