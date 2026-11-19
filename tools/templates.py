"""Gabarits de voix off et de sous-titres, recalculés depuis config/timing.json.

    python3 tools/templates.py   → templates/voiceover_script_{en,fr}.txt, templates/subtitles_{en,fr}.srt

Débit de référence : 150 mots/min (2,5 mots/s). Sous-titres : 42 caractères max par ligne,
2 lignes max par bloc. Les variables {{...}} sont les mêmes que dans config/texts.json.
"""
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
T = json.load(open(os.path.join(ROOT, 'config/timing.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'templates'); os.makedirs(OUT, exist_ok=True)

# Repères éditoriaux (à l'écran) et variables utiles, par séquence
NOTES = {
    'fr': {
        1: ("Pourquoi agir ?", "Savoirs · Savoir-faire · {{EXPERIENCE_LABEL}} · question en deux temps", []),
        2: ("Deux types de connaissance", "Formalisée / Tacite · « Notre focus : la connaissance tacite. »", []),
        3: ("Identifier la connaissance critique", "2 difficultés · 3 faisceaux · {{DOMAIN_1}} / {{DOMAIN_2}}", ['{{DOMAIN_1}}', '{{DOMAIN_2}}']),
        4: ("Faire expliciter ce qui a de la valeur", "Bulle barrée · guide d'entretien · EXTRAIT D'ENTRETIEN (12 s, son réel)", []),
        5: ("Transformer la parole en contenus", "Relecture humaine · Récit d'expert · Playbook · {{DELIVERABLE_3}}", ['{{DELIVERABLE_3}}']),
        6: ("Une architecture pensée pour retrouver", "Arborescence · Vues filtrées · Recherche · {{SITE_NAME}}", ['{{SITE_NAME}}']),
        7: ("Un parcours qui part d'une vraie question", "{{PERSONA}} · {{PERSONA_QUESTION}} · {{PLAYBOOK_EXCERPT}} · {{FOLLOW_UP_QUESTION}} · {{KEY_FACT_SUMMARY}}", ['{{PERSONA}}', '{{PERSONA_QUESTION}}', '{{FOLLOW_UP_QUESTION}}']),
        8: ("Ce qu'en disent les utilisateurs", "{{SCORE_1}}/{{SCORE_MAX}} {{SCORE_1_LABEL}} · {{SCORE_2}}/{{SCORE_MAX}} {{SCORE_2_LABEL}} · VERBATIM (6 s, son réel)", ['{{SCORE_1}}', '{{SCORE_2}}']),
        9: ("Les conditions pour que ça dure", "Règles communes · Rôles clairs · Routines · guide", []),
        10: ("Passer à l'échelle", "Répliquer · Faire vivre · Transmettre · question finale", []),
    },
    'en': {
        1: ("Why act?", "Knowledge · Know-how · {{EXPERIENCE_LABEL}} · two-part question", []),
        2: ("Two kinds of knowledge", "Explicit / Tacit · “Our focus: tacit knowledge.”", []),
        3: ("Identifying critical knowledge", "2 challenges · 3 beams · {{DOMAIN_1}} / {{DOMAIN_2}}", ['{{DOMAIN_1}}', '{{DOMAIN_2}}']),
        4: ("Making what matters explicit", "Struck-out bubble · interview guide · INTERVIEW EXCERPT (12 s, real audio)", []),
        5: ("Turning speech into content", "Human review · Expert story · Playbook · {{DELIVERABLE_3}}", ['{{DELIVERABLE_3}}']),
        6: ("An architecture built to be found", "Tree · Filtered views · Search · {{SITE_NAME}}", ['{{SITE_NAME}}']),
        7: ("A journey that starts with a real question", "{{PERSONA}} · {{PERSONA_QUESTION}} · {{PLAYBOOK_EXCERPT}} · {{FOLLOW_UP_QUESTION}} · {{KEY_FACT_SUMMARY}}", ['{{PERSONA}}', '{{PERSONA_QUESTION}}', '{{FOLLOW_UP_QUESTION}}']),
        8: ("What users say", "{{SCORE_1}}/{{SCORE_MAX}} {{SCORE_1_LABEL}} · {{SCORE_2}}/{{SCORE_MAX}} {{SCORE_2_LABEL}} · TESTIMONIAL (6 s, real audio)", ['{{SCORE_1}}', '{{SCORE_2}}']),
        9: ("Conditions for it to last", "Shared rules · Clear roles · Routines · guide", []),
        10: ("Scaling up", "Replicate · Keep it alive · Pass it on · final question", []),
    }
}
# fenêtres SANS voix off (son réel des extraits) : (séquence, repère, durée s)
SILENT = [(4, 'clip', 12), (8, 'clip', 6)]
LBL = {'fr': ('SÉQUENCE', 'Durée', 'Mots max (150 mots/min)', 'À l\'écran', 'Texte de voix off', 'Pas de voix off', 'Variables utilisables'),
       'en': ('SEQUENCE', 'Duration', 'Max words (150 wpm)', 'On screen', 'Voice-over text', 'No voice-over', 'Usable variables')}


def tc(s, srt=False):
    h, r = divmod(s, 3600); m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(r):02d},{int(round((r % 1) * 1000)) % 1000:03d}" if srt else f"{int(m):d}:{r:05.2f}"


seqs = []; acc = 0
for s in T['sequences']:
    seqs.append({**s, 'start': acc}); acc += s['dur']
beat = 60 / T['bpm']

for lang in ('fr', 'en'):
    L = LBL[lang]
    # ---------------- voix off
    lines = [f"# {'GABARIT DE VOIX OFF' if lang == 'fr' else 'VOICE-OVER TEMPLATE'} — {acc:.0f} s — 150 {'mots/min' if lang == 'fr' else 'wpm'}",
             "# " + ("Remplacez les crochets par votre texte. Les {{VARIABLES}} reprennent config/texts.json." if lang == 'fr' else "Replace the brackets with your text. {{VARIABLES}} match config/texts.json."),
             "# " + ("Après enregistrement, reportez les durées réelles dans config/timing.json puis relancez templates.py." if lang == 'fr' else "After recording, put the real durations into config/timing.json, then rerun templates.py."), ""]
    for s in seqs:
        title, onscreen, vars_ = NOTES[lang][s['id']]
        sil = sum(d for (q, c, d) in SILENT if q == s['id'])
        words = int((s['dur'] - sil - 1.5) * 2.5)
        lines += [f"=== {L[0]} {s['id']:02d} — {title} — {tc(s['start'])} → {tc(s['start'] + s['dur'])}",
                  f"{L[1]} : {s['dur']:.1f} s   ·   {L[2]} : ≈ {words}", f"{L[3]} : {onscreen}"]
        for (q, c, d) in SILENT:
            if q == s['id']:
                t0 = s['start'] + s['cues'].get(c, 0) * beat
                lines.append(f"{L[5]} : {tc(t0)} → {tc(t0 + d)}")
        if vars_: lines.append(f"{L[6]} : {' '.join(vars_)}")
        lines += [f"{L[4]} :", f"[VO {s['id']:02d} — {'à compléter' if lang == 'fr' else 'to write'}]", ""]
    open(os.path.join(OUT, f'voiceover_script_{lang}.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- sous-titres : 2 blocs par séquence, hors fenêtres sans voix off
    srt = []; n = 1
    for s in seqs:
        spans = [(s['start'] + 0.3, s['start'] + s['dur'] - 0.3)]
        for (q, c, d) in SILENT:
            if q == s['id']:
                t0 = s['start'] + s['cues'].get(c, 0) * beat
                spans = [(spans[0][0], t0 - 0.2), (t0 + d + 0.2, spans[0][1])]
        k = 1; parts = []
        for a, b in spans:
            if b - a < 1.0: continue
            mid = (a + b) / 2
            parts += [(a, mid - 0.05), (mid + 0.05, b)] if b - a > 6 else [(a, b)]
        for (a, b) in parts:
            l1 = (f"[Séq. {s['id']} — sous-titre {k}/{len(parts)}]" if lang == 'fr' else f"[Seq. {s['id']} — subtitle {k}/{len(parts)}]")
            l2 = "[ligne 2, 42 caractères max]" if lang == 'fr' else "[line 2, 42 characters max]"
            if s['id'] == 7 and k == 1: l2 = "{{PERSONA_QUESTION}}"
            if s['id'] == 7 and k == len(parts): l2 = "{{FOLLOW_UP_QUESTION}}"
            assert len(l1) <= 42 and len(l2) <= 42
            srt += [str(n), f"{tc(a, True)} --> {tc(b, True)}", l1, l2, ""]
            n += 1; k += 1
    open(os.path.join(OUT, f'subtitles_{lang}.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
print('→ templates/ (voix off + sous-titres FR/EN)')
