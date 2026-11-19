// Séquence 7 — Un parcours qui part d'une vraie question
// {{PERSONA}} + {{PERSONA_QUESTION}} → curseur courbe et zooms sur les clics :
// Accueil → {{DOMAIN_1}} → {{TOPIC}} → Playbook ({{PLAYBOOK_EXCERPT}} surligné) →
// relance {{FOLLOW_UP_QUESTION}} → fiche {{DELIVERABLE_3}} : {{KEY_FACT_SUMMARY}}.
// Variante : --placeholders on (cadre « CAPTURE D'ÉCRAN – À INSÉRER ») ou média SCREEN.
(function () {
  const { W, H, ease } = E;
  const WIN = [580, 160, 1186, 1186 * 690 / 1240];
  const PAGES = ['home', 'domain', 'topic', 'playbook', 'keyfact'];
  const CLICK = ['c1', 'c2', 'c3', 'c4'];
  const HOTKEY = ['d1', 'topic', 'playbook', 'keyfact'];
  E.S7 = {};

  // position/zoom caméra : petite poussée sur chaque clic, zoom plus fort sur l'extrait et la fiche
  function camera(lt, X, hot) {
    const cue = X.cue; let s = 1, c = [W / 2, H / 2];
    CLICK.forEach((k, i) => { const p = hot[i]; if (!p) return; const z = E.prog(lt, cue(k) - 0.5, 0.6, ease.cubicInOut) * (1 - E.prog(lt, cue(k) + 0.35, 0.8, ease.cubicInOut)); if (z > 0) { s *= 1 + 0.12 * z; c = E.mixPt(c, p, z * 0.5); } });
    const zx = E.prog(lt, cue('zoomEx'), 1.4, ease.expoInOut) * (1 - E.prog(lt, cue('follow') - 0.6, 1.2, ease.expoInOut));
    if (zx > 0 && hot.ex) { s *= 1 + 0.32 * zx; c = E.mixPt(c, hot.ex, zx * 0.8); }
    const zk = E.prog(lt, cue('zoomKf'), 1.4, ease.expoInOut) * (1 - E.prog(lt, cue('kfOut'), 1.4, ease.expoInOut));
    if (zk > 0) { s *= 1 + 0.2 * zk; c = E.mixPt(c, [WIN[0] + WIN[2] * 0.45, WIN[1] + WIN[3] * 0.45], zk * 0.7); }
    // la fenêtre ne recouvre jamais la colonne persona ni le bandeau haut
    c[0] = Math.min(c[0], WIN[0] + (W / 2 - 560) / s); c[1] = Math.min(c[1], WIN[1] + (H / 2 - 100) / s);
    return { cx: c[0], cy: c[1], s };
  }
  // index de page courante + transition glissée
  function pageState(lt, X) {
    const cue = X.cue, list = [];
    let cur = 0; CLICK.forEach((k, i) => { if (lt >= cue(k) + 0.3) cur = i + 1; });
    const tr = cur > 0 ? E.prog(lt, cue(CLICK[cur - 1]) + 0.3, 0.7, ease.expoInOut) : 1;
    if (tr < 1) list.push({ name: PAGES[cur - 1], dx: -80 * tr, alpha: 1 - tr });
    list.push({ name: PAGES[cur], dx: 80 * (1 - tr), alpha: tr, main: true });
    return { cur, list };
  }

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X, cue = X.cue;
    if (o.tail) return;
    const m = (X.media || {}).SCREEN, ph = X.placeholders || !!m;
    // fenêtre : depuis la position de la séq. 6
    const wq = E.prog(lt, 0, 1.4, ease.expoInOut);
    const w0 = E.S6 ? E.S6.win : WIN;
    const r = w0.map((v, i) => E.lerp(v, WIN[i], wq));
    const blur = 5 * (1 - E.prog(lt, cue('sharp'), 1.2, ease.cubicInOut));
    const hl = E.prog(lt, cue('highlight'), 1.0, ease.expoInOut);

    // première passe sans caméra : points chauds de chaque page (cibles stables)
    const hot = [];
    const hk = [];
    PAGES.forEach((p, i) => { if (i > 3) return; const tmp = {}; hk[i] = p; });
    // calcul des cibles via un rendu fantôme (aucun pixel produit : globalAlpha 0)
    ctx.save(); ctx.globalAlpha = 0;
    const H0 = E.site.window(ctx, X, WIN, [{ name: 'home', alpha: 1, main: true }], {});
    const H1 = E.site.window(ctx, X, WIN, [{ name: 'domain', alpha: 1, main: true }], {});
    const H2 = E.site.window(ctx, X, WIN, [{ name: 'topic', alpha: 1, main: true }], {});
    const H3 = E.site.window(ctx, X, WIN, [{ name: 'playbook', alpha: 1, main: true, highlight: 1 }], {});
    ctx.restore();
    hot[0] = H0.d1; hot[1] = H1.topic; hot[2] = H2.playbook; hot[3] = H3.keyfact;
    const ex = H3.excerpt; hot.ex = ex ? [ex[0] + ex[2] / 2, ex[1] + ex[3] / 2] : null;

    const cam = camera(lt, X, hot);
    E.dust(ctx, X, cam);

    // ---- colonne persona (espace écran)
    const pIn = E.spring(lt, cue('persona'), { zeta: 0.7 });
    if (pIn > 0.001) {
      ctx.save(); ctx.globalAlpha = E.clamp(pIn * 1.4);
      E.dot(ctx, E.MX + 34, 214, 34 * Math.min(1, pIn), '#16406F');
      ctx.strokeStyle = B.cyan; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(E.MX + 34, 206, 10, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(E.MX + 34, 236, 17, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.restore();
    }
    E.text(ctx, lt, T.PERSONA.toUpperCase(), { x: E.MX + 86, y: 190, size: 19, minSize: 12, weight: 500, maxW: WIN[0] - E.MX - 120, maxLines: 2, color: S.inkSoft, track: 0.08, tIn: cue('persona') + 0.15, tOut: X.dur });
    const qBox = E.text(ctx, lt, T.PERSONA_QUESTION, { x: E.MX, y: 290, size: 40, minSize: 22, weight: 600, maxW: WIN[0] - E.MX - 50, maxLines: 6, color: S.ink, tIn: cue('question'), tOut: cue('follow') - 0.5, stagger: 0.05 });
    // relance
    const fIn = E.spring(lt, cue('follow') - 0.2, { zeta: 0.7 });
    if (fIn > 0.001) { ctx.save(); ctx.globalAlpha = E.clamp(fIn * 1.4); ctx.strokeStyle = E.rgba(B.amber, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(E.MX, 272); ctx.lineTo(E.MX + 60 * Math.min(1, fIn), 272); ctx.stroke(); ctx.restore(); }
    E.text(ctx, lt, T.FOLLOW_UP_QUESTION, { x: E.MX, y: 290, size: 40, minSize: 22, weight: 600, maxW: WIN[0] - E.MX - 50, maxLines: 6, color: S.ink, tIn: cue('follow'), tOut: X.dur, stagger: 0.05 });

    // ---- fenêtre (espace caméra)
    const ps = pageState(lt, X);
    ctx.save(); E.camera(ctx, cam.cx, cam.cy, cam.s);
    E.layer(ctx, blur * cam.s, 1, c2 => {
      if (ph) {
        E.mediaFrame(c2, X, 'SCREEN', r[0], r[1], r[2], r[3], lt, { r: 18, label: L.s7_slot, dur: 0 });
      } else {
        const list = ps.list.map(p => p.name === 'playbook' ? { ...p, highlight: hl } : p);
        E.site.window(c2, X, r, list, { tileLabels: wq });
      }
    });
    // pépite → curseur
    const route = [WIN[0] + WIN[2] * 0.55, WIN[1] + WIN[3] * 0.1];
    let cp = E.S6 && E.S6.pep ? E.mixPt(E.S6.pep, E.site.window ? hot[0] : route, 0) : hot[0];
    const startP = E.S6 && E.S6.pep ? [E.S6.pep[0] + (WIN[0] - E.S6.win[0]) * wq, E.S6.pep[1] + (WIN[1] - E.S6.win[1]) * wq] : hot[0];
    // trajectoires courbes successives : départ → d1 → topic → playbook → (extrait) → keyfact
    const legs = [[startP, hot[0], cue('m1'), cue('c1')], [hot[0], hot[1], cue('c1') + 0.9, cue('c2')], [hot[1], hot[2], cue('c2') + 0.9, cue('c3')], [hot[2], hot.ex ? [hot.ex[0] + 120, hot.ex[1] + 30] : hot[3], cue('c3') + 0.9, cue('highlight')], [hot.ex ? [hot.ex[0] + 120, hot.ex[1] + 30] : hot[3], hot[3], cue('follow') + 0.6, cue('c4')]];
    cp = startP;
    legs.forEach(([a, b, t0, t1], i) => { const u = E.prog(lt, t0, Math.max(0.4, t1 - t0 - 0.15), ease.expoInOut); if (u > 0) { const P = E.arcPath(a, b, i % 2 ? -0.22 : 0.22); cp = E.bez(...P, u); } });
    let click = 0; CLICK.forEach(k => { const c = (lt - cue(k)) / 0.7; if (c > 0 && c < 1) click = c; });
    const showCursor = !m;
    const curA = E.prog(lt, cue('m1') - 0.2, 0.5) * (1 - E.prog(lt, cue('c4') + 1.2, 0.6));
    if (showCursor) {
      // trace de la trajectoire en cours
      E.cursor(ctx, X, cp[0], cp[1], click, curA);
    }
    // pépite : sur le curseur pendant le parcours, puis sur la fiche
    const kf = E.prog(lt, cue('c4') + 0.8, 1.0, ease.expoInOut);
    const kfPt = [WIN[0] + 80 * WIN[2] / 1240, WIN[1] + 260 * WIN[2] / 1240];
    let pp = E.mixPt(cp, kfPt, kf);
    const leave = E.prog(lt, cue('kfOut') + 0.4, 1.4, ease.expoInOut);
    E.S7.end = [680, 470];
    ctx.restore();
    let ppS = E.toScreen(pp, cam);
    ppS = E.mixPt(ppS, E.S7.end, leave);
    E.pepite(ctx, X, ppS[0] - (kf < 1 && showCursor ? 0 : 0), ppS[1], E.lerp(7, 12, Math.max(kf, leave)), 1.15);
  }

  E.defineSeq(7, { defaultDur: 33, tail: 0, draw,
    cues: { persona: 0.5, question: 1.2, sharp: 4, m1: 5.5, c1: 9.5, c2: 15, c3: 20, highlight: 23.5, zoomEx: 24, follow: 31, c4: 35.5, zoomKf: 37.5, kfOut: 49.5 } });
})();
