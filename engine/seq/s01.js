// Séquence 1 — Pourquoi agir ?
// Silhouette d'expert → la pépite naît dans la tête → rayonne en 3 éclats →
// filigranes (retraite, mobilité, réorganisation) → la silhouette s'éloigne,
// les éclats pâlissent → question en deux temps (≤ 12 mots à l'écran).
(function () {
  const { W, H, ease } = E;
  const HEAD = [640, 380], HR = 92;
  const CL = [[1180, 300], [1345, 505], [1180, 710]];
  const ANCHOR = [900, 240], GS = 0.55; // point de fuite du recul
  const N = 72, PARTS = [];
  { const r = E.rng(11); for (let i = 0; i < N; i++) { const a = r() * 6.2832, d = 10 + Math.sqrt(r()) * 40; PARTS.push({ k: i % 3, a, d, delay: i * 0.026 + r() * 0.05, bend: (r() - 0.5) * 300, s: 1.3 + r() * 2.2, w: (r() - 0.5) * 0.5, cyan: r() < 0.3 }); } }

  // Transformation de groupe (recul) — pure
  function group(lt, X) { const p = E.prog(lt, X.cue('recede'), 2.4, ease.expoInOut); return { p, s: E.lerp(1, GS, p) }; }
  const gpt = (pt, g) => [ANCHOR[0] + (pt[0] - ANCHOR[0]) * g.s, ANCHOR[1] + (pt[1] - ANCHOR[1]) * g.s];

  // Position écran d'une particule d'éclat à l'instant local lt (prolongeable au-delà de dur)
  function part(i, lt, X) {
    const P = PARTS[i], te = X.cue('radiate') + P.delay;
    const q = E.prog(lt, te, 1.35, ease.expoOut);
    const ang = P.a + (lt - te) * P.w; // dérive orbitale lente
    const tgt = [CL[P.k][0] + Math.cos(ang) * P.d, CL[P.k][1] + Math.sin(ang) * P.d * 0.85];
    const mid = [(HEAD[0] + tgt[0]) / 2, (HEAD[1] + tgt[1]) / 2], dx = tgt[0] - HEAD[0], dy = tgt[1] - HEAD[1], L = Math.hypot(dx, dy);
    const c = [mid[0] - dy / L * P.bend, mid[1] + dx / L * P.bend];
    const bz = u => [(1 - u) * (1 - u) * HEAD[0] + 2 * (1 - u) * u * c[0] + u * u * tgt[0], (1 - u) * (1 - u) * HEAD[1] + 2 * (1 - u) * u * c[1] + u * u * tgt[1]];
    const g = group(lt, X);
    return { pos: gpt(bz(q), g), prev: gpt(bz(Math.max(0, q - 0.06)), g), q, s: P.s * E.lerp(1, 0.8, g.p), k: P.k, cyan: P.cyan, started: lt >= te };
  }
  function pale(lt, X) { return 1 - 0.6 * group(lt, X).p; }
  function coreR(k, lt, X) { return 6.5 * E.spring(lt, X.cue('radiate') + 1.15 + k * 0.07, { zeta: 0.55, freq: 1.6 }); }
  E.S1 = { N, part, pale, coreR, CL, group, gpt };

  function silhouette(ctx, lt, X, alpha) {
    const { S, B } = X;
    const ph = E.prog(lt, X.cue('silhouette'), 1.1, ease.cubicInOut), pb = E.prog(lt, X.cue('silhouette') + 0.3, 1.6, ease.cubicInOut);
    if (ph <= 0 || alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    // aura de savoir dans la tête
    const ga = E.prog(lt, X.cue('birth'), 1.2, ease.cubicOut);
    const g = ctx.createRadialGradient(HEAD[0], HEAD[1], 0, HEAD[0], HEAD[1], HR * 1.4);
    g.addColorStop(0, E.rgba(B.cyan, 0.16 * ga)); g.addColorStop(1, E.rgba(B.cyan, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(HEAD[0], HEAD[1], HR * 1.4, 0, 6.2832); ctx.fill();
    // corps : remplissage doux + trait fin révélé
    // buste : épaules en pente douce (trapèzes), cou, tête ovale
    const body = new Path2D();
    body.moveTo(372, 840); body.bezierCurveTo(376, 700, 432, 622, 548, 598); body.bezierCurveTo(588, 590, 604, 572, 606, 530);
    body.moveTo(674, 530); body.bezierCurveTo(676, 572, 692, 590, 732, 598); body.bezierCurveTo(848, 622, 904, 700, 908, 840);
    const fill = new Path2D();
    fill.moveTo(372, 840); fill.bezierCurveTo(376, 700, 432, 622, 548, 598); fill.bezierCurveTo(588, 590, 604, 572, 606, 530);
    fill.lineTo(674, 530); fill.bezierCurveTo(676, 572, 692, 590, 732, 598); fill.bezierCurveTo(848, 622, 904, 700, 908, 840); fill.closePath();
    const fg = ctx.createLinearGradient(0, 530, 0, 840);
    fg.addColorStop(0, E.rgba(S.line, 0.10 * pb)); fg.addColorStop(1, E.rgba(S.line, 0));
    ctx.fillStyle = fg; ctx.fill(fill);
    const hg = ctx.createRadialGradient(HEAD[0] - 20, HEAD[1] - 30, 0, HEAD[0], HEAD[1], HR);
    hg.addColorStop(0, E.rgba(S.line, 0.10 * ph)); hg.addColorStop(1, E.rgba(S.line, 0.03 * ph));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(HEAD[0], HEAD[1], HR * 0.84, HR, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = E.rgba(S.ink, 0.82); ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.setLineDash([560 * ph, 700]); ctx.beginPath(); ctx.ellipse(HEAD[0], HEAD[1], HR * 0.84, HR, 0, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    const sg = ctx.createLinearGradient(0, 520, 0, 840); sg.addColorStop(0, E.rgba(S.ink, 0.82)); sg.addColorStop(0.7, E.rgba(S.ink, 0.5)); sg.addColorStop(1, E.rgba(S.ink, 0));
    ctx.strokeStyle = sg; ctx.setLineDash([700 * pb, 900]); ctx.stroke(body);
    ctx.restore();
  }

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X;
    const g = group(lt, X), pl = pale(lt, X);
    if (!o.tail) E.dust(ctx, X, { cx: W / 2, cy: H / 2, s: 1 + 0.04 * g.p });

    // filigranes (plan arrière, flou, parallaxe opposée au recul)
    const wm = [[L.s1_w1, E.MX - 6, 240, 120], [L.s1_w3, 960, 190, 104], [L.s1_w2, 1090, 836, 120]];
    if (!o.tail) wm.forEach(([w, x, y, fs], i) => {
      const a = E.prog(lt, X.cue('watermark') + i * X.beat, 1.4, ease.cubicOut) * (1 - E.prog(lt, X.cue('labelsOut') + i * 0.08, 1.0, ease.cubicInOut));
      if (a <= 0) return;
      ctx.save(); ctx.filter = E.blur(1.6); ctx.globalAlpha = a * 0.055;
      const ff = E.fit(ctx, w, { weight: 800, size: fs, minSize: 60, maxW: W - E.MX - x, maxLines: 1 });
      ctx.font = E.font(800, ff.size); ctx.letterSpacing = '-3px'; ctx.fillStyle = S.ink;
      ctx.fillText(w, x + (lt * 6) * (i % 2 ? -1 : 1) - g.p * 40 * (i - 1), y + g.p * 18);
      ctx.restore();
    });

    // silhouette (groupe en recul, flou de profondeur)
    const sa = (1 - 0.62 * g.p) * (o.tail ? 1 - E.prog(lt, X.dur, 1.0, ease.cubicInOut) : 1);
    ctx.save();
    ctx.filter = E.blur(2.2 * g.p);
    ctx.translate(ANCHOR[0], ANCHOR[1]); ctx.scale(g.s, g.s); ctx.translate(-ANCHOR[0], -ANCHOR[1]);
    silhouette(ctx, lt, X, sa);
    ctx.restore();

    if (!o.tail) {
      // pépite dans la tête : naît, puis se vide en éclats
      const born = E.spring(lt, X.cue('birth'), { zeta: 0.5, freq: 1.4 });
      let left = 0; for (let i = 0; i < N; i++) if (part(i, lt, X).started) left++;
      const hp = gpt(HEAD, g);
      E.pepite(ctx, X, hp[0], hp[1], 15 * born * (1 - 0.92 * left / N) * g.s, 1.1);

      // particules des éclats
      for (let i = 0; i < N; i++) {
        const p = part(i, lt, X); if (!p.started) continue;
        const col = p.cyan ? B.cyan : B.amber, a = (p.cyan ? 0.75 : 0.9) * E.lerp(1, pl, 1);
        if (p.q < 0.98) { ctx.save(); ctx.strokeStyle = E.rgba(col, 0.45 * a); ctx.lineWidth = p.s * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.prev[0], p.prev[1]); ctx.lineTo(p.pos[0], p.pos[1]); ctx.stroke(); ctx.restore(); }
        E.dot(ctx, p.pos[0], p.pos[1], p.s, E.rgba(col, a * pl));
      }
      // noyaux des éclats + libellés
      const labels = [L.s1_knowledge, L.s1_knowhow, T.EXPERIENCE_LABEL];
      CL.forEach((c, k) => {
        const cp = gpt(c, g);
        E.pepite(ctx, X, cp[0], cp[1], coreR(k, lt, X) * g.s, 0.75 * pl);
        ctx.save();
        ctx.translate(ANCHOR[0], ANCHOR[1]); ctx.scale(g.s, g.s); ctx.translate(-ANCHOR[0], -ANCHOR[1]);
        E.text(ctx, lt, labels[k], {
          x: c[0] + 58, y: c[1], valign: 'middle', size: 46, minSize: 28, weight: 600, maxW: W - E.MX - (c[0] + 58), maxLines: 2,
          color: S.ink, alpha: E.lerp(1, 0.45, g.p), tIn: X.cue('labels') + k * 0.07, tOut: X.cue('labelsOut') + k * 0.05, stagger: 0.05
        });
        ctx.restore();
      });
    }

    // question en deux temps : centrée, ancrée au-dessus de la bande sous-titres
    E.text(ctx, lt, L.s1_qA, { x: W / 2, y: 790, align: 'center', valign: 'bottom', size: 60, minSize: 34, weight: 500, maxW: 1500, maxLines: 2, color: S.inkSoft, tIn: X.cue('qA'), tOut: X.cue('qB') - X.beat, stagger: 0.06 });
    E.text(ctx, lt, L.s1_qB, { x: W / 2, y: 790, align: 'center', valign: 'bottom', size: 72, minSize: 38, weight: 700, maxW: 1400, maxLines: 2, color: S.ink, tIn: X.cue('qB'), tOut: X.dur, stagger: 0.06 });
  }

  E.defineSeq(1, { defaultDur: 15, tail: 1.4, draw });
})();
