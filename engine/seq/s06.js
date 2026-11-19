// Séquence 6 — Une architecture pensée pour retrouver
// Les 3 formats se rangent dans l'arborescence (Accueil → domaines → sujets → catégories)
// → zoom sur une fiche, ses étiquettes s'allument → flux vers « Vues filtrées » et « Recherche »
// → recul : l'arborescence devient la page d'accueil de {{SITE_NAME}} → message.
(function () {
  const { W, H, ease } = E;
  const WIN = [700, 190, 1066, 1066 * 690 / 1240];
  const N = {
    R: [960, 180], D1: [620, 320], D2: [1300, 320],
    T1: [420, 470], T2: [620, 470], T3: [820, 470], T4: [1180, 470], T5: [1420, 470],
    K1: [540, 620], K2: [620, 620], K3: [700, 620],
    a1: [380, 620], a2: [460, 620], b1: [780, 620], b2: [860, 620], c1: [1140, 620], c2: [1220, 620], d1: [1380, 620], d2: [1460, 620]
  };
  const EDGES = [['R', 'D1', 0], ['R', 'D2', 0], ['D1', 'T1', 1], ['D1', 'T2', 1], ['D1', 'T3', 1], ['D2', 'T4', 1], ['D2', 'T5', 1],
    ['T2', 'K1', 2], ['T2', 'K2', 2], ['T2', 'K3', 2], ['T1', 'a1', 2], ['T1', 'a2', 2], ['T3', 'b1', 2], ['T3', 'b2', 2], ['T4', 'c1', 2], ['T4', 'c2', 2], ['T5', 'd1', 2], ['T5', 'd2', 2]];
  const LEVEL = { R: 0, D1: 1, D2: 1, T1: 2, T2: 2, T3: 2, T4: 2, T5: 2 };
  // cibles des nœuds dans la page d'accueil (coordonnées page 1240×690)
  const HOME = { R: [130, 40], D1: [331, 301], D2: [908, 301], T1: [188, 527], T2: [476, 527], T3: [764, 527], T4: [1052, 527], T5: [1052, 527] };
  const CARD = [330, 230, 680, 440];
  E.S6 = { win: WIN };

  const lv = (lt, X, l) => X.cue('tree') + l * X.beat * 1.2;
  const homePt = (k) => { const p = HOME[k] || [620, 600], s = WIN[2] / 1240; return [WIN[0] + p[0] * s, WIN[1] + p[1] * s]; };

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X, cue = X.cue;
    if (o.tail) return;
    const zoom = E.prog(lt, cue('zoom'), 1.8, ease.expoInOut) * (1 - E.prog(lt, cue('back'), 1.8, ease.expoInOut));
    const cam = { cx: E.lerp(W / 2, N.K3[0], zoom), cy: E.lerp(H / 2, N.K3[1], zoom), s: E.lerp(1, 2.4, zoom) };
    const morph = E.prog(lt, cue('home'), 2.0, ease.expoInOut);
    E.dust(ctx, X, cam);

    // ---- fenêtre d'accueil (apparaît pendant le morphing)
    const winA = E.prog(lt, cue('home') + 0.4, 1.4, ease.cubicInOut);
    if (winA > 0) {
      const sc = 0.94 + 0.06 * E.spring(lt, cue('home') + 0.2, { zeta: 0.75, freq: 1.1 });
      const r = [WIN[0] + WIN[2] * (1 - sc) / 2, WIN[1] + WIN[3] * (1 - sc) / 2, WIN[2] * sc, WIN[3] * sc];
      E.site.window(ctx, X, r, [{ name: 'home', alpha: 1, main: true }], { alpha: winA, labels: false, tileLabels: 0 });
    }

    // ---- arborescence (espace caméra)
    const treeA = 1 - E.prog(lt, cue('home') + 1.0, 1.0);
    if (treeA > 0) {
      ctx.save(); E.camera(ctx, cam.cx, cam.cy, cam.s); ctx.globalAlpha = treeA;
      const pos = k => morph > 0 ? E.mixPt(N[k], homePt(LEVEL[k] !== undefined ? k : k), morph) : N[k];
      EDGES.forEach(([a, b, l]) => {
        const p = E.prog(lt, lv(lt, X, l) + 0.3, 0.9, ease.expoOut); if (p <= 0) return;
        const A = pos(a), Bp = pos(b), my = (A[0] === Bp[0]) ? 0 : 1;
        ctx.save(); ctx.strokeStyle = E.rgba(S.line, 0.32 * (1 - morph)); ctx.lineWidth = 1.4 / cam.s * (1 + zoom * 0.6);
        const path = new Path2D(); path.moveTo(A[0], A[1] + 22); path.bezierCurveTo(A[0], (A[1] + Bp[1]) / 2 + 10, Bp[0], (A[1] + Bp[1]) / 2 - 10, Bp[0], Bp[1] - 22 * my);
        ctx.setLineDash([400 * p, 600]); ctx.stroke(path); ctx.restore();
      });
      // nœuds
      const lab = { R: L.s6_home, D1: T.DOMAIN_1, D2: T.DOMAIN_2, T2: T.TOPIC };
      Object.keys(N).forEach(k => {
        const level = LEVEL[k] ?? 3, t0 = lv(lt, X, level) + (level === 3 ? 0.4 : 0);
        const sp = E.spring(lt, t0, { zeta: 0.65, freq: 1.5 }); if (sp <= 0.001) return;
        const [x, y] = pos(k);
        if (level === 3) {
          const isK = k[0] === 'K', c = k === 'K1' ? B.blue : k === 'K2' ? B.cyan : k === 'K3' ? B.amber : S.line;
          const s = 22 * sp * (1 - morph * 0.6);
          ctx.fillStyle = E.rgba(c, isK ? 0.9 : 0.3); ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, 5); ctx.fill();
          return;
        }
        const txt = lab[k];
        ctx.save(); ctx.translate(x, y); ctx.scale(0.8 + 0.2 * sp, 0.8 + 0.2 * sp); ctx.globalAlpha *= E.clamp(sp * 1.5) * (1 - morph);
        const size = level === 0 ? 26 : level === 1 ? 30 : 24;
        let w = 120;
        if (txt) { const f = E.fit(ctx, txt, { weight: 600, size, minSize: 13, maxW: level === 1 ? 300 : 170, maxLines: 1 }); ctx.font = E.font(600, f.size); w = ctx.measureText(f.lines[0]).width + 48; txt && (ctx._t = f); }
        const h = size * 2.1;
        E.card(ctx, X, -w / 2, -h / 2, w, h, { r: h / 2, fill: X.S.mode === 'dark' ? '#123A6B' : '#FFFFFF', stroke: E.rgba(level === 1 ? (k === 'D1' ? B.cyan : B.teal) : S.line, level === 1 ? 0.6 : 0.25), blur: 20, dy: 6 });
        if (txt) { ctx.fillStyle = S.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ctx._t.lines[0], 0, 1); }
        else E.lines(ctx, X, -36, -5, 72, 1, { h: 10, seed: k.charCodeAt(1), a: 0.3 });
        ctx.restore();
      });
      ctx.restore();
    }

    // ---- les 3 formats de la séq. 5 viennent se ranger dans les catégories
    const cards5 = E.S5 ? E.S5.cards : [];
    ['K1', 'K2', 'K3'].forEach((k, i) => {
      const q = E.prog(lt, 0.15 + i * 0.07, 1.7, ease.expoInOut); if (q >= 1 || !cards5[i]) return;
      const [x, y, w, h] = cards5[i], tgt = N[k];
      const cx = E.lerp(x + w / 2, tgt[0], q), cy = E.lerp(y + h / 2, tgt[1], q), cw = E.lerp(w, 22, q), ch = E.lerp(h, 22, q);
      E.card(ctx, X, cx - cw / 2, cy - ch / 2, cw, ch, { r: E.lerp(18, 5, q), alpha: 1 - q * 0.6, stroke: E.rgba([B.blue, B.cyan, B.amber][i], 0.5) });
      // le contenu (titre + lignes) suit la carte et s'efface en route
      const ca = E.clamp(1 - q * 2.2);
      if (ca > 0) { ctx.save(); ctx.globalAlpha = ca; ctx.translate(cx, cy); ctx.scale(cw / w, ch / h); ctx.translate(-(x + w / 2), -(y + h / 2));
        E.icon(ctx, ['branch', 'doc', 'spark'][i], x + 36, y + 34, 34, [B.blue, B.cyan, B.amber][i]);
        ctx.fillStyle = E.rgba(S.ink, 0.8); ctx.beginPath(); ctx.roundRect(x + 36, y + 100, 180, 18, 9); ctx.fill();
        E.lines(ctx, X, x + 40, y + 200, w - 80, 8, { gap: 30, h: 9, seed: 11 + i }); ctx.restore(); }
    });
    // pépite : de la 3e carte vers la catégorie K3, suit la fiche puis le domaine 1
    const pp0 = E.S5 && E.S5.pep ? E.S5.pep : [1700, 240];
    const pq = E.prog(lt, 0.3, 1.8, ease.expoInOut);
    let pp = E.mixPt(pp0, E.toScreen(N.K3, cam), pq);

    // ---- fiche zoomée, étiquettes, flux
    const card = E.spring(lt, cue('card'), { zeta: 0.74, freq: 1.2 }) * (1 - E.prog(lt, cue('back'), 0.9, ease.cubicIn));
    if (card > 0.001) {
      const [x, y, w, h] = CARD, k3 = E.toScreen(N.K3, cam);
      const cx = E.lerp(k3[0], x + w / 2, card), cy = E.lerp(k3[1], y + h / 2, card), cw = E.lerp(30, w, card), ch = E.lerp(30, h, card);
      ctx.save(); ctx.globalAlpha = E.clamp(card * 2);
      E.card(ctx, X, cx - cw / 2, cy - ch / 2, cw, ch, { stroke: E.rgba(B.amber, 0.5) });
      if (card > 0.6) {
        ctx.globalAlpha = E.clamp((card - 0.6) / 0.4);
        E.icon(ctx, 'spark', x + 40, y + 40, 36, B.amber);
        const f = E.fit(ctx, T.DELIVERABLE_3, { weight: 700, size: 38, minSize: 20, maxW: w - 140, maxLines: 1 }); ctx.font = E.font(700, f.size); ctx.fillStyle = S.ink; ctx.fillText(f.lines[0], x + 92, y + 70);
        E.lines(ctx, X, x + 40, y + 130, w - 80, 5, { gap: 32, h: 10, seed: 66 });
        for (let i = 0; i < 4; i++) {
          const on = E.prog(lt, cue('tags') + i * X.beat, 0.5, ease.cubicOut), c = [B.blue, B.cyan, B.teal, B.amber][i];
          const tx = x + 40 + i * 150, ty = y + h - 76;
          if (on > 0) { ctx.save(); ctx.shadowColor = E.rgba(c, 0.8); ctx.shadowBlur = E.sb(18 * on); ctx.fillStyle = E.rgba(c, 0.18 + 0.3 * on); ctx.beginPath(); ctx.roundRect(tx, ty, 130, 38, 19); ctx.fill(); ctx.restore(); }
          ctx.strokeStyle = E.rgba(c, 0.35 + 0.6 * on); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(tx, ty, 130, 38, 19); ctx.stroke();
          E.dot(ctx, tx + 20, ty + 19, 4.5, E.rgba(c, 0.5 + 0.5 * on)); ctx.fillStyle = E.rgba(c, 0.4 + 0.5 * on); ctx.beginPath(); ctx.roundRect(tx + 36, ty + 15, 70, 8, 4); ctx.fill();
        }
      }
      ctx.restore();
      if (card > 0.3) pp = E.mixPt(pp, [x + w - 34, y + 34], E.clamp((card - 0.3) / 0.5));
    }
    // flux vers vues filtrées / recherche
    const fl = E.prog(lt, cue('flows'), 1.0, ease.cubicOut) * (1 - E.prog(lt, cue('back') - 0.3, 0.6));
    const targets = [[1310, 330, L.s6_filtered, 'filter', B.cyan], [1310, 570, L.s6_search, 'search', B.teal]];
    targets.forEach(([tx, ty, lab, ic, c], i) => {
      E.pill(ctx, X, lt, lab, tx, ty, { icon: ic, color: c, size: 26, tIn: cue('flows') + i * X.beat * 0.5 + 0.3, tOut: cue('back') - 0.3, maxW: 300 });
      if (fl <= 0) return;
      const a = [CARD[0] + CARD[2], CARD[1] + CARD[3] / 2], P = E.arcPath(a, [tx - 6, ty], i ? -0.18 : 0.18);
      ctx.save(); ctx.strokeStyle = E.rgba(c, 0.35 * fl); ctx.lineWidth = 1.4; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); ctx.stroke(); ctx.restore();
      for (let k = 0; k < 7; k++) { const u = ((X.t * 0.55 + k / 7) % 1), p = E.bez(...P, u); E.dot(ctx, p[0], p[1], 2.6 * fl, E.rgba(k % 3 ? c : B.amber, 0.95 * fl * Math.sin(u * Math.PI))); }
    });
    // la pépite rejoint la tuile du domaine 1 sur l'accueil
    const ph = E.prog(lt, cue('home') + 0.5, 1.6, ease.expoInOut);
    if (ph > 0) pp = E.mixPt(pp, homePt('D1'), ph);
    E.pepite(ctx, X, pp[0], pp[1], E.lerp(10, 9, ph), 1.2);
    E.S6.pep = homePt('D1');

    // ---- message
    E.text(ctx, lt, L.s6_msg, { x: E.MX, y: 300, size: 64, minSize: 34, weight: 700, maxW: WIN[0] - E.MX - 40, maxLines: 4, color: S.ink, tIn: cue('msg'), tOut: X.dur, stagger: 0.06, track: -0.012 });
  }

  E.defineSeq(6, { defaultDur: 20, tail: 1.0, draw: (ctx, lt, X, o = {}) => {
      if (o.tail) { E.text(ctx, lt, X.L.s6_msg, { x: E.MX, y: 300, size: 64, minSize: 34, weight: 700, maxW: WIN[0] - E.MX - 40, maxLines: 4, color: X.S.ink, tIn: X.cue('msg'), tOut: X.dur, stagger: 0.04, track: -0.012 }); return; }
      draw(ctx, lt, X, o);
    },
    cues: { tree: 0.5, zoom: 6, card: 8, tags: 10, flows: 13.5, back: 18, home: 20, msg: 23.5 } });
})();
