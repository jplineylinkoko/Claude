# Plan d'animation — étape 1 (à valider)

Format 1920×1080, 60 i/s, 3:00. Grille à 100 BPM : 1 temps (T) = 0,6 s, ½T = 0,3 s.
Repères de temps en secondes **absolues**. Ils seront recalculés depuis `config/timing.json` une fois la voix off enregistrée : chaque beat est défini **relativement au début de sa séquence**, en temps.
Zone utile : marges de 8 % (154 px / 86 px). La bande basse (y > 844 px) reste libre pour les sous-titres.

**Fil rouge : la pépite.** C'est un seul objet, avec un état continu (`x, y, rayon, forme, intensité`). Chaque séquence reçoit l'état de sortie de la précédente comme état d'entrée, ce qui exclut toute coupe. Ses formes successives : point → rayonnement → 3 éclats → point → constellation → cible → bulle → cadre vidéo → onde → 3 documents → nœud d'arborescence → point de surlignage / curseur → tracé de jauge → cadre vidéo → chapiteau des piliers → réseau → point final.

---

## 1. Pourquoi agir ? — 0:00 → 0:15 (25 T)
| t | Beat | Pépite / morphing |
|---|---|---|
| 0.0–1.2 | Fond, la silhouette d'expert (buste au trait fin) se dessine par tracé progressif | la pépite naît à l'emplacement de la tête (ressort, petit dépassement) |
| 1.8–4.2 | Des pépites rayonnent depuis la tête et se regroupent en 3 éclats : « Savoirs », « Savoir-faire », `{{EXPERIENCE_LABEL}}` (décalage de 60 ms) | 1 → n particules → 3 amas |
| 4.8–7.2 | En filigrane, flou de profondeur : « Retraite », « Mobilité », « Réorganisation » | — |
| 7.2–9.6 | La silhouette recule (dolly arrière, ease expo), les éclats pâlissent | l'intensité baisse à 35 % |
| 9.6–13.5 | Question révélée par masque, en deux temps (voir la question n° 2) | un seul éclat reste ambre |
| 13.5–15 | Respiration de 1,5 s | les 3 éclats glissent vers le centre (état de sortie) |

## 2. Deux types de connaissance — 0:15 → 0:27 (20 T)
| t | Beat | Pépite |
|---|---|---|
| 15.0–16.2 | Les éclats se rassemblent en un point | 3 → 1 |
| 16.2–17.4 | Un séparateur vertical s'ouvre et l'écran se divise | la pépite passe à droite |
| 17.4–20.4 | Gauche : « Formalisée » + 3 items en gris froid ; droite : « Tacite » + 3 items, reliés à la pépite par des fils | orbite lente |
| 20.4–22.8 | La gauche se désature puis s'efface (opacité vers 0, flou) ; zoom caméra à droite (ease cubic) | la pépite grossit avec le zoom |
| 22.8–25.2 | « Notre focus : la connaissance tacite. » | — |
| 25.2–27 | Respiration | sortie : pépite au centre, rayon maximal |

## 3. Identifier la connaissance critique — 0:27 → 0:47 (~33 T)
| t | Beat | Pépite |
|---|---|---|
| 27.0–28.8 | La pépite éclate en constellation dense (~300 points, parallaxe sur 3 plans) | 1 → constellation |
| 28.8–33.0 | Difficulté 1 : « Beaucoup de connaissances : que prioriser ? » (amas qui scintille) | — |
| 33.0–37.2 | Difficulté 2 : « Peu de temps : comment valoriser chaque échange ? » (fin arc de sablier autour de l'amas) | — |
| 37.2–40.2 | 3 faisceaux entrent depuis la gauche (un par temps) : Cycle / Projets / Champs → cible « Connaissance critique » ; le reste s'éteint | la constellation converge vers le centre de la cible |
| 40.2–42.6 | La cible se résout en deux colonnes `{{DOMAIN_1}}` / `{{DOMAIN_2}}` | la pépite se divise, puis se recentre au-dessus des colonnes |
| 42.6–45.3 | « Identifier ce qui est critique, pour ne pas avoir à tout capturer. » (12 mots) | — |
| 45.3–47 | Respiration | les colonnes se replient, la pépite devient une bulle |

## 4. Faire expliciter ce qui a de la valeur — 0:47 → 1:12 (~42 T)
| t | Beat | Pépite |
|---|---|---|
| 47.0–49.4 | La bulle de dialogue affiche « Ça, tout le monde le sait… » | point → bulle (morphing de contour) |
| 49.4–51.2 | Un trait barre la phrase (tracé ambre, ease expo) | — |
| 51.2–54.8 | Un guide d'entretien (carte, lignes grisées) arrive ; une question se détache et monte au premier plan | — |
| 54.8–58.0 | « Si un nouveau arrivait demain, quels seraient vos trois conseils ? » | — |
| 58.0–59.2 | La bulle s'ouvre en cadre 16:9 | bulle → rectangle arrondi |
| 59.2–71.2 | **CADRE VIDÉO VIDE, 12 s** — « EXTRAIT D'ENTRETIEN – À INSÉRER », avec une onde discrète au bas du cadre | liseré ambre animé |
| 71.2–72 | Le cadre se réduit vers l'onde | cadre → onde |

## 5. Transformer la parole en contenus — 1:12 → 1:30 (30 T)
| t | Beat | Pépite |
|---|---|---|
| 72.0–74.4 | L'onde vocale se résout en lignes de transcription (grisées) | onde → lignes |
| 74.4–77.4 | Les lignes se regroupent en blocs structurés ; une pastille « relecture humaine » (icône œil + coche) s'allume | — |
| 77.4–79.8 | Le document se divise en 3 cartes | 1 → 3 |
| 79.8–87.0 | Défilé des extraits factices : « Récit d'expert » (le raisonnement), « Playbook » (la vue d'ensemble), `{{DELIVERABLE_3}}` (une page, mise en avant : plus grande, liseré ambre) | point ambre sur la 3e carte |
| 87.0–90 | Respiration ; les cartes s'envolent vers le haut | 3 cartes → feuilles d'arborescence |

