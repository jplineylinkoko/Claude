// Séquence 10 — Passer à l'échelle
// La pépite se duplique en réseau d'experts et de domaines → leviers (Répliquer,
// Faire vivre, Transmettre) → le réseau se contracte → question finale sur bleu nuit.
(function () {
  const { W, H, ease } = E;
  const C = [1180, 450];
  const NODES = [];
  { // arbre de duplication : 1 → 3 → 9 → 27, positions seedées
    const r = E.rng(1010);
    NODES.push({ p: C, parent: -1, gen: 0, dom: false });
    let prev = [0];
    [3, 3, 3].forEach((k, g) => {
      const next = [];
      prev.forEach(pi => {
        const P = NODES[pi].p, base = r() * 6.28;
        for (let j = 0; j < k; j++) {
          const a = base + j * 6.2832 / k + (r() - 0.5) * 0.7, d = [190, 140, 95][g] * (0.8 + r() * 0.4);
          let x = P[0] + Math.cos(a) * d * 1.25, y = P[1] + Math.sin(a) * d * 0.95;
          x = E.clamp(x, 720, W - E.MX - 20); y = E.clamp(y, E.MY + 40, E.SUB_TOP - 30);
          NODES.push({ p: [x, y], parent: pi, gen: g + 1, dom: r() < 0.3, ph: r() * 6.28 }); next.push(NODES.length - 1);
        }
      });
      prev = next;
    });
  }
  const LINKS = []; { const r = E.rng(77); for (let i = 0; i < 18; i++) { const a = 1 + Math.floor(r() * (NODES.length - 1)), b = 1 + Math.floor(r() * (NODES.length - 1)); if (a !== b && Math.hypot(NODES[a].p[0] - NODES[b].p[0], NODES[a].p[1] - NODES[b].p[1]) < 260) LINKS.push([a, b]); } }
  const END = [960, 330];

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L } = X, cue = X.cue;
    if (o.tail) return;
    E.dust(ctx, X, { cx: W / 2, cy: H / 2, s: 1 + 0.05 * E.prog(lt, 0, X.dur, ease.sineInOut) });
    const contract = E.prog(lt, cue('contract'), 2.0, ease.expoInOut);
    const start = E.S9 && E.S9.pep ? E.S9.pep : C;
    const born = i => { const n = NODES[i]; return n.gen === 0 ? 1 : E.spring(lt, cue('g' + n.gen) + (i % 9) * 0.03, { zeta: 0.6, freq: 1.4 }); };
    const pos = i => {
      const n = NODES[i];
      let p = n.gen === 0 ? E.mixPt(start, C, E.prog(lt, 0, 1.4, ease.expoInOut)) : null;
      if (!p) { const pp = pos(n.parent), b = E.clamp(born(i), 0, 1.1); p = [E.lerp(pp[0], n.p[0], b) + Math.sin(X.t * 0.5 + n.ph) * 4, E.lerp(pp[1], n.p[1], b) + Math.cos(X.t * 0.4 + n.ph) * 3]; }
      return E.mixPt(p, END, contract);
    };
    // liens
    ctx.save(); ctx.lineWidth = 1.2;
    NODES.forEach((n, i) => { if (n.parent < 0) return; const b = born(i); if (b <= 0.01) return; const a = pos(n.parent), c = pos(i); ctx.strokeStyle = E.rgba(S.line, 0.22 * E.clamp(b) * (1 - contract)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); });
    const lk = E.prog(lt, cue('g3') + 0.6, 1.2) * (1 - contract);
    LINKS.forEach(([a, b]) => { if (lk <= 0) return; const p = pos(a), q = pos(b); ctx.strokeStyle = E.rgba(B.cyan, 0.16 * lk); ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 40, q[0], q[1]); ctx.stroke(); });
    ctx.restore();
    // nœuds : experts (pépites) et domaines (anneaux)
    NODES.forEach((n, i) => {
      if (i === 0) return; const b = born(i); if (b <= 0.01) return; const p = pos(i), k = E.clamp(b) * (1 - contract);
      if (n.dom) { ctx.strokeStyle = E.rgba(B.cyan, 0.85 * k); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p[0], p[1], 10 * Math.min(1, b), 0, 6.2832); ctx.stroke(); E.dot(ctx, p[0], p[1], 2.5, E.rgba(B.cyan, k)); }
      else E.pepite(ctx, X, p[0], p[1], [0, 9, 7, 5][n.gen] * Math.min(1, b), 0.9 * k + 0.1 * (1 - contract));
    });
    const c0 = pos(0);
    E.pepite(ctx, X, c0[0], c0[1], E.lerp(12, 20, contract), 1.3 + 0.3 * contract);

    // leviers
    const lev = [[L.s10_l1, 'replicate', B.blue], [L.s10_l2, 'cycle', B.cyan], [L.s10_l3, 'pass', B.teal]];
    lev.forEach(([txt, ic, c], i) => {
      const t0 = cue('l' + (i + 1)), y = 330 + i * 130, out = cue('levOut') + i * 0.06;
      const a = E.prog(lt, t0, 0.6, ease.cubicOut) * (1 - E.prog(lt, out, 0.45, ease.cubicIn));
      E.icon(ctx, ic, E.MX, y - 48, 40, c, a);
      E.text(ctx, lt, txt, { x: E.MX + 64, y, valign: 'bottom', size: 64, minSize: 34, weight: 700, maxW: 520, maxLines: 1, color: S.ink, tIn: t0, tOut: out, track: -0.015 });
    });
    // question finale
    E.text(ctx, lt, L.s10_q, { x: W / 2, y: 470, align: 'center', size: 72, minSize: 38, weight: 700, maxW: 1380, maxLines: 3, color: S.ink, tIn: cue('q'), tOut: 1e9, stagger: 0.06, track: -0.015 });
  }

  E.defineSeq(10, { defaultDur: 13, tail: 0, draw,
    cues: { g1: 0.8, g2: 2, g3: 3.2, l1: 6, l2: 7, l3: 8, levOut: 12, contract: 12, q: 14.5 } });
})();
