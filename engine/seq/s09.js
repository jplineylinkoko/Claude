// Séquence 9 — Les conditions pour que ça dure
// Le cadre vidéo se replie en linteau → 3 piliers se posent (Règles communes, Rôles clairs,
// Routines) → un guide s'ouvre en liseuse sur l'accueil (cadre « GUIDE – À INSÉRER »).
(function () {
  const { W, H, ease } = E;
  const LIN = [960, 300, 1000];         // centre x, y, largeur du linteau
  const PIL = [660, 960, 1260], PW = 180, PH = 300, PY = 316;
  const READER = [1010, 236, 720, 450];
  const HOMEW = [1080, 170, 640, 640 * 690 / 1240];
  E.S9 = {};

  function group(lt, X) { const g = E.prog(lt, X.cue('shift'), 1.6, ease.expoInOut); return { g, s: E.lerp(1, 0.62, g), ax: E.lerp(960, 520, g), ay: E.lerp(470, 470, g) }; }
  const gp = (p, G) => [G.ax + (p[0] - 960) * G.s, G.ay + (p[1] - 470) * G.s];

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L } = X, cue = X.cue;
    const G = group(lt, X);
    if (o.tail) {
      const out = E.prog(lt, X.dur, 0.6, ease.cubicIn);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, out * 30);
      body(ctx, X.dur, X, G, true); ctx.restore(); return;
    }
    E.dust(ctx, X);
    // ---- le cadre vidéo de la séq. 8 se replie en linteau
    const col = E.prog(lt, 0, 1.2, ease.expoInOut);
    if (col < 1) {
      const [fx, fy, fw, fh] = E.S8 ? E.S8.frame : [360, 140, 1200, 675];
      const w = E.lerp(fw, LIN[2], col), h = E.lerp(fh, 14, col), cy = E.lerp(fy + fh / 2, LIN[1], col);
      E.mediaFrame(ctx, X, 'VERBATIM', LIN[0] - w / 2, cy - h / 2, w, h, 6, { r: E.lerp(20, 7, col), label: X.L.s8_slot, dur: 6, alpha: 1 - col * 0.8 });
    }
    body(ctx, lt, X, G, false);
  }

  function body(ctx, lt, X, G, tail) {
    const { S, B, L } = X, cue = X.cue;
    const col = E.prog(lt, 0, 1.2, ease.expoInOut);
    ctx.save(); ctx.translate(G.ax, G.ay); ctx.scale(G.s, G.s); ctx.translate(-960, -470);
    // linteau
    if (col > 0.6) {
      const a = E.clamp((col - 0.6) / 0.4);
      ctx.save(); ctx.globalAlpha *= a;
      const g = ctx.createLinearGradient(0, LIN[1] - 7, 0, LIN[1] + 7); g.addColorStop(0, E.mix(B.amber, '#FFFFFF', 0.3)); g.addColorStop(1, E.rgba(B.amber, 0.6));
      ctx.shadowColor = E.rgba(B.amber, 0.5); ctx.shadowBlur = E.sb(24); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(LIN[0] - LIN[2] / 2, LIN[1] - 7, LIN[2], 14, 7); ctx.fill();
      ctx.restore();
    }
    // piliers
    const icons = ['rules', 'people', 'cycle'], labs = [L.s9_p1, L.s9_p2, L.s9_p3], cols = [B.blue, B.cyan, B.teal];
    PIL.forEach((x, i) => {
      const t0 = cue('p' + (i + 1));
      const d = E.spring(lt, t0, { zeta: 0.42, freq: 1.3 });       // rebond amorti à la pose
      if (d <= 0.001) return;
      const y = PY - (1 - d) * 260;
      ctx.save(); ctx.globalAlpha *= E.clamp(d * 2);
      E.card(ctx, X, x - PW / 2, y, PW, PH, { r: 14, stroke: E.rgba(cols[i], 0.5) });
      ctx.fillStyle = E.rgba(cols[i], 0.12); ctx.fillRect(x - PW / 2 + 14, y + 14, PW - 28, 8);
      E.icon(ctx, icons[i], x - 28, y + 90, 56, cols[i]);
      E.lines(ctx, X, x - PW / 2 + 36, y + 190, PW - 72, 3, { gap: 24, h: 8, seed: 40 + i });
      ctx.restore();
      E.text(ctx, lt, labs[i], { x, y: PY + PH + 30, align: 'center', size: 34, minSize: 18, weight: 700, maxW: 290, maxLines: 2, color: S.ink, tIn: t0 + 0.25, tOut: tail ? X.dur : 1e9 });
    });
    ctx.restore();
    // pépite posée au centre du linteau
    const lp = gp([LIN[0], LIN[1] - 22], G);
    const src = E.S8 && E.S8.pep ? E.S8.pep : lp;
    const pq = E.prog(lt, 0.2, 1.3, ease.expoInOut);
    E.S9.pep = lp;
    if (!tail) E.pepite(ctx, X, E.lerp(src[0], lp[0], pq), E.lerp(src[1], lp[1], pq), 11, 1.25);

    // ---- liseuse sur l'accueil
    const rd = E.spring(lt, cue('reader'), { zeta: 0.78, freq: 1.0 });
    const hm = E.prog(lt, cue('reader') - 0.6, 1.2, ease.cubicOut);
    if (hm > 0) E.site.window(ctx, X, HOMEW, [{ name: 'home', alpha: 1, main: true }], { alpha: hm * 0.55, labels: false, tileLabels: 0 });
    if (rd > 0.001) {
      const [x, y, w, h] = READER, ow = w * E.clamp(rd, 0, 1.05);
      ctx.save(); ctx.globalAlpha *= E.clamp(rd * 2);
      E.card(ctx, X, x + (w - ow) / 2 - 18, y - 18, ow + 36, h + 36, { r: 26, fill: '#081F3D', stroke: E.rgba('#FFFFFF', 0.12) });
      E.mediaFrame(ctx, X, 'GUIDE', x + (w - ow) / 2, y, ow, h, lt - cue('reader'), { r: 10, label: L.s9_slot, dur: 0, doc: true });
      // pli central de la liseuse
      const g = ctx.createLinearGradient(x + w / 2 - 20, 0, x + w / 2 + 20, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x + w / 2 - 20, y, 40, h);
      E.icon(ctx, 'book', x + w / 2 - 14, y + h + 2, 28, E.rgba('#FFFFFF', 0.5));
      ctx.restore();
    }
  }

  E.defineSeq(9, { defaultDur: 12, tail: 0.7, draw,
    cues: { p1: 2, p2: 3, p3: 4, shift: 7, reader: 8 },
    slots: X => [{ slot: 'GUIDE', start: X.start + X.cue('reader'), dur: X.dur - X.cue('reader') }] });
})();
