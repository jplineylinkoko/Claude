# MOTION_RULES — règles de mouvement

Le moteur les applique. Toute nouvelle séquence doit les respecter.

## 1. Courbes : jamais d'interpolation linéaire
| Usage | Fonction (`engine/core.js`) | Réglage par défaut |
|---|---|---|
| Entrées d'éléments (textes, pastilles, cartes) | `E.spring` : ressort amorti analytique | ζ = 0,62–0,72, f = 1,5–1,7 Hz, soit 3 à 5 % de dépassement puis stabilisation |
| Mouvements de caméra (zoom, pano, recul) | `ease.expoInOut` ou `ease.cubicInOut` | 1,8 à 2,4 s |
| Départ d'un objet lourd | `ease.anticipate` | recul d'environ 4 % puis départ en expo |
| Trajectoires de particules / curseur | courbes de Bézier + `ease.expoOut` | traînée courte (6 % de la course) |
| Sorties | `ease.cubicIn` sur 0,45 s, vers le haut (masque) | — |
`E.lerp` ne sert qu'à mélanger deux valeurs ; sa progression passe toujours par une courbe.

## 2. Tempo : grille à 100 BPM
- 1 temps = 0,6 s. Les repères (`cues`) de `config/timing.json` sont exprimés **en temps**.
- Les apparitions clés tombent sur un temps entier, les détails sur un demi-temps.
- Dans un groupe, chaque élément est décalé de 40 à 80 ms (`stagger` de 0,05 à 0,07 s).
- La pépite respire sur un cycle de 4 temps (±3,5 % de rayon).

## 3. Continuité
- Aucune coupe ni fondu de l'écran entier, sauf l'image finale (fondu au noir des 0,8 dernières secondes).
- Chaque séquence peut prolonger ses sorties pendant une « traîne » (`tail`), dessinée sous la séquence suivante.
- La pépite est un objet unique. Chaque séquence lit l'état de sortie de la précédente (`E.S1`, `E.S2`…) et en repart exactement.
- Un élément qui sort se transforme en l'élément suivant (éclats → pépite, pépite → constellation, etc.).

## 4. Lisibilité et rythme
- Au plus 12 mots à l'écran à la fois. Le bandeau projet et le compteur « NN / 10 » ne comptent pas.
- Titres de 64 à 96 px. Le texte est révélé par masque, mot à mot ou ligne à ligne.
- Après chaque message clé, au moins 1,5 s de respiration sans nouvelle apparition.
- Voix off d'environ 150 mots/min : un message de N mots demande au moins N × 0,4 s d'écran.
- Marges de sécurité de 8 % (154 px / 86 px). La bande basse (y > 844 px) reste libre pour les sous-titres.

## 5. Profondeur
- Trois plans de poussière en parallaxe lente et continue, qui suivent la caméra à 25, 55 et 85 %.
- Le plan secondaire est flouté (`E.blur`), avec des ombres douces et un grain animé de 6 images en boucle (seedé).

## 6. Déterminisme
- `window.seek(t)` est une fonction pure : pas d'horloge, pas de `Math.random` (uniquement `E.rng(seed)`), aucun état qui dépende des images précédentes.
- Deux rendus de la même image `t` produisent des pixels identiques.
