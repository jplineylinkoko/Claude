// Séquence 5 — Transformer la parole en contenus
// Onde vocale → lignes de transcription → blocs structurés + « relecture humaine »
// → 3 formats (Récit d'expert, Playbook, {{DELIVERABLE_3}}) qui défilent, le 3e mis en avant.
(function () {
  const { W, H, ease } = E;
  const DOC = [580, 170, 760, 560];
  const NL = 8;
  const CARDS = [[154, 200, 470, 540], [725, 200, 470, 540], [1296, 200, 470, 540]];
  // positions des lignes : transcription (phase 1) puis blocs (phase 2)
  const rowT = i => [DOC[0] + 60, DOC[1] + 110 + i * 46];
  const BLK = [0, 0, 0, 1, 1, 1, 2, 2];
  const rowB = i => { const b = BLK[i], k = i - [0, 3, 6][b]; return [DOC[0] + 60, DOC[1] + 120 + b * 150 + 34 + k * 30]; };
  const rowW = i => [0.92, 0.8, 0.6, 0.88, 0.95, 0.5, 0.85, 0.7][i] * (DOC[2] - 120);
  E.S5 = { cards: CARDS };

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X, cue = X.cue;
    if (o.tail) return;
    E.dust(ctx, X);
    const [wx, wy, ww] = E.S4 ? E.S4.wave : [960, 540, 900];
    const toRows = E.prog(lt, 0.2, 1.6, ease.expoInOut);
    const toBlocks = E.prog(lt, cue('blocks'), 1.2, ease.expoInOut);
    const split = E.prog(lt, cue('split'), 1.4, ease.expoInOut);
    const docIn = E.spring(lt, cue('doc'), { zeta: 0.75, freq: 1.1 });

    // ---- document de transcription
    if (split < 1) {
      ctx.save(); ctx.globalAlpha = 1 - split;
      const [dx, dy, dw, dh] = DOC;
      E.card(ctx, X, dx, dy + (1 - docIn) * 40, dw, dh, { alpha: E.clamp(docIn * 1.4) });
      // en-têtes de blocs
      [B.blue, B.cyan, B.teal].forEach((c, b) => {
        const p = E.prog(lt, cue('blocks') + 0.3 + b * 0.07, 0.8, ease.cubicOut); if (p <= 0) return;
        const y = DOC[1] + 120 + b * 150;
        ctx.fillStyle = E.rgba(c, 0.9); ctx.beginPath(); ctx.roundRect(DOC[0] + 60, y, 150 * p, 14, 7); ctx.fill();
        // coche de relecture
        const ck = E.prog(lt, cue('review') + 0.4 + b * X.beat * 0.5, 0.6, ease.cubicOut);
        if (ck > 0) { E.dot(ctx, DOC[0] + DOC[2] - 80, y + 7, 15 * Math.min(1, ck * 1.3), E.rgba(B.teal, 0.25)); E.icon(ctx, 'check', DOC[0] + DOC[2] - 92, y - 5, 24, B.teal, ck); }
      });
      ctx.restore();
    }

    // ---- onde → lignes → blocs → cartes
    for (let i = 0; i < NL; i++) {
      const q = E.clamp(toRows * 1.25 - i * 0.03);
      const a0 = [wx - ww / 2 + i * ww / NL, wy], aw = ww / NL;
      const rt = rowT(i), rb = rowB(i), target = E.mixPt(rt, rb, toBlocks);
      const tw = E.lerp(rowW(i), rowW(i) * 0.9, toBlocks);
      // vers la carte correspondante
      const ci = BLK[i], [cx, cy, cw] = CARDS[ci], k = i - [0, 3, 6][ci];
      const rc = [cx + 40, cy + 160 + k * 34];
      const pos = E.mixPt(E.mixPt(a0, target, q), rc, split);
      const w = E.lerp(E.lerp(aw, tw, q), cw * (0.8 - 0.1 * k), split);
      const amp = (1 - q) * 22;
      ctx.save(); ctx.strokeStyle = E.mix(B.amber, S.line, q, E.lerp(0.95, X.S.mode === 'dark' ? 0.3 : 0.2, q)); ctx.lineWidth = E.lerp(2.4, 10, q); ctx.lineCap = 'round';
      ctx.globalAlpha = 1 - E.prog(lt, cue('split') + 1.0, 0.5);
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) { const u = s / 24, gx = a0[0] + u * aw; const yy = Math.sin((gx - wx) / ww * 46 + X.t * 6) * Math.sin((gx - wx) / ww * 11 - X.t * 2.1) * amp * Math.sin(((gx - (wx - ww / 2)) / ww) * Math.PI); const px = pos[0] + u * w, py = pos[1] + yy; s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
    }

    // pastille « relecture humaine »
    E.pill(ctx, X, lt, L.s5_review, DOC[0] + DOC[2] - 330, DOC[1] + 52, { icon: 'eye', color: B.teal, size: 22, tIn: cue('review'), tOut: cue('split') - 0.2, maxW: 230 });

    // ---- trois formats
    const focus = [cue('f1'), cue('f2'), cue('f3')];
    const titles = [L.s5_c1, L.s5_c2, T.DELIVERABLE_3], subs = [L.s5_c1s, L.s5_c2s, L.s5_c3s];
    const icons = ['branch', 'doc', 'spark'], cols = [B.blue, B.cyan, B.amber];
    CARDS.forEach(([x, y, w, h], i) => {
      const cin = E.spring(lt, cue('split') + 0.2 + i * 0.07, { zeta: 0.72, freq: 1.2 });
      if (cin <= 0.001) return;
      const act = E.prog(lt, focus[i], 0.6, ease.cubicInOut) * (i < 2 ? 1 - E.prog(lt, focus[i + 1], 0.6, ease.cubicInOut) : 1);
      const anyAct = E.prog(lt, focus[0], 0.6);
      const dimA = 1 - 0.45 * anyAct * (1 - act);
      const sc = (0.92 + 0.08 * cin) * (1 + 0.035 * act + (i === 2 ? 0.02 * E.prog(lt, focus[2], 1) : 0));
      const cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.globalAlpha = E.clamp(cin * 1.4) * dimA;
      ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      E.card(ctx, X, x, y, w, h, { stroke: E.rgba(cols[i], 0.25 + 0.6 * act), lw: i === 2 ? 2 : 1.2 });
      E.icon(ctx, icons[i], x + 36, y + 34, 34, cols[i]);
      // contenu qui défile (clippé)
      ctx.save(); ctx.beginPath(); ctx.rect(x + 20, y + 140, w - 40, h - 160); ctx.clip();
      const scroll = (lt - focus[i]) > 0 ? -Math.min(1, (lt - focus[i]) / 4) * 140 * (i === 2 ? 0 : 1) : 0;
      if (i === 2) { // une page : bloc d'enseignement mis en avant
        ctx.fillStyle = E.rgba(B.amber, 0.14); ctx.beginPath(); ctx.roundRect(x + 36, y + 226, w - 72, 110, 10); ctx.fill();
        ctx.fillStyle = B.amber; ctx.fillRect(x + 36, y + 226, 4, 110);
        E.lines(ctx, X, x + 60, y + 252, w - 120, 3, { gap: 26, h: 10, seed: 13, color: S.ink, a: 0.35 });
        E.lines(ctx, X, x + 40, y + 370, w - 80, 4, { gap: 30, h: 9, seed: 14 });
      } else E.lines(ctx, X, x + 40, y + 200 + scroll, w - 80, 14, { gap: 30, h: 9, seed: 11 + i });
      ctx.restore();
      ctx.restore();
      E.text(ctx, lt, titles[i], { x: x + 36, y: y + 128, valign: 'bottom', size: 38, minSize: 22, weight: 700, maxW: w - 72, maxLines: 1, color: S.ink, alpha: dimA, tIn: cue('split') + 0.4 + i * 0.07, tOut: X.dur });
      const sOut = i < 2 ? focus[i + 1] : X.dur;
      E.text(ctx, lt, subs[i], { x: x + 36, y: y + 150, size: 28, minSize: 16, weight: 500, maxW: w - 72, maxLines: 2, color: i === 2 ? B.amber : S.inkSoft, tIn: focus[i] + 0.1, tOut: sOut });
    });
    // la pépite se pose sur le 3e format
    const pin = E.prog(lt, focus[2] - 0.4, 1.2, ease.expoInOut);
    const pStart = [DOC[0] + DOC[2] / 2, DOC[1] - 10];
    const pIn = E.spring(lt, cue('doc'), { zeta: 0.6 });
    const pp = E.mixPt(pStart, [CARDS[2][0] + CARDS[2][2] - 40, CARDS[2][1] + 40], pin);
    E.pepite(ctx, X, pp[0], pp[1], 10 * Math.min(1, pIn), 1.2);
    E.S5.pep = [CARDS[2][0] + CARDS[2][2] - 40, CARDS[2][1] + 40];
  }

  E.defineSeq(5, { defaultDur: 18, tail: 0, draw,
    cues: { doc: 1.2, blocks: 4, review: 5.5, split: 9, f1: 11, f2: 15, f3: 19 } });
})();
