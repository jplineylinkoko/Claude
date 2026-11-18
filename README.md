# Vidéo Knowledge Management — moteur de rendu déterministe

Ce projet produit une vidéo de 3:00 en 1920×1080 et 60 i/s, peinte image par image par du code. Il ne contient aucune donnée réelle : tous les textes spécifiques sont des variables `{{...}}`.

> État actuel : **étape 2**. Le moteur et les séquences 1 et 2 sont terminés. Les séquences 3 à 10 sont des gabarits provisoires.

## Prérequis (une fois)
- Node.js 18 ou plus, et ffmpeg dans le PATH.
- Playwright avec Chromium :

```bash
npm install playwright
```

```bash
npx playwright install chromium
```

## Remplacer les textes
1. Copiez `config/texts.json` hors du dépôt, par exemple dans `~/km/texts.json`.
2. Remplacez les valeurs fictives des blocs `en` et `fr`. Le bloc `_schema` indique le rôle et la longueur conseillée de chaque variable.
   Les textes trop longs passent à la ligne puis rétrécissent automatiquement.
3. Logo (facultatif) : renseignez `CLIENT_LOGO` avec le chemin d'une image, relatif au fichier `texts.json`.
4. Les textes fixes (titres, messages) se trouvent dans `config/strings.json`. Gardez 12 mots maximum à l'écran.

## Rendre la vidéo (une commande)

```bash
node tools/render.js --lang en --config ~/km/texts.json --out video_en.mp4
```

| Option | Effet |
|---|---|
| `--lang en\|fr` | langue (par défaut : `en`) |
| `--config <fichier>` | `texts.json` externe |
| `--placeholders on\|off` | cadres vides étiquetés « À INSÉRER » |
| `--range a b` | rendu partiel, de a à b secondes |
| `--frames 3.5,12,20` | images PNG isolées, dans `render/frames/` |
| `--scale 0.5` | aperçu en basse définition |
| `--workers 3` | nombre de rendus en parallèle |
| `--audio son.wav` | ajoute la piste son |

Encodage : H.264, CRF 16, yuv420p, `+faststart`.

## Recaler sur la voix off
Le minutage se règle dans `config/timing.json` :
- `dur` est la durée de chaque séquence, en secondes ;
- `cues` sont les repères internes, en temps musicaux (1 temps = 0,6 s à 100 BPM), comptés depuis le début de la séquence.

Il n'y a rien d'autre à modifier.

## Structure
- `engine/core.js` : moteur (`window.seek(t)` pur), ressorts, easing, texte masqué, pépite.
- `engine/seq/sNN.js` : un fichier par séquence.
- `config/` : thème, textes, minutage.
- `tools/render.js` : rendu image par image avec Playwright, puis encodage ffmpeg.
- `tools/sheet.py` : planches d'images-clés.
- `MOTION_RULES.md` : règles de mouvement.
- `docs/PLAN_ANIMATION.md` : plan d'animation.
