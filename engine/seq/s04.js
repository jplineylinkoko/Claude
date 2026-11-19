// Séquence 4 — Faire expliciter ce qui a de la valeur
// Pépites fusionnées → bulle « Ça, tout le monde le sait… » barrée → guide d'entretien →
// une question se détache → la bulle s'ouvre en CADRE VIDÉO (12 s) → se replie en onde.
(function () {
  const { W, H, ease } = E;
  const M = [960, 400];                         // centre de la bulle
  const FR = [360, 140, 1200, 675];             // cadre vidéo 16:9 (reste au-dessus de la bande sous-titres)
  const CLIP = 12;                              // durée de l'extrait (s)
  const GUIDE = [560, 170, 800, 600];
  E.S4 = { wave: [960, 540, 900] };

  function bubblePath(ctx, cx, cy, w, h, tail) {
    const x = cx - w / 2, y = cy - h / 2, r = Math.min(h / 2, 40);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (tail > 0) { ctx.moveTo(x + w * 0.22, y + h - 1); ctx.lineTo(x + w * 0.16 - 10 * tail, y + h + 46 * tail); ctx.lineTo(x + w * 0.32, y + h - 1); }
  }

  function draw(ctx, lt, X, o = {}) {
    const { S, B, L } = X, cue = X.cue;
    if (o.tail) return;
    E.dust(ctx, X);
    const clip0 = cue('clip'), clip1 = clip0 + CLIP;

    // ---- fusion des deux pépites de la séq. 3 puis bulle
    const merge = E.prog(lt, 0, 1.2, ease.expoInOut);
    const bub = E.spring(lt, cue('bubble'), { zeta: 0.68, freq: 1.2 }), bubOut = E.prog(lt, cue('guide'), 0.7, ease.cubicIn);
    const peps = E.S3 ? E.S3.peps : [[M[0], M[1]], [M[0], M[1]]];
    if (merge < 1) peps.forEach(p => E.pepite(ctx, X, E.lerp(p[0], M[0], merge), E.lerp(p[1], M[1], merge), E.lerp(11, 16, merge), 1.3));
    if (bub > 0.001 && bubOut < 1) {
      const w = E.lerp(32, 1060, E.clamp(bub, 0, 1.08)), h = E.lerp(32, 190, E.clamp(bub, 0, 1.08));
      ctx.save(); ctx.globalAlpha = 1 - bubOut;
      const sc = 1 - 0.15 * bubOut; ctx.translate(M[0], M[1]); ctx.scale(sc, sc); ctx.translate(-M[0], -M[1]);
      ctx.shadowColor = X.S.shadow; ctx.shadowBlur = E.sb(50); ctx.shadowOffsetY = 18 * E.px;
      bubblePath(ctx, M[0], M[1], w, h, E.clamp(bub)); ctx.fillStyle = E.mix(B.amber, E.surface(X), E.clamp(bub * 1.3)); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.strokeStyle = E.rgba(B.amber, 0.35); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      const dimT = E.prog(lt, cue('strike') + 0.4, 0.8);
      const box = E.text(ctx, lt, L.s4_bubble, { x: M[0], y: M[1], align: 'center', valign: 'middle', size: 60, minSize: 30, weight: 500, maxW: 960, maxLines: 2, color: S.ink, alpha: (1 - bubOut) * (1 - 0.45 * dimT), tIn: cue('bubble') + 0.4, tOut: cue('guide') - 0.1 });
      // trait qui barre la phrase
      const st = E.prog(lt, cue('strike'), 0.8, ease.expoInOut);
      if (st > 0 && box.w > 0) {
        ctx.save(); ctx.globalAlpha = 1 - bubOut; ctx.strokeStyle = B.amber; ctx.lineWidth = 4; ctx.lineCap = 'round';
        const yy = M[1] + 2 + (box.lines > 1 ? -box.size * 0.55 : 0);
        ctx.beginPath(); ctx.moveTo(box.x - 10, yy); ctx.lineTo(box.x - 10 + (box.w + 20) * st, yy - 4 * st); ctx.stroke();
        if (box.lines > 1) { const st2 = E.prog(lt, cue('strike') + 0.25, 0.7, ease.expoInOut); ctx.beginPath(); ctx.moveTo(box.x - 10, yy + box.size * 1.12); ctx.lineTo(box.x - 10 + (box.w + 20) * st2, yy + box.size * 1.12 - 4 * st2); ctx.stroke(); }
        ctx.restore();
      }
    }
    if (merge >= 1 && bub < 0.2) E.pepite(ctx, X, M[0], M[1], 16 * (1 - bub * 4), 1.3);

    // ---- guide d'entretien
    const gIn = E.spring(lt, cue('guide'), { zeta: 0.72, freq: 1.1 }), gOut = E.prog(lt, cue('guideOut'), 0.8, ease.cubicIn);
    const lift = E.prog(lt, cue('detach'), 1.1, ease.expoInOut);
    if (gIn > 0.001 && gOut < 1) {
      const [gx, gy, gw, gh] = GUIDE, dy = (1 - gIn) * 160 + gOut * 60;
      E.layer(ctx, 4 * lift, E.clamp(gIn * 1.5) * (1 - gOut) * (1 - 0.6 * lift), c2 => {
        E.card(c2, X, gx, gy + dy, gw, gh, {});
        E.icon(c2, 'rules', gx + 44, gy + dy + 36, 30, B.cyan);
        for (let i = 0; i < 6; i++) {
          const ry = gy + dy + 128 + i * 74;
          if (i === 2 && lift > 0) continue;
          c2.fillStyle = E.rgba(S.inkSoft, 0.8); c2.font = E.font(600, 20); c2.fillText(String(i + 1).padStart(2, '0'), gx + 44, ry + 8);
          E.lines(c2, X, gx + 100, ry, gw - 160, 1, { h: 12, seed: 70 + i });
          c2.fillStyle = E.rgba(S.line, 0.08); c2.fillRect(gx + 44, ry + 38, gw - 88, 1);
        }
      });
      E.text(ctx, lt, L.s4_guide, { x: gx + 92, y: gy + dy + 30, size: 30, minSize: 18, weight: 600, maxW: gw - 140, maxLines: 1, color: S.ink, alpha: E.clamp(gIn * 1.5) * (1 - gOut), tIn: cue('guide') + 0.3, tOut: cue('detach') });
      // la ligne choisie se détache et monte
      const ry = gy + dy + 128 + 2 * 74;
      const rx = E.lerp(gx + 100, 330, lift), rw = E.lerp(gw - 160, 1260, lift), rY = E.lerp(ry, 330, lift);
      ctx.save(); ctx.globalAlpha = (1 - E.prog(lt, cue('question') - 0.1, 0.4)) * E.clamp(gIn * 1.5);
      ctx.fillStyle = E.rgba(B.amber, 0.5 + 0.4 * lift); ctx.beginPath(); ctx.roundRect(rx, rY, rw * (0.7 + 0.3 * (1 - lift)), 12 + 6 * lift, 9); ctx.fill();
      ctx.restore();
      E.dot(ctx, gx + 72 - 40, ry + 6, 5 * (1 - lift) * E.clamp(gIn), E.rgba(B.amber, 0.9));
    }
    // question détachée
    const qo = cue('questionOut');
    E.text(ctx, lt, L.s4_question, { x: W / 2, y: 470, align: 'center', valign: 'middle', size: 66, minSize: 36, weight: 700, maxW: 1320, maxLines: 3, color: S.ink, tIn: cue('question'), tOut: qo, stagger: 0.05, track: -0.012 });
    const qp = E.spring(lt, cue('question') - 0.2, { zeta: 0.6 }) * (1 - E.prog(lt, cue('frame') - 0.3, 0.3));
    // la pépite au-dessus de la question puis devient le cadre
    const fr = E.prog(lt, cue('frame'), 1.3, ease.expoInOut);
    const fold = E.prog(lt, clip1, 0.8, ease.expoInOut);
    if (qp > 0.001 && fr <= 0) E.pepite(ctx, X, W / 2, 300, 12 * qp, 1.2);

    // ---- cadre vidéo : morphing pépite → cadre 16:9 → onde
    if (fr > 0) {
      const [fx, fy, fw, fh] = FR, cx = fx + fw / 2;
      let w = E.lerp(24, fw, fr), h = E.lerp(24, fh, fr), cy = E.lerp(300, fy + fh / 2, fr);
      if (fold > 0) { w = E.lerp(fw, E.S4.wave[2], fold); h = E.lerp(fh, 6, fold); cy = E.lerp(fy + fh / 2, E.S4.wave[1], fold); }
      if (fold < 1) {
        if (fr < 0.35) E.pepite(ctx, X, cx, cy, 12 * (1 - fr / 0.35) + 2, 1.2);
        E.mediaFrame(ctx, X, 'INTERVIEW', cx - w / 2, cy - h / 2, w, h, lt - clip0, { r: E.lerp(12, 20, fr) * (1 - fold), label: L.s4_slot, dur: CLIP, alpha: E.clamp(fr * 3) });
      }
      if (fold > 0) { // onde vocale qui reprend le relais
        ctx.save(); ctx.strokeStyle = E.rgba(B.amber, 0.9 * fold); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
        for (let k = 0; k <= 160; k++) { const u = k / 160, env = Math.sin(u * Math.PI); const yy = cy + Math.sin(u * 46 + X.t * 6) * Math.sin(u * 11 - X.t * 2.1) * 26 * env * fold; const xx = cx - w / 2 + u * w; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke(); ctx.restore();
      }
    }
  }

  E.defineSeq(4, { defaultDur: 25, tail: 0, draw,
    cues: { bubble: 1.5, strike: 5, guide: 7.5, detach: 10, question: 10.6, guideOut: 11.5, questionOut: 17.4, frame: 18.3, clip: 20.33 },
    slots: X => [{ slot: 'INTERVIEW', start: X.start + X.cue('clip'), dur: CLIP }] });
})();
