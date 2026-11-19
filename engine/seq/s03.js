// Séquence 3 — Identifier la connaissance critique
// La pépite éclate en constellation → 2 difficultés (densité, temps) → 3 faisceaux
// convergent vers « Connaissance critique », le reste s'éteint → la cible se résout
// en deux colonnes {{DOMAIN_1}} / {{DOMAIN_2}} → message.
(function () {
  const { W, H, ease } = E;
  const C0 = [1300, 540];                 // pépite héritée de la séq. 2 (écran)
  const TG = [1290, 470];                 // centre de la cible
  const COLS = [[1196, 200, 250, 400], [1516, 200, 250, 400]];
  const PEPS = [[1321, 200], [1641, 200]];
  const N = 260, PTS = [];
  { const r = E.rng(303); for (let i = 0; i < N; i++) {
      let x, y; do { const a = r() * 6.2832, d = Math.sqrt(r()); x = 1120 + Math.cos(a) * d * 700; y = 470 + Math.sin(a) * d * 350; } while (x < E.MX || x > W - E.MX || y < E.MY + 30 || y > E.SUB_TOP - 20);
      PTS.push({ x, y, s: 1 + r() * 2.4, ph: r() * 6.28, f: 1.5 + r() * 2.5, d: r() * 0.35, crit: r() < 0.3, z: r(), col: r() < 0.08 ? 'amber' : r() < 0.35 ? 'cyan' : 'line' });
  } }
  const BEAMS = [['s3_b1', 300, 'blue'], ['s3_b2', 470, 'cyan'], ['s3_b3', 640, 'teal']];

  E.S3 = { peps: PEPS, cols: COLS };

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X, cue = X.cue;
    if (o.tail) {
      // traîne : colonnes et message sortent pendant que la séq. 4 fusionne les pépites
      const out = E.prog(lt, X.dur, 0.9, ease.cubicIn);
      COLS.forEach(([x, y, w, h], k) => E.card(ctx, X, x + w / 2 * out * 0.2, y + h * 0.1 * out, w * (1 - out * 0.2), h * (1 - out * 0.3), { alpha: 1 - out, stroke: E.rgba(B.cyan, 0.3) }));
      const bA = E.text(ctx, lt, L.s3_msgA, { x: E.MX, y: 330, size: 70, minSize: 40, weight: 700, maxW: 990, maxLines: 2, color: S.ink, tIn: cue('msg'), tOut: X.dur, track: -0.015 });
      E.text(ctx, lt, L.s3_msgB, { x: E.MX, y: bA.y2 + 22, size: 44, minSize: 28, weight: 500, maxW: 990, maxLines: 2, color: S.inkSoft, tIn: cue('msg') + X.beat, tOut: X.dur + 0.06 });
      return;
    }
    E.dust(ctx, X);
    const crit = E.prog(lt, cue('converge'), 2.0, ease.expoInOut);      // convergence des points critiques
    const dim = E.prog(lt, cue('beams'), 2.4, ease.cubicInOut);          // le reste s'éteint
    const timeDim = E.prog(lt, cue('d2'), 3.6, ease.sineInOut) * 0.35;
    const resolve = E.prog(lt, cue('resolve'), 1.4, ease.expoInOut);

    // ---- constellation
    for (let i = 0; i < N; i++) {
      const p = PTS[i];
      const q = E.prog(lt, p.d * 0.6, 1.7, ease.expoOut);
      if (q <= 0) continue;
      let x = E.lerp(C0[0], p.x, q) + Math.sin(X.t * 0.3 + p.ph) * 4, y = E.lerp(C0[1], p.y, q) + Math.cos(X.t * 0.25 + p.ph) * 3;
      let a = (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(X.t * p.f + p.ph))) * (1 - timeDim);
      a *= 1 + 0.5 * E.prog(lt, cue('d1'), 0.8) * (1 - E.prog(lt, cue('d2'), 0.8)); // scintillement accru
      if (p.crit) { const cq = E.clamp(crit * 1.15 - p.z * 0.15); x = E.lerp(x, TG[0], cq); y = E.lerp(y, TG[1], cq); a = E.lerp(a, 1, crit) * (1 - E.clamp(cq * 1.2 - 0.2)); }
      else a *= 1 - 0.9 * dim;
      const col = p.col === 'amber' ? B.amber : p.col === 'cyan' ? B.cyan : S.line;
      E.softDot(ctx, x, y, p.s * (0.6 + 0.4 * q), col, a * (p.col === 'line' ? 0.7 : 0.9), p.z < 0.35 ? 2.2 : 0);
    }
    // pépite d'origine qui éclate
    E.pepite(ctx, X, C0[0], C0[1], (E.S2 ? E.S2.endR : 24) * (1 - E.prog(lt, 0, 0.7, ease.cubicIn)), 1.2);

    // ---- difficulté 2 : anneau du temps qui s'écoule
    const ring = E.prog(lt, cue('d2'), 3.6, ease.cubicInOut), ringOut = E.prog(lt, cue('d2out'), 0.6, ease.cubicIn);
    if (ring > 0 && ringOut < 1) {
      ctx.save(); ctx.globalAlpha = 1 - ringOut; ctx.strokeStyle = E.rgba(B.cyan, 0.55); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(1150, 470, 330, -Math.PI / 2, -Math.PI / 2 + 6.2832 * ring); ctx.stroke();
      const a = -Math.PI / 2 + 6.2832 * ring; E.dot(ctx, 1150 + Math.cos(a) * 330, 470 + Math.sin(a) * 330, 5, B.cyan);
      ctx.strokeStyle = E.rgba(S.line, 0.12); ctx.beginPath(); ctx.arc(1150, 470, 330, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }

    // ---- difficultés (texte à gauche, sur voile)
    const scrim = E.prog(lt, cue('d1') - 0.3, 0.8) * (1 - E.prog(lt, cue('d2out'), 0.8));
    if (scrim > 0) { const g = ctx.createRadialGradient(E.MX + 300, 260, 20, E.MX + 300, 260, 620); g.addColorStop(0, E.rgba(S.bg, 0.85 * scrim)); g.addColorStop(1, E.rgba(S.bg, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    [['1', L.s3_d1, cue('d1'), cue('d1out')], ['2', L.s3_d2, cue('d2'), cue('d2out')]].forEach(([n, txt, ti, to]) => {
      const sp = E.spring(lt, ti, { zeta: 0.6 }), out = E.prog(lt, to, 0.45, ease.cubicIn);
      if (sp > 0 && out < 1) {
        ctx.save(); ctx.globalAlpha = E.clamp(sp * 1.5) * (1 - out);
        ctx.strokeStyle = E.rgba(B.amber, 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(E.MX + 26, 196, 24 * Math.min(1, sp), 0, 6.2832); ctx.stroke();
        ctx.fillStyle = B.amber; ctx.font = E.font(600, 24); ctx.textAlign = 'center'; ctx.fillText(n, E.MX + 26, 205); ctx.restore();
      }
      E.text(ctx, lt, txt, { x: E.MX, y: 250, size: 64, minSize: 36, weight: 700, maxW: 800, maxLines: 3, color: S.ink, tIn: ti + 0.1, tOut: to, stagger: 0.05, track: -0.012 });
    });

    // ---- faisceaux + pastilles
    ctx.font = E.font(500, 24);
    BEAMS.forEach(([key, y, ck], i) => {
      const col = B[ck], tIn = cue('beams') + i * X.beat, bOut = E.prog(lt, cue('resolve') - 0.3 + i * 0.06, 0.8, ease.cubicIn);
      const pw = E.pill(ctx, X, lt, L[key], E.MX, y, { color: col, tIn, tOut: cue('resolve') - 0.4 + i * 0.06, maxW: 380 }) || 360;
      const grow = E.prog(lt, tIn + 0.15, 1.1, ease.expoOut);
      if (grow <= 0 || bOut >= 1) return;
      const sx = E.MX + pw, c1 = [sx + (TG[0] - sx) * 0.55, y + (TG[1] - y) * 0.15];
      const bz = u => [(1 - u) * (1 - u) * sx + 2 * (1 - u) * u * c1[0] + u * u * (TG[0] - 18), (1 - u) * (1 - u) * y + 2 * (1 - u) * u * c1[1] + u * u * TG[1]];
      const u0 = bOut, u1 = grow;
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { // faisceau effilé : 3 passes de largeur décroissante
        ctx.strokeStyle = E.rgba(col, [0.10, 0.22, 0.9][k]); ctx.lineWidth = [14, 6, 1.6][k];
        ctx.beginPath(); for (let s = 0; s <= 40; s++) { const u = E.lerp(u0, u1, s / 40), p = bz(u); s ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
      }
      for (let k = 0; k < 5; k++) { const u = ((X.t * 0.35 + k / 5 + i * 0.13) % 1); if (u < u0 || u > u1) continue; const p = bz(u); E.dot(ctx, p[0], p[1], 2.4, E.rgba(col, 0.95)); }
      ctx.restore();
    });

    // ---- cible
    const tg = E.spring(lt, cue('target'), { zeta: 0.62, freq: 1.3 }) * (1 - resolve);
    if (tg > 0.001) {
      ctx.save(); ctx.globalAlpha = E.clamp(tg * 1.3);
      [62, 108, 160].forEach((rr, i) => { ctx.strokeStyle = E.rgba('#FFFFFF', [0.5, 0.28, 0.14][i]); ctx.lineWidth = i === 0 ? 1.6 : 1; ctx.beginPath(); ctx.arc(TG[0], TG[1], rr * tg, 0, 6.2832); ctx.stroke(); });
      ctx.strokeStyle = E.rgba('#FFFFFF', 0.4); ctx.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + (1 - tg) * 0.6; ctx.beginPath(); ctx.moveTo(TG[0] + Math.cos(a) * 172 * tg, TG[1] + Math.sin(a) * 172 * tg); ctx.lineTo(TG[0] + Math.cos(a) * 196 * tg, TG[1] + Math.sin(a) * 196 * tg); ctx.stroke(); }
      ctx.restore();
    }
    E.text(ctx, lt, L.s3_target, { x: TG[0], y: 760, align: 'center', valign: 'bottom', size: 80, minSize: 44, weight: 700, maxW: 940, maxLines: 1, color: S.ink, tIn: cue('target') + X.beat * 0.5, tOut: cue('resolve') - 0.2, track: -0.015 });

    // ---- résolution en deux colonnes
    const colIn = E.spring(lt, cue('resolve') + 0.3, { zeta: 0.7, freq: 1.2 });
    COLS.forEach(([x, y, w, h], k) => {
      if (colIn <= 0.001) return;
      const s = colIn, cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * s, s); ctx.translate(-cx, -cy);
      E.card(ctx, X, x, y, w, h, { alpha: E.clamp(s * 1.4), stroke: E.rgba(k ? B.teal : B.cyan, 0.4) });
      E.lines(ctx, X, x + 32, y + 150, w - 64, 6, { gap: 34, h: 9, seed: 31 + k, p: E.prog(lt, cue('resolve') + 0.6 + k * 0.07, 1.2, ease.cubicOut) });
      ctx.restore();
      E.text(ctx, lt, k ? T.DOMAIN_2 : T.DOMAIN_1, { x: x + 32, y: y + 56, size: 34, minSize: 20, weight: 600, maxW: w - 64, maxLines: 2, color: S.ink, tIn: cue('resolve') + 0.5 + k * 0.07, tOut: cue('msg') - 0.3 + k * 0.05 });
    });
    // la pépite se divise vers le haut des colonnes
    const sp = E.prog(lt, cue('resolve'), 1.3, ease.expoInOut);
    const pin = E.prog(lt, cue('converge') + 0.4, 1.2, ease.cubicOut);
    if (sp <= 0) E.pepite(ctx, X, TG[0], TG[1], 18 * pin, 1.4 * pin);
    else PEPS.forEach((p, k) => { const q = E.clamp(sp * 1.1 - k * 0.1); E.pepite(ctx, X, E.lerp(TG[0], p[0], q), E.lerp(TG[1], p[1], q), E.lerp(18, 11, q), 1.3); });

    // ---- message
    const bA = E.text(ctx, lt, L.s3_msgA, { x: E.MX, y: 330, size: 70, minSize: 40, weight: 700, maxW: 990, maxLines: 2, color: S.ink, tIn: cue('msg'), tOut: X.dur, track: -0.015 });
    E.text(ctx, lt, L.s3_msgB, { x: E.MX, y: bA.y2 + 22, size: 44, minSize: 28, weight: 500, maxW: 990, maxLines: 2, color: S.inkSoft, tIn: cue('msg') + X.beat, tOut: X.dur + 0.06 });
  }

  E.defineSeq(3, { defaultDur: 20, tail: 1.0, draw,
    cues: { d1: 2.5, d1out: 8.5, d2: 9.5, d2out: 16, beams: 16.5, converge: 18.5, target: 19, resolve: 22.5, msg: 26 } });
})();
