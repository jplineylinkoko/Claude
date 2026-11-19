// Séquence 8 — Ce qu'en disent les utilisateurs
// La pépite trace deux jauges ({{SCORE_1}}, {{SCORE_2}} sur {{SCORE_MAX}}), source {{TEST_SOURCE}},
// puis l'arc de la 2e jauge s'étire en CADRE VIDÉO VIDE (6 s) « VERBATIM UTILISATEUR ».
(function () {
  const { W, H, ease } = E;
  const G = [[640, 410], [1280, 410]], R = 200, A0 = Math.PI * 0.75, SPAN = Math.PI * 1.5;
  const FR = [360, 140, 1200, 675], CLIP = 6;
  E.S8 = { frame: FR };
  // valeur → fraction (les valeurs non numériques, ex. « X », s'affichent à 80 % / 88 %)
  const frac = (v, max, dflt) => { const a = parseFloat(String(v).replace(',', '.')), b = parseFloat(String(max).replace(',', '.')); return isFinite(a) && isFinite(b) && b > 0 ? E.clamp(a / b) : dflt; };

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L, T } = X, cue = X.cue;
    if (o.tail) return;
    E.dust(ctx, X);
    const out = E.prog(lt, cue('gOut'), 0.9, ease.cubicIn);
    const fr = [frac(T.SCORE_1, T.SCORE_MAX, 0.8), frac(T.SCORE_2, T.SCORE_MAX, 0.88)];
    const vals = [T.SCORE_1, T.SCORE_2], labs = [T.SCORE_1_LABEL, T.SCORE_2_LABEL];
    const start = E.S7 && E.S7.end ? E.S7.end : [680, 470];
    let pep = start;
    G.forEach(([gx, gy], i) => {
      const gin = E.spring(lt, cue('g' + (i + 1)) - 0.4, { zeta: 0.75, freq: 1.2 });
      const fill = E.prog(lt, cue('g' + (i + 1)), 1.8, ease.expoInOut) * fr[i];
      const a = E.clamp(gin * 1.5) * (i === 1 ? 1 : 1 - out);
      if (a <= 0.001) return;
      ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
      ctx.strokeStyle = E.rgba(S.line, 0.14); ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(gx, gy, R, A0, A0 + SPAN * Math.min(1, gin)); ctx.stroke();
      if (i === 0 || out === 0) {
        const g = ctx.createLinearGradient(gx - R, gy, gx + R, gy); g.addColorStop(0, B.teal); g.addColorStop(1, B.cyan);
        ctx.strokeStyle = g; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(gx, gy, R, A0, A0 + SPAN * fill); ctx.stroke();
        // graduations
        const n = Math.max(1, Math.min(10, Math.round(parseFloat(T.SCORE_MAX) || 5)));
        for (let k = 0; k <= n; k++) { const ang = A0 + SPAN * k / n; ctx.strokeStyle = E.rgba(S.line, 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx + Math.cos(ang) * (R + 16), gy + Math.sin(ang) * (R + 16)); ctx.lineTo(gx + Math.cos(ang) * (R + 24), gy + Math.sin(ang) * (R + 24)); ctx.stroke(); }
      }
      ctx.restore();
      if (fill > 0 && (i === 0 || out === 0)) pep = [gx + Math.cos(A0 + SPAN * fill) * R, gy + Math.sin(A0 + SPAN * fill) * R];
      // valeur + échelle + libellé
      const ti = cue('g' + (i + 1)) + 0.6;
      const vb = E.text(ctx, lt, String(vals[i]), { x: gx - 18, y: gy + 40, align: 'center', valign: 'bottom', size: 120, minSize: 48, weight: 700, maxW: R * 1.2, maxLines: 1, color: S.ink, tIn: ti, tOut: cue('gOut') });
      E.text(ctx, lt, '/' + T.SCORE_MAX, { x: vb.x + vb.w + 8, y: gy + 40, valign: 'bottom', size: 48, minSize: 24, weight: 500, maxW: 110, maxLines: 1, color: S.inkSoft, tIn: ti + 0.1, tOut: cue('gOut') });
      E.text(ctx, lt, labs[i], { x: gx, y: gy + R + 44, align: 'center', size: 36, minSize: 20, weight: 600, maxW: 520, maxLines: 2, color: S.ink, tIn: ti + 0.2, tOut: cue('gOut') });
    });
    // trajectoire de la pépite : arrive au début de la jauge 1, trace, saute à la jauge 2
    const arr = E.prog(lt, 0, 1.2, ease.expoInOut);
    const g1s = [G[0][0] + Math.cos(A0) * R, G[0][1] + Math.sin(A0) * R];
    if (lt < cue('g1')) pep = E.mixPt(start, g1s, arr);
    const jump = E.prog(lt, cue('g1') + 1.9, cue('g2') - cue('g1') - 1.9, ease.expoInOut);
    if (lt > cue('g1') + 1.9 && lt < cue('g2')) { const a = [G[0][0] + Math.cos(A0 + SPAN * fr[0]) * R, G[0][1] + Math.sin(A0 + SPAN * fr[0]) * R], b = [G[1][0] + Math.cos(A0) * R, G[1][1] + Math.sin(A0) * R]; pep = E.bez(...E.arcPath(a, b, 0.3), jump); }
    E.text(ctx, lt, T.TEST_SOURCE, { x: W / 2, y: 812, align: 'center', valign: 'bottom', size: 20, minSize: 13, weight: 500, maxW: 900, maxLines: 1, color: S.muted, tIn: cue('g2') + 1.2, tOut: cue('gOut') });

    // ---- l'arc de la jauge 2 s'étire en cadre vidéo
    const fq = E.prog(lt, cue('frame'), 1.3, ease.expoInOut);
    if (out > 0 && fq < 1) {
      const [gx, gy] = G[1];
      ctx.save(); ctx.globalAlpha = 1 - fq; ctx.strokeStyle = E.rgba(B.cyan, 0.9); ctx.lineWidth = 14 * (1 - out) + 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(gx, gy, R * (1 + out * 0.3), A0 + SPAN * fr[1] * out * 0.5, A0 + SPAN * fr[1]); ctx.stroke(); ctx.restore();
    }
    if (fq > 0) {
      const [fx, fy, fw, fh] = FR, [gx, gy] = G[1];
      const cx = E.lerp(gx, fx + fw / 2, fq), cy = E.lerp(gy, fy + fh / 2, fq), w = E.lerp(R * 2, fw, fq), h = E.lerp(R * 2, fh, fq);
      E.mediaFrame(ctx, X, 'VERBATIM', cx - w / 2, cy - h / 2, w, h, lt - cue('clip'), { r: E.lerp(R, 20, fq), label: L.s8_slot, dur: CLIP, alpha: E.clamp(fq * 2.5) });
      pep = E.mixPt(pep, [cx + w / 2 - 30, cy - h / 2 + 30], fq);
    }
    E.pepite(ctx, X, pep[0], pep[1], 11, 1.2);
    E.S8.pep = [FR[0] + FR[2] - 30, FR[1] + 30];
  }

  E.defineSeq(8, { defaultDur: 12, tail: 0, draw,
    cues: { g1: 1.2, g2: 4.4, gOut: 8.2, frame: 8.3, clip: 10 },
    slots: X => [{ slot: 'VERBATIM', start: X.start + X.cue('clip'), dur: CLIP }] });
})();
