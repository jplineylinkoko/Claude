// ============================================================================
// Maquette intranet générique et neutre (séq. 6, 7, 9). Coordonnées de page
// en 1240×690, mises à l'échelle dans le rectangle de la fenêtre.
// Chaque page renvoie ses points d'interaction (cibles du curseur).
// ============================================================================
(function () {
  const PW = 1240, PH = 690;
  const S = (E.site = { PW, PH });

  function header(ctx, X, active, o) {
    const { B, T, L } = X;
    ctx.fillStyle = X.S.mode === 'dark' ? '#0B2A50' : B.night; ctx.fillRect(0, 0, PW, 72);
    ctx.fillStyle = '#FFFFFF';
    const f = E.fit(ctx, T.SITE_NAME, { weight: 700, size: 22, minSize: 13, maxW: 230, maxLines: 1 });
    ctx.font = E.font(700, f.size); ctx.fillText(f.lines[0], 36, 44);
    if (o.labels !== false) {
      const items = [L.s6_home, T.DOMAIN_1, T.DOMAIN_2]; let x = 300;
      items.forEach((n, i) => {
        const g = E.fit(ctx, n, { weight: 500, size: 17, minSize: 11, maxW: 150, maxLines: 1 });
        ctx.font = E.font(500, g.size); ctx.fillStyle = i === active ? '#FFFFFF' : 'rgba(255,255,255,0.6)'; ctx.fillText(g.lines[0], x, 43);
        const w = ctx.measureText(g.lines[0]).width;
        if (i === active) { ctx.fillStyle = B.cyan; ctx.fillRect(x, 66, w, 3); }
        x += Math.max(150, w + 40);
      });
    } else { [0, 1, 2].forEach(i => { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(300 + i * 150, 36, 90, 9, 5); ctx.fill(); }); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(PW - 300, 18, 264, 36, 18); ctx.fill();
    E.icon(ctx, 'search', PW - 288, 25, 22, 'rgba(255,255,255,0.7)');
  }
  function crumbs(ctx, X, list) {
    ctx.font = E.font(500, 16); let bx = 56;
    list.forEach((c, i) => {
      const g = E.fit(ctx, c, { weight: 500, size: 16, minSize: 11, maxW: 220, maxLines: 1 }); ctx.font = E.font(500, g.size);
      ctx.fillStyle = i === list.length - 1 ? X.S.ink : X.S.muted; ctx.fillText(g.lines[0], bx, 118); bx += ctx.measureText(g.lines[0]).width + 14;
      if (i < list.length - 1) { ctx.fillStyle = X.S.muted; ctx.fillText('›', bx, 118); bx += 22; }
    });
  }
  function title(ctx, X, txt, y = 176, size = 36, maxW = 900) {
    const f = E.fit(ctx, txt, { weight: 700, size, minSize: 20, maxW, maxLines: 1 });
    ctx.font = E.font(700, f.size); ctx.fillStyle = X.S.ink; ctx.fillText(f.lines[0], 56, y);
  }
  const panel = X => (X.S.mode === 'dark' ? '#16416F' : '#F3F5F8');

  S.pages = {
    home(ctx, X, o) {
      const { B, T } = X, lab = o.labels !== false;
      header(ctx, X, 0, o);
      // recherche centrale
      ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(56, 110, PW - 112, 64, 32); ctx.fill();
      E.icon(ctx, 'search', 80, 126, 30, X.S.muted);
      E.lines(ctx, X, 130, 136, 300, 1, { h: 12, seed: 3 });
      const tiles = [[56, 206, 551, 190, B.cyan, T.DOMAIN_1], [633, 206, 551, 190, B.teal, T.DOMAIN_2]];
      tiles.forEach(([x, y, w, h, c, n], i) => {
        ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
        ctx.fillStyle = E.rgba(c, 0.9); ctx.fillRect(x, y + 24, 4, 44);
        if (lab && (o.tileLabels ?? 1) > 0) { const f = E.fit(ctx, n, { weight: 700, size: 30, minSize: 16, maxW: w - 80, maxLines: 1 }); ctx.save(); ctx.globalAlpha *= o.tileLabels ?? 1; ctx.font = E.font(700, f.size); ctx.fillStyle = X.S.ink; ctx.fillText(f.lines[0], x + 32, y + 58); ctx.restore(); }
        else E.lines(ctx, X, x + 32, y + 40, 180, 1, { h: 16, seed: 9 + i, a: 0.3 });
        E.lines(ctx, X, x + 32, y + 100, w - 120, 2, { gap: 26, h: 10, seed: 20 + i });
        E.icon(ctx, i ? 'people' : 'target', x + w - 64, y + 28, 32, c);
      });
      for (let i = 0; i < 4; i++) {
        const x = 56 + i * 288, y = 422;
        ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(x, y, 264, 210, 14); ctx.fill();
        ctx.fillStyle = E.rgba([B.blue, B.cyan, B.teal, B.blue][i], 0.25); ctx.beginPath(); ctx.roundRect(x + 20, y + 20, 224, 86, 10); ctx.fill();
        E.lines(ctx, X, x + 20, y + 128, 210, 3, { gap: 24, h: 9, seed: 40 + i });
      }
      return { d1: [56 + 275, 206 + 95], d2: [633 + 275, 206 + 95] };
    },
    domain(ctx, X, o) {
      const { B, T, L } = X;
      header(ctx, X, 1, o); crumbs(ctx, X, [L.s6_home, T.DOMAIN_1]); title(ctx, X, T.DOMAIN_1);
      for (let i = 0; i < 5; i++) {
        const y = 214 + i * 86;
        ctx.fillStyle = i === 0 ? E.rgba(B.cyan, 0.12) : panel(X); ctx.beginPath(); ctx.roundRect(56, y, 760, 68, 12); ctx.fill();
        if (i === 0) { const f = E.fit(ctx, T.TOPIC, { weight: 600, size: 22, minSize: 13, maxW: 600, maxLines: 1 }); ctx.font = E.font(600, f.size); ctx.fillStyle = X.S.ink; ctx.fillText(f.lines[0], 84, y + 42); }
        else E.lines(ctx, X, 84, y + 28, 360, 1, { h: 12, seed: 50 + i });
        ctx.strokeStyle = X.S.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(780, y + 26); ctx.lineTo(788, y + 34); ctx.lineTo(780, y + 42); ctx.stroke();
      }
      ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(860, 214, 324, 412, 14); ctx.fill();
      E.lines(ctx, X, 888, 250, 260, 9, { gap: 30, h: 9, seed: 61 });
      return { topic: [56 + 300, 214 + 34] };
    },
    topic(ctx, X, o) {
      const { B, T, L } = X;
      header(ctx, X, 1, o); crumbs(ctx, X, [L.s6_home, T.DOMAIN_1, T.TOPIC]); title(ctx, X, T.TOPIC);
      const cards = [[L.s5_c1, 'branch', B.blue], [L.s7_playbook, 'doc', B.cyan], [T.DELIVERABLE_3, 'spark', B.amber]];
      cards.forEach(([n, ic, c], i) => {
        const x = 56 + i * 384, y = 220;
        ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(x, y, 360, 360, 16); ctx.fill();
        ctx.fillStyle = E.rgba(c, 0.9); ctx.fillRect(x, y + 30, 4, 40);
        E.icon(ctx, ic, x + 30, y + 30, 36, c);
        const f = E.fit(ctx, n, { weight: 700, size: 26, minSize: 15, maxW: 300, maxLines: 1 }); ctx.font = E.font(700, f.size); ctx.fillStyle = X.S.ink; ctx.fillText(f.lines[0], x + 30, y + 112);
        E.lines(ctx, X, x + 30, y + 150, 290, 6, { gap: 28, h: 9, seed: 80 + i });
      });
      return { playbook: [56 + 384 + 180, 220 + 180] };
    },
    playbook(ctx, X, o) {
      const { B, T, L } = X;
      header(ctx, X, 1, o); crumbs(ctx, X, [L.s6_home, T.DOMAIN_1, T.TOPIC, L.s7_playbook]);
      title(ctx, X, `${L.s7_playbook} — ${T.TOPIC}`);
      // contenu
      const cx = 56, cy = 214;
      E.lines(ctx, X, cx, cy, 760, 5, { gap: 32, h: 11, seed: 90 });
      const hy = cy + 5 * 32 + 6;
      const ex = E.fit(ctx, T.PLAYBOOK_EXCERPT, { weight: 600, size: 22, minSize: 13, maxW: 740, maxLines: 2 });
      ctx.font = E.font(600, ex.size);
      const ew = Math.max(...ex.lines.map(l => ctx.measureText(l).width)), eh = ex.lines.length * ex.size * 1.3 + 16;
      const hl = o.highlight ?? 0;
      if (hl > 0) { ctx.fillStyle = E.rgba(B.amber, X.S.mode === 'dark' ? 0.3 : 0.22); ctx.beginPath(); ctx.roundRect(cx - 12, hy, (ew + 24) * hl, eh, 6); ctx.fill(); ctx.fillStyle = B.amber; ctx.fillRect(cx - 12, hy, 4, eh); }
      ctx.fillStyle = X.S.ink; ex.lines.forEach((l, i) => ctx.fillText(l, cx + 4, hy + 8 + ex.size * 0.95 + i * ex.size * 1.3));
      E.lines(ctx, X, cx, hy + eh + 22, 760, 6, { gap: 32, h: 11, seed: 91 });
      // encart « voir aussi » → fiche
      ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(860, 214, 324, 300, 14); ctx.fill();
      E.lines(ctx, X, 888, 244, 140, 1, { h: 9, seed: 7, a: 0.3 });
      ctx.fillStyle = E.rgba(B.amber, 0.14); ctx.beginPath(); ctx.roundRect(884, 280, 276, 70, 12); ctx.fill();
      E.icon(ctx, 'spark', 900, 299, 30, B.amber);
      const f = E.fit(ctx, T.DELIVERABLE_3, { weight: 600, size: 20, minSize: 12, maxW: 190, maxLines: 1 }); ctx.font = E.font(600, f.size); ctx.fillStyle = X.S.ink; ctx.fillText(f.lines[0], 944, 322);
      E.lines(ctx, X, 888, 384, 260, 4, { gap: 28, h: 9, seed: 8 });
      return { excerpt: [cx - 12, hy, ew + 24, eh], keyfact: [884 + 138, 280 + 35] };
    },
    keyfact(ctx, X, o) {
      const { B, T, L } = X;
      header(ctx, X, 1, o); crumbs(ctx, X, [L.s6_home, T.DOMAIN_1, T.TOPIC, T.DELIVERABLE_3]);
      ctx.fillStyle = panel(X); ctx.beginPath(); ctx.roundRect(56, 150, 1128, 490, 18); ctx.fill();
      ctx.fillStyle = B.amber; ctx.fillRect(56, 190, 5, 150);
      ctx.font = E.font(600, 16); ctx.letterSpacing = '2.5px'; ctx.fillStyle = B.amber;
      const f0 = E.fit(ctx, T.DELIVERABLE_3.toUpperCase(), { weight: 600, size: 16, minSize: 11, maxW: 600, maxLines: 1, track: 0.15 });
      ctx.font = E.font(600, f0.size); ctx.fillText(f0.lines[0], 100, 206); ctx.letterSpacing = '0px';
      const f = E.fit(ctx, T.KEY_FACT_SUMMARY, { weight: 700, size: 46, minSize: 22, maxW: 1000, maxLines: 3 });
      ctx.font = E.font(700, f.size); ctx.fillStyle = X.S.ink; f.lines.forEach((l, i) => ctx.fillText(l, 100, 270 + i * f.size * 1.18));
      const ly = 270 + f.lines.length * f.size * 1.18 + 30;
      E.lines(ctx, X, 100, ly, 900, 4, { gap: 30, h: 10, seed: 95 });
      [B.blue, B.teal, B.cyan].forEach((c, i) => { ctx.fillStyle = E.rgba(c, 0.18); ctx.beginPath(); ctx.roundRect(100 + i * 150, 580, 130, 32, 16); ctx.fill(); ctx.fillStyle = E.rgba(c, 0.8); ctx.fillRect(118 + i * 150, 594, 80, 5); });
      return { bullet: [80, 260] };
    }
  };

  // Dessine une page dans le rectangle r=[x,y,w,h] (écran), avec fenêtre et ombre.
  // pages : [{name, dx, alpha}] pour les transitions glissées.
  S.window = function (ctx, X, r, pages, o = {}) {
    const [x, y, w, h] = r, k = w / PW;
    if (o.alpha !== undefined && o.alpha <= 0.002) return {};
    ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    E.card(ctx, X, x, y, w, h, { r: 18 * k + 2, fill: X.S.mode === 'dark' ? '#0F3462' : '#FFFFFF', blur: 70, dy: 26 });
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18 * k + 2); ctx.clip();
    let hot = {};
    pages.forEach(p => {
      if (p.alpha <= 0.002) return;
      ctx.save(); ctx.globalAlpha *= p.alpha; ctx.translate(x + (p.dx || 0) * k, y); ctx.scale(k, k);
      const h2 = S.pages[p.name](ctx, X, { ...o, ...p });
      if (p.main) hot = h2;
      ctx.restore();
    });
    ctx.restore();
    // points chauds en coordonnées écran
    const out = {};
    for (const [n, v] of Object.entries(hot)) out[n] = v.length === 2 ? [x + v[0] * k, y + v[1] * k] : [x + v[0] * k, y + v[1] * k, v[2] * k, v[3] * k];
    return out;
  };
})();