## 6. Une architecture pensée pour retrouver — 1:30 → 1:50 (~33 T)
| t | Beat | Pépite |
|---|---|---|
| 90.0–94.2 | Les documents se rangent : Accueil → `{{DOMAIN_1}}`/`{{DOMAIN_2}}` → sujets → catégories (les connecteurs se tracent par niveau) | la pépite parcourt l'arbre |
| 94.2–97.8 | Zoom sur une fiche ; 4 étiquettes s'allument une par une, une par temps | — |
| 97.8–101.4 | Des flux partent vers « Vues filtrées » et « Recherche » | 2 particules |
| 101.4–105.0 | Recul de la caméra : l'arbre devient la page d'accueil de `{{SITE_NAME}}` (morphing nœuds → tuiles) | nœud → tuile active |
| 105.0–108.3 | « Rangé une fois, retrouvé sous plusieurs angles. » | — |
| 108.3–110 | Respiration | — |

## 7. Un parcours qui part d'une vraie question — 1:50 → 2:23 (55 T)
| t | Beat |
|---|---|
| 110.0–113.6 | Carte `{{PERSONA}}` + bulle `{{PERSONA_QUESTION}}` (la maquette se met en retrait, floue) |
| 113.6–117.2 | Clic sur « Accueil → `{{DOMAIN_1}}` » : curseur sur courbe de Bézier, onde de clic, zoom de 1,15× sur la cible |
| 117.2–121.4 | Clic sur `{{TOPIC}}` ; transition de page par glissement |
| 121.4–127.4 | Playbook : `{{PLAYBOOK_EXCERPT}}` surligné (pépite = début du surligneur) puis respiration |
| 127.4–131.0 | Relance : `{{FOLLOW_UP_QUESTION}}` |
| 131.0–139.4 | Ouverture de la fiche `{{DELIVERABLE_3}}` : `{{KEY_FACT_SUMMARY}}` en grand dans la fiche |
| 139.4–143 | Respiration ; la pépite quitte la fiche |

Variante `--placeholders on` : la fenêtre de la maquette devient un cadre vide « CAPTURE D'ÉCRAN – À INSÉRER ». Le curseur et les zooms restent identiques, pour caler une vraie capture.

## 8. Ce qu'en disent les utilisateurs — 2:23 → 2:35 (20 T)
| t | Beat |
|---|---|
| 143.0–147.8 | La pépite trace 2 jauges en arc : `{{SCORE_1}}`/`{{SCORE_MAX}}` `{{SCORE_1_LABEL}}`, puis `{{SCORE_2}}`/`{{SCORE_MAX}}` ; source `{{TEST_SOURCE}}` en petit |
| 147.8–149 | L'arc de la jauge 2 s'étire en cadre |
| 149.0–155.0 | **CADRE VIDÉO VIDE, 6 s** — « VERBATIM UTILISATEUR – À INSÉRER » |

## 9. Les conditions pour que ça dure — 2:35 → 2:47 (20 T)
| t | Beat |
|---|---|
| 155.0–158.6 | 3 piliers se posent, un par temps, avec rebond amorti : « Règles communes », « Rôles clairs », « Routines » ; la pépite devient le chapiteau |
| 158.6–165.2 | Un guide s'ouvre en liseuse sur l'accueil (cadre vide « GUIDE – À INSÉRER ») |
| 165.2–167 | Respiration ; la pépite se détache |

## 10. Passer à l'échelle — 2:47 → 3:00 (~22 T)
| t | Beat |
|---|---|
| 167.0–170.6 | La pépite se duplique (1 → 3 → 9 → n), formant un réseau d'experts et de domaines ; le fond glisse vers le bleu nuit |
| 170.6–174.2 | Leviers : « Répliquer », « Faire vivre », « Transmettre » (un par temps) |
| 174.2–178.4 | Le réseau se contracte, une seule pépite reste ; question finale : « Quels savoirs critiques souhaitez-vous sécuriser dans vos équipes ? » |
| 178.4–180 | Respiration ; la dernière image seulement : fondu au noir |

---

## Style frames (`styleframes/`)
Trois moments sont comparés : séq. 2 (division de l'écran), séq. 3 (convergence), séq. 7 (maquette intranet).
- **A — Clair chaud** : fond `#F5F1EA`, encre bleu nuit. C'est le plus « éditorial papier », avec la meilleure lisibilité en salle éclairée.
- **B — Bleu nuit profond** : fond `#0B2E59` → `#061A36`. La pépite y brille le plus, mais le rendu est plus « tech » et plus fragile sur un projecteur.
- **C — Hybride** : base claire ; les séq. 2 et 10 passent au bleu nuit par un fondu de fond continu (sans coupe), ce qui crée deux moments de contraste dramatique.

Recommandation : **C**. La base claire garde la sobriété éditoriale et la lisibilité en réunion. Les deux plongées dans le bleu nuit donnent un relief émotionnel au « focus tacite » et à la conclusion, qui finit de toute façon sur fond bleu nuit selon le brief.
