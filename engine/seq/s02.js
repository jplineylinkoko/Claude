// Séquence 2 — Deux types de connaissance
// Les éclats se rassemblent en une pépite → l'écran se divise (Formalisée / Tacite)
// → la gauche s'estompe → zoom caméra sur la pépite → « Notre focus : la connaissance tacite. »
(function () {
  const { W, H, ease } = E;
  const PR = [1520, 560];                       // pépite côté tacite (monde)
  const ZS = 1.55, ZC = [PR[0] - 340 / ZS, PR[1]]; // pépite → écran (1300, 540) en fin de zoom
  const RX = W / 2 + 120;
  const ORB = [], NO = 70;
  { const r = E.rng(21); for (let i = 0; i < NO; i++) ORB.push({ a: r() * 6.2832, d: 50 + Math.pow(r(), 0.7) * 215, s: 1 + r() * 2.6, far: r() < 0.4, amber: i % 9 === 0, cyan: i % 2 === 1, w: 0.03 + r() * 0.06, delay: r() * 0.8 }); }

  function cam(lt, X) { const z = E.prog(lt, X.cue('zoom'), 2.4, ease.expoInOut); return { z, cx: E.lerp(W / 2, ZC[0], z), cy: E.lerp(H / 2, ZC[1], z), s: E.lerp(1, ZS, z) }; }
  // position de la pépite (monde) : du barycentre des éclats vers le côté tacite
  function pepPos(lt, X) {
    const g1 = E.S1.group(1e9, E.ctxFor(0, 0));
    const c0 = E.S1.CL.map(c => E.S1.gpt(c, g1)).reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]);
    const m = E.spring(lt, X.cue('split') - 0.1, { zeta: 0.78, freq: 0.9 });
    return E.mixPt(c0, PR, m);
  }
  E.S2 = { endScreen: () => E.toScreen(PR, { cx: ZC[0], cy: ZC[1], s: ZS }), endR: 16 * ZS };

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L } = X, dark = S.mode === 'dark';
    const c = cam(lt, X);
    const X1 = E.ctxFor(0, X.t);
    if (!o.tail) E.dust(ctx, X, c);

    ctx.save();
    E.camera(ctx, c.cx, c.cy, c.s);

    // ---- moitié gauche froide (balayage depuis le centre)
    const wipe = E.prog(lt, X.cue('split'), 1.4, ease.expoInOut);
    const fadeL = E.prog(lt, X.cue('fadeLeft'), 1.6, ease.cubicInOut);
    const coldBg = dark ? '#16273D' : '#E7EAEE';
    if (!o.tail && wipe > 0) {
      ctx.save();
      ctx.globalAlpha = 1 - 0.97 * fadeL;
      // balayage du centre vers la gauche, bord adouci
      const edge = W / 2 - (W / 2 + 200) * wipe, fe = 160;
      const lg = ctx.createLinearGradient(edge - fe, 0, edge + fe * 0.2, 0);
      lg.addColorStop(0, E.rgba(coldBg, 0)); lg.addColorStop(1, coldBg);
      ctx.fillStyle = lg; ctx.fillRect(edge - fe, -400, fe * 1.2, H + 800);
      ctx.fillStyle = coldBg; ctx.fillRect(edge + fe * 0.2 - 1, -400, W / 2 - edge - fe * 0.2 + 1, H + 800);
      ctx.restore();
      // séparateur
      const sp = E.spring(lt, X.cue('split'), { zeta: 0.75, freq: 1.2 });
      const h = (E.SUB_TOP - E.MY - 40) * E.clamp(sp, 0, 1.05) / 2, cy = (E.MY + 40 + E.SUB_TOP) / 2;
      const sg = ctx.createLinearGradient(0, cy - h, 0, cy + h);
      sg.addColorStop(0, E.rgba(S.line, 0)); sg.addColorStop(0.5, E.rgba(S.line, 0.4 * (1 - fadeL))); sg.addColorStop(1, E.rgba(S.line, 0));
      ctx.fillStyle = sg; ctx.fillRect(W / 2, cy - h, 1.2, 2 * h);
    }

    // ---- contenu gauche : Formalisée (désaturé, gris froid)
    const coldInk = dark ? '#8C9BAE' : '#7D8794';
    if (!o.tail) {
      ctx.save();
      ctx.globalAlpha = 1 - fadeL; ctx.filter = E.blur(5 * fadeL * c.s);
      // pile de documents (secondaire, flou de profondeur)
      const ds = E.spring(lt, X.cue('leftItems') + X.beat * 0.5, { zeta: 0.72, freq: 1.1 });
      if (ds > 0) for (let i = 0; i < 4; i++) {
        const x = 560 + i * 26, y = 330 + i * 22 + (1 - ds) * 120;
        ctx.save(); ctx.globalAlpha *= E.clamp(ds * 1.5); ctx.filter = E.blur(2.5 + 5 * fadeL * c.s); ctx.translate(x, y); ctx.rotate(-0.06 + i * 0.035);
        ctx.fillStyle = dark ? '#20344F' : '#F7F8FA'; ctx.shadowColor = S.shadow; ctx.shadowBlur = E.sb(30); ctx.shadowOffsetY = 10 * E.px;
        ctx.fillRect(0, 0, 230, 300); ctx.shadowColor = 'transparent';
        ctx.fillStyle = E.rgba(S.cold, 0.32);
        for (let l = 0; l < 9; l++) ctx.fillRect(26, 40 + l * 26, l % 3 === 2 ? 110 : 178, 7);
        ctx.restore();
      }
      E.text(ctx, lt, L.s2_formal, { x: E.MX, y: 300, valign: 'bottom', size: 88, minSize: 48, weight: 600, maxW: 700, maxLines: 1, color: coldInk, track: -0.017, tIn: X.cue('left') });
      [['doc', L.s2_f1], ['report', L.s2_f2], ['proc', L.s2_f3]].forEach(([ic, lab], i) => {
        const y = 420 + i * 86, ti = X.cue('leftItems') + i * 0.07;
        E.icon(ctx, ic, E.MX, y - 26, 34, coldInk, E.prog(lt, ti, 0.7, ease.cubicOut));
        E.text(ctx, lt, lab, { x: E.MX + 58, y, valign: 'bottom', size: 32, minSize: 20, weight: 400, maxW: 340, maxLines: 1, color: coldInk, tIn: ti });
      });
      ctx.restore();
    }

    // ---- côté tacite
    const P = pepPos(lt, X);
    const rOut = X.cue('rightOut');
    if (!o.tail) {
      const accent = dark ? B.cyan : B.blue;
      // orbites (tracé progressif)
      [110, 170, 230].forEach((r, i) => {
        const p = E.prog(lt, X.cue('right') + i * 0.07, 1.6, ease.expoOut); if (p <= 0) return;
        ctx.save(); ctx.strokeStyle = E.rgba(accent, 0.22 - i * 0.05); ctx.lineWidth = 1 / c.s * (1 + 0.3 * c.z); if (i === 1) ctx.setLineDash([2, 8]);
        ctx.beginPath(); ctx.ellipse(PR[0], PR[1], r, r * 0.92, -0.2 + lt * 0.03, 0, 6.2832 * p); ctx.stroke(); ctx.restore();
      });
      // particules en orbite
      ORB.forEach((q, i) => {
        const a = E.prog(lt, X.cue('right') + q.delay, 1.0, ease.cubicOut); if (a <= 0) return;
        const ang = q.a + lt * q.w * (200 / q.d), x = PR[0] + Math.cos(ang) * q.d, y = PR[1] + Math.sin(ang) * q.d * 0.92;
        ctx.save(); if (q.far) ctx.filter = E.blur(2 * c.s);
        E.dot(ctx, x, y, q.s, q.amber ? E.rgba(B.amber, 0.8 * a) : E.rgba(q.cyan ? B.cyan : B.teal, (q.far ? 0.35 : 0.7) * a));
        ctx.restore();
      });
      E.text(ctx, lt, L.s2_tacit, { x: RX, y: 300, valign: 'bottom', size: 96, minSize: 52, weight: 700, maxW: 640, maxLines: 1, color: S.ink, track: -0.02, tIn: X.cue('right'), tOut: rOut });
      [['branch', L.s2_t1], ['hand', L.s2_t2], ['alert', L.s2_t3]].forEach(([ic, lab], i) => {
        const y = 420 + i * 86, ti = X.cue('rightItems') + i * 0.07, to = rOut + 0.1 + i * 0.07;
        const out = E.prog(lt, to, 0.5, ease.cubicIn);
        // fil vers la pépite
        const th = E.prog(lt, X.cue('threads') + i * 0.07, 1.0, ease.expoOut) * (1 - out);
        if (th > 0) {
          ctx.save(); ctx.strokeStyle = E.rgba(accent, 0.4); ctx.lineWidth = 1.2;
          const p0 = [RX + 390, y - 10];
          const path = new Path2D(); path.moveTo(p0[0], p0[1]); path.bezierCurveTo(p0[0] + 60, y - 10, PR[0] - 120, PR[1] - 40 + i * 30, PR[0] - 14, PR[1]);
          ctx.setLineDash([340 * th, 600]); ctx.stroke(path); ctx.restore();
          E.dot(ctx, p0[0], p0[1], 3 * th, E.rgba(accent, 0.9));
        }
        E.icon(ctx, ic, RX, y - 26, 34, dark ? B.cyan : B.teal, E.prog(lt, ti, 0.7, ease.cubicOut) * (1 - out));
        E.text(ctx, lt, lab, { x: RX + 58, y, valign: 'bottom', size: 32, minSize: 20, weight: 500, maxW: 320, maxLines: 1, color: S.ink, tIn: ti, tOut: to });
      });
    }

    // ---- rassemblement des éclats (continuité depuis la séq. 1)
    if (!o.tail) {
      let arrived = 0;
      const dur1 = X1.dur;
      for (let i = 0; i < E.S1.N; i++) {
        const p = E.S1.part(i, dur1 + lt, X1);
        const q = E.prog(lt, E.hash(i, 3) * 0.5, 1.3, ease.expoInOut);
        arrived += q;
        if (q >= 1) continue;
        const pos = E.mixPt(p.pos, P, q);
        const col = p.cyan ? B.cyan : B.amber;
        E.dot(ctx, pos[0], pos[1], p.s * (1 - 0.5 * q), E.rgba(col, (p.cyan ? 0.75 : 0.9) * E.S1.pale(1e9, X1) * (1 - q * 0.3) + 0.3 * q));
      }
      // les 3 noyaux convergent aussi
      E.S1.CL.forEach((cc, k) => {
        const q = E.prog(lt, 0.1 + k * 0.07, 1.4, ease.expoInOut); if (q >= 1) return;
        const s0 = E.S1.gpt(cc, E.S1.group(1e9, X1));
        const pos = E.mixPt(s0, P, q);
        E.pepite(ctx, X, pos[0], pos[1], 6.5 * E.S1.group(1e9, X1).s * (1 - q * 0.4), 0.75 * E.S1.pale(1e9, X1) * (1 - q));
      });
      const grow = arrived / E.S1.N;
      E.pepite(ctx, X, P[0], P[1], 16 * E.ease.cubicOut(grow), 0.6 + 0.65 * grow);
    }
    ctx.restore();

    // ---- message (espace écran, après le zoom)
    const kick = E.text(ctx, lt, L.s2_msgA, { x: E.MX, y: 430, valign: 'bottom', size: 40, minSize: 26, weight: 500, maxW: 800, maxLines: 1, color: S.inkSoft, tIn: X.cue('message'), tOut: X.dur });
    E.text(ctx, lt, L.s2_msgB, { x: E.MX, y: 462, valign: 'top', size: 88, minSize: 48, weight: 700, maxW: 780, maxLines: 2, color: S.ink, track: -0.015, tIn: X.cue('message') + X.beat * 0.5, tOut: X.dur + 0.08, stagger: 0.07 });
  }

  E.defineSeq(2, { defaultDur: 12, tail: 1.2, draw });
})();
