// ============================================================================
// Kit graphique partagé + emplacements médias (vidéos, captures, guide).
// ============================================================================
(function () {
  const { W, H, ease } = E;

  // ---------------------------------------------------------------- surfaces
  E.surface = X => (X.S.mode === 'dark' ? '#123A6B' : '#FFFFFF');
  E.card = function (ctx, X, x, y, w, h, o = {}) {
    const { r = 18, fill = E.surface(X), stroke = null, lw = 1.2, shadow = true, alpha = 1 } = o;
    if (alpha <= 0.002 || w <= 0 || h <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (shadow) { ctx.shadowColor = X.S.shadow; ctx.shadowBlur = E.sb(o.blur ?? 46); ctx.shadowOffsetY = (o.dy ?? 18) * E.px; }
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.fill();
    ctx.shadowColor = 'transparent';
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    ctx.restore();
  };
  // lignes grisées (faux texte illisible)
  E.lines = function (ctx, X, x, y, w, n, o = {}) {
    const { gap = 30, h = 10, seed = 1, alpha = 1, color = X.S.line, a = X.S.mode === 'dark' ? 0.16 : 0.10, p = 1 } = o;
    const r = E.rng(seed);
    for (let i = 0; i < n; i++) {
      const lw = w * (i % 4 === 3 ? 0.5 + r() * 0.15 : 0.78 + r() * 0.22) * E.clamp(p * n - i);
      if (lw <= 0) continue;
      ctx.fillStyle = E.rgba(color, a * alpha); ctx.beginPath(); ctx.roundRect(x, y + i * gap, lw, h, h / 2); ctx.fill();
    }
  };
  // pastille avec point de couleur + libellé révélé
  E.pill = function (ctx, X, lt, label, x, y, o = {}) {
    const { color = X.B.cyan, size = 24, tIn = 0, tOut = 1e9, maxW = 420, h = size * 2.3, icon = null, alpha = 1 } = o;
    const sp = E.spring(lt, tIn, { zeta: 0.7, freq: 1.4 }), out = E.prog(lt, tOut, 0.45, ease.cubicIn);
    if (sp <= 0.001 || out >= 1) return 0;
    const f = E.fit(ctx, label, { weight: 500, size, minSize: 15, maxW, maxLines: 1 });
    ctx.font = E.font(500, f.size); ctx.letterSpacing = '0px';
    const tw = ctx.measureText(f.lines[0]).width, pw = tw + (icon ? 78 : 64);
    ctx.save(); ctx.globalAlpha *= alpha * E.clamp(sp * 1.4) * (1 - out);
    const sx = 0.85 + 0.15 * sp; ctx.translate(x, y); ctx.scale(sx, sx); ctx.translate(-x, -y);
    E.card(ctx, X, x, y - h / 2, pw, h, { r: h / 2, fill: X.S.mode === 'dark' ? E.rgba('#123A6B', 0.92) : '#FFFFFF', stroke: E.rgba(color, 0.55), blur: 24, dy: 8 });
    if (icon) E.icon(ctx, icon, x + 18, y - 13, 26, color); else E.dot(ctx, x + 26, y, 5, color);
    ctx.fillStyle = X.S.ink; ctx.textBaseline = 'middle'; ctx.fillText(f.lines[0], x + (icon ? 56 : 44), y + 1);
    ctx.restore();
    return pw;
  };
  // curseur + onde de clic
  E.cursor = function (ctx, X, x, y, click = 0, alpha = 1) {
    if (alpha <= 0) return;
    const { S, B } = X, dark = S.mode === 'dark';
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
    if (click > 0 && click < 1) [0, 0.18].forEach(d => { const c = E.clamp((click - d) / (1 - d)); if (c <= 0) return; ctx.strokeStyle = E.rgba(B.amber, 0.7 * (1 - c)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 8 + 46 * ease.expoOut(c), 0, 6.2832); ctx.stroke(); });
    const press = click > 0 && click < 0.25 ? 1 - 0.12 * Math.sin(click / 0.25 * Math.PI) : 1;
    ctx.scale(press, press);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = E.sb(10); ctx.shadowOffsetY = 3 * E.px;
    ctx.fillStyle = dark ? '#FFFFFF' : B.night; ctx.strokeStyle = dark ? B.night : '#FFFFFF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 35); ctx.lineTo(19, 33); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
    ctx.restore();
  };
  // point sur une Bézier cubique
  E.bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
  // trajectoire courbe entre deux points (courbure perpendiculaire)
  E.arcPath = (a, b, bend = 0.25) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const n = [-dy * bend, dx * bend]; return [a, [a[0] + dx * 0.3 + n[0], a[1] + dy * 0.3 + n[1]], [a[0] + dx * 0.75 + n[0] * 0.6, a[1] + dy * 0.75 + n[1] * 0.6], b]; };

  // ---------------------------------------------------------------- icônes supplémentaires
  const ICON2 = {
    eye: P => { P.moveTo(3, 16); P.bezierCurveTo(8, 8, 24, 8, 29, 16); P.bezierCurveTo(24, 24, 8, 24, 3, 16); P.moveTo(20, 16); P.arc(16, 16, 4, 0, 7); },
    check: P => { P.moveTo(7, 17); P.lineTo(13, 23); P.lineTo(25, 9); },
    filter: P => { P.moveTo(4, 6); P.lineTo(28, 6); P.lineTo(19, 17); P.lineTo(19, 26); P.lineTo(13, 29); P.lineTo(13, 17); P.closePath(); },
    people: P => { P.arc(12, 11, 4.5, 0, 7); P.moveTo(3, 27); P.bezierCurveTo(3, 19, 21, 19, 21, 27); P.moveTo(24.5, 9); P.arc(22, 9, 3.5, 0, 7); P.moveTo(23, 17); P.bezierCurveTo(27, 17, 30, 19, 30, 24); },
    cycle: P => { P.moveTo(26, 12); P.bezierCurveTo(23, 5, 12, 3, 7, 10); P.moveTo(26, 5); P.lineTo(26, 12); P.lineTo(19, 12); P.moveTo(6, 20); P.bezierCurveTo(9, 27, 20, 29, 25, 22); P.moveTo(6, 27); P.lineTo(6, 20); P.lineTo(13, 20); },
    rules: P => { P.rect(6, 4, 20, 25); P.moveTo(10, 11); P.lineTo(22, 11); P.moveTo(10, 16); P.lineTo(22, 16); P.moveTo(10, 21); P.lineTo(17, 21); },
    book: P => { P.moveTo(16, 8); P.bezierCurveTo(12, 5, 7, 5, 3, 6); P.lineTo(3, 26); P.bezierCurveTo(7, 25, 12, 25, 16, 28); P.bezierCurveTo(20, 25, 25, 25, 29, 26); P.lineTo(29, 6); P.bezierCurveTo(25, 5, 20, 5, 16, 8); P.lineTo(16, 28); },
    replicate: P => { P.rect(4, 10, 14, 14); P.moveTo(10, 10); P.lineTo(10, 4); P.lineTo(28, 4); P.lineTo(28, 18); P.lineTo(18, 18); },
    spark: P => { P.moveTo(16, 3); P.lineTo(16, 10); P.moveTo(16, 22); P.lineTo(16, 29); P.moveTo(3, 16); P.lineTo(10, 16); P.moveTo(22, 16); P.lineTo(29, 16); P.moveTo(7, 7); P.lineTo(11, 11); P.moveTo(21, 21); P.lineTo(25, 25); P.moveTo(25, 7); P.lineTo(21, 11); P.moveTo(11, 21); P.lineTo(7, 25); },
    pass: P => { P.moveTo(4, 16); P.lineTo(26, 16); P.moveTo(19, 9); P.lineTo(26, 16); P.lineTo(19, 23); P.moveTo(4, 9); P.lineTo(4, 23); },
    target: P => { P.arc(16, 16, 12, 0, 7); P.moveTo(22, 16); P.arc(16, 16, 6, 0, 7); P.moveTo(17, 16); P.arc(16, 16, 1, 0, 7); },
    clock: P => { P.arc(16, 16, 12, 0, 7); P.moveTo(16, 9); P.lineTo(16, 16); P.lineTo(21, 19); },
    home: P => { P.moveTo(4, 15); P.lineTo(16, 4); P.lineTo(28, 15); P.moveTo(8, 12); P.lineTo(8, 28); P.lineTo(24, 28); P.lineTo(24, 12); },
    film: P => { P.rect(3, 7, 26, 18); P.moveTo(13, 12); P.lineTo(20, 16); P.lineTo(13, 20); P.closePath(); }
  };
  const baseIcon = E.icon;
  E.icon = function (ctx, name, x, y, s, color, p = 1) {
    if (!ICON2[name]) return baseIcon(ctx, name, x, y, s, color, p);
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 32, s / 32);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p < 1) ctx.setLineDash([120 * p, 200]);
    const P = new Path2D(); ICON2[name](P); ctx.stroke(P); ctx.restore();
  };

  // ---------------------------------------------------------------- emplacements médias
  // Les médias réels se déclarent dans config/media.json. Sans média :
  //   --placeholders on  → cadre vide étiqueté « … – À INSÉRER »
  //   --placeholders off → fond abstrait discret, sans étiquette
  E.mediaWant = {}; E.mediaCache = {};
  E.mediaFrame = function (ctx, X, slot, x, y, w, h, mt, o = {}) {
    const { r = 20, alpha = 1, label = '', dur = 0 } = o;
    if (alpha <= 0.002 || w < 2 || h < 2) return;
    const { S, B } = X, m = (X.media || {})[slot];
    ctx.save(); ctx.globalAlpha *= alpha;
    E.card(ctx, X, x, y, w, h, { r, fill: '#061A36', blur: 60, dy: 24 });
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.clip();
    let drawn = false;
    if (m) {
      const idx = m.kind === 'video' ? E.clamp(Math.floor(Math.max(0, mt) * m.fps), 0, m.count - 1) : 0;
      E.mediaWant[slot] = idx;
      const c = E.mediaCache[slot];
      if (c && c.idx === idx) {
        const im = c.img, s = Math.max(w / im.width, h / im.height) * (m.fit === 'contain' ? 0 : 1) || Math.min(w / im.width, h / im.height);
        ctx.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s); drawn = true;
      }
    }
    if (!drawn && !X.placeholders) {
      // fond abstrait : nappes lumineuses lentes + onde discrète
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#0A2950'); g.addColorStop(1, '#05152C');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      [[0.3, 0.4, B.blue], [0.7, 0.6, B.teal], [0.5, 0.3, B.cyan]].forEach(([fx, fy, col], i) => {
        const cx = x + w * (fx + 0.08 * Math.sin(X.t * 0.21 + i * 2)), cy = y + h * (fy + 0.08 * Math.cos(X.t * 0.17 + i));
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45); rg.addColorStop(0, E.rgba(col, 0.22)); rg.addColorStop(1, E.rgba(col, 0));
        ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
      });
      if (o.doc) { // document : deux pages de lignes grisées
        ctx.fillStyle = E.rgba('#FFFFFF', 0.05); ctx.fillRect(x + w * 0.06, y + h * 0.08, w * 0.4, h * 0.84); ctx.fillRect(x + w * 0.54, y + h * 0.08, w * 0.4, h * 0.84);
        [0.1, 0.58].forEach((fx, j) => { E.lines(ctx, X, x + w * fx, y + h * 0.16, w * 0.32, 10, { gap: h * 0.068, h: Math.max(3, h * 0.018), seed: 5 + j, color: '#FFFFFF', a: 0.18 }); });
      } else {
      ctx.strokeStyle = E.rgba(B.amber, 0.5); ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k <= 120; k++) { const u = k / 120, env = Math.sin(u * Math.PI); const yy = y + h * 0.82 + Math.sin(u * 40 + X.t * 5) * Math.sin(u * 13 - X.t * 2.3) * 16 * env; k ? ctx.lineTo(x + w * 0.1 + u * w * 0.8, yy) : ctx.moveTo(x + w * 0.1, yy); }
      ctx.stroke();
      }
    } else if (!drawn) {
      // cadre vide étiqueté
      ctx.fillStyle = '#04122A'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = E.rgba('#FFFFFF', 0.10); ctx.lineWidth = 1;
      for (let gx = x + w / 3; gx < x + w - 1; gx += w / 3) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
      for (let gy = y + h / 3; gy < y + h - 1; gy += h / 3) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
      const sc = Math.min(1, w / 1000);
      E.icon(ctx, 'film', x + w / 2 - 22 * sc * 1.6, y + h / 2 - 90 * sc, 44 * sc * 1.6, E.rgba('#FFFFFF', 0.7));
      ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
      const f = E.fit(ctx, label, { weight: 600, size: Math.round(34 * sc), minSize: 12, maxW: w * 0.86, maxLines: 2, track: 0.08 });
      ctx.font = E.font(600, f.size); ctx.letterSpacing = (0.08 * f.size).toFixed(1) + 'px';
      f.lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + h / 2 + 10 * sc + i * f.size * 1.25));
      if (dur) {
        ctx.font = E.font(500, Math.max(12, Math.round(20 * sc))); ctx.letterSpacing = '2px'; ctx.fillStyle = E.rgba('#FFFFFF', 0.6);
        const tc = s => '00:' + String(Math.floor(E.clamp(s, 0, dur))).padStart(2, '0');
        ctx.fillText(`${tc(mt)} / ${tc(dur)}  ·  16:9`, x + w / 2, y + h / 2 + 10 * sc + f.lines.length * f.size * 1.25 + 26 * sc);
      }
      ctx.textAlign = 'left';
    }
    ctx.restore();
    // liseré ambre animé + repères d'angle
    ctx.strokeStyle = E.rgba(B.amber, 0.55); ctx.lineWidth = 2;
    const L = Math.min(40, w * 0.08);
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => { ctx.beginPath(); ctx.moveTo(cx + sx * L, cy + sy * 6); ctx.lineTo(cx + sx * 6, cy + sy * 6); ctx.lineTo(cx + sx * 6, cy + sy * L); ctx.stroke(); });
    const per = 2 * (w + h), run = ((X.t * 160) % per);
    ctx.strokeStyle = E.rgba(B.amber, 0.35); ctx.setLineDash([140, per - 140]); ctx.lineDashOffset = -run;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.stroke();
    ctx.restore();
  };

  // Chargement asynchrone des images voulues par le dernier seek (appelé par le moteur de rendu)
  window.mediaPending = () => Object.entries(E.mediaWant).some(([s, i]) => !E.mediaCache[s] || E.mediaCache[s].idx !== i);
  window.mediaLoad = async function () {
    const jobs = Object.entries(E.mediaWant).map(async ([slot, idx]) => {
      if (E.mediaCache[slot] && E.mediaCache[slot].idx === idx) return;
      const m = E.base.media[slot], im = new Image();
      im.src = m.kind === 'video' ? m.pattern.replace('%05d', String(idx + 1).padStart(5, '0')) : m.url;
      await im.decode(); E.mediaCache[slot] = { idx, img: im };
    });
    await Promise.all(jobs);
  };
})();
