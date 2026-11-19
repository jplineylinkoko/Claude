# Vidéo Knowledge Management — moteur de rendu déterministe

Ce projet produit une vidéo de 3:00 en 1920×1080 et 60 i/s, en style « bleu nuit » (style B). Chaque image est peinte par du code (canvas), puis capturée avec Playwright et encodée par ffmpeg.
**Aucune donnée réelle** ne figure dans le projet. Tous les textes spécifiques sont des variables `{{...}}`, et les extraits vidéo sont des emplacements à remplir.

---

## 1. Prérequis (une seule fois)
- Node.js 18 ou plus, Python 3.10 ou plus avec `numpy`, et ffmpeg 6 ou plus dans le PATH.
- Les dépendances Node, puis le navigateur Chromium :

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
pip install numpy
```

## 2. Tout produire en une commande

```bash
bash tools/build_all.sh ~/km/texts.json ~/km/media.json
```

Les deux arguments sont facultatifs. Par défaut, le script utilise `config/texts.json` et `config/media.json`.
Il écrit les fichiers suivants dans `deliverables/` :

| Fichier | Contenu |
|---|---|
| `video_neutre_en.mp4` | anglais, avec son |
| `video_neutre_en_sans_son.mp4` | anglais, sans son |
| `video_neutre_fr.mp4` | français, avec son |
| `video_placeholders_en.mp4` | cadres vides étiquetés « … – TO INSERT » |
| `music.wav`, `sfx.wav`, `mix.wav` | nappe, effets, mix à -16 LUFS |
| `voiceover_script_{en,fr}.txt`, `subtitles_{en,fr}.srt` | gabarits à compléter |

Comptez environ 30 minutes par vidéo sur une machine à 4 cœurs.

## 3. Remplacer les textes : `texts.json`
1. Copiez `config/texts.json` hors du dépôt, par exemple dans `~/km/texts.json`.
2. Remplacez les valeurs des blocs `en` et `fr`. Le bloc `_schema` donne, pour chaque variable, **son rôle et sa longueur conseillée**.
   - Un texte trop long passe à la ligne, puis rétrécit automatiquement. Le rendu a été testé avec des valeurs deux fois plus longues que les valeurs fictives.
   - Scores : `SCORE_1`, `SCORE_2` et `SCORE_MAX` doivent être des nombres (ex. `4,2` et `5`), sinon la jauge s'affiche à une valeur par défaut.
   - Logo : renseignez `CLIENT_LOGO` avec le chemin d'une image (PNG ou SVG), relatif au fichier `texts.json`. Laissez le champ vide pour n'afficher aucun logo.
3. Les textes fixes (titres, messages, leviers) se trouvent dans `config/strings.json`. Ils peuvent contenir des `{{VARIABLES}}`. Gardez au plus 12 mots à l'écran.

## 4. Insérer les éléments manquants : `media.json`
Copiez `config/media.json`, puis indiquez pour chaque emplacement un fichier, dont le chemin est relatif à ce `media.json` :

| Emplacement | Séquence | Durée | Type de fichier |
|---|---|---|---|
| `INTERVIEW` | 4 — extrait d'entretien | 12 s | vidéo 16:9 (le son est mixé) |
| `VERBATIM` | 8 — verbatim utilisateur | 6 s | vidéo 16:9 (le son est mixé) |
| `SCREEN` | 7 — capture du vrai site | tout le parcours | image ou vidéo 16:9 (≈ 1240×690) ; remplace la maquette |
| `GUIDE` | 9 — guide utilisateur en liseuse | ≈ 7 s | image (`"fit": "contain"`) |

Options de chaque emplacement :
- `start` : la seconde de départ dans la vidéo source ;
- `audio` : `true` pour mixer le son du clip, qui est ensuite normalisé avec le reste à -16 LUFS ;
- `gain_db` : le volume du clip ;
- `fit` : `cover` (le média remplit le cadre) ou `contain` (le média est entièrement visible).

Quand un emplacement est vide, la version neutre affiche un fond abstrait discret, et `--placeholders on` affiche le cadre étiqueté « À INSÉRER », avec un compteur de temps pour caler le montage.

Exemple :

```json
{ "INTERVIEW": { "file": "clips/entretien.mp4", "start": 83.5, "audio": true, "fit": "cover" } }
```

## 5. Recaler sur la voix off : `timing.json`
- `dur` est la durée de chaque séquence, en secondes.
- `cues` sont les repères internes, en **temps musicaux** (1 temps = 0,6 s à 100 BPM), comptés depuis le début de la séquence. Par exemple, `"q": 13.5` place la question finale 8,1 s après le début de la séquence 10.

Après modification, relancez `build_all.sh`. Ou, pour un contrôle rapide :

```bash
bash tools/review.sh fr
```

Cette commande produit en environ 1 minute, dans `render/review/`, une planche de 30 images et une GIF par séquence.

Les sons sont calés sur les mêmes repères (`config/sound.json`). Les gabarits de voix off et de sous-titres se recalculent avec :

```bash
python3 tools/templates.py
```

## 6. Commandes de rendu détaillées

```bash
node tools/render.js --lang fr --config ~/km/texts.json --media ~/km/media.json --out ma_video.mp4
```

| Option | Effet |
|---|---|
| `--lang en\|fr` | langue |
| `--config <texts.json>` | textes externes |
| `--media <media.json>` | médias réels |
| `--placeholders on\|off` | cadres vides étiquetés |
| `--range a b` | rendu partiel, de a à b secondes |
| `--frames 3.5,12,20` | images PNG isolées |
| `--audio mix.wav` | ajoute le son |
| `--scale 0.25 --fps 12` | aperçu rapide |
| `--workers 3` | nombre de rendus en parallèle |

Encodage : H.264, CRF 16, yuv420p, `+faststart`. Le rendu est déterministe : une même image donne toujours les mêmes pixels.

## 7. Structure
```
config/      theme.json · texts.json · strings.json · timing.json · media.json · sound.json
engine/      core.js (seek(t) pur) · kit.js (formes, médias) · site.js (maquette intranet) · seq/s01…s10.js
tools/       render.js · build_all.sh · review.sh · audio.py · templates.py · sheet.py · sync-cues.js
templates/   gabarits voix off et sous-titres
docs/        PLAN_ANIMATION.md     MOTION_RULES.md : règles de mouvement
assets/fonts Inter (licence OFL, fichier joint)
```

## 8. Limites connues
- Le son est synthétisé par code et n'a pas pu être écouté pendant la production : il est à valider à l'oreille. Pour l'ajuster, modifiez les volumes et les événements dans `config/sound.json`.
- Les libellés d'interface de la maquette (menu, fil d'Ariane, en 16 à 22 px) sont traités comme de l'habillage et ne comptent pas dans la règle des 12 mots.
