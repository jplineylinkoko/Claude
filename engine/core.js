// ============================================================================
// Moteur — fonctions pures. Aucune horloge, aucun état mutable influençant
// l'image, aléatoire uniquement seedé. window.seek(t) peint l'image à l'instant t.
// ============================================================================
(function () {
  const E = (window.E = {});
  const W = (E.W = 1920), H = (E.H = 1080);
  E.MX = Math.round(W * 0.08); E.MY = Math.round(H * 0.08);
  E.SUB_TOP = H - E.MY - 150;          // bande basse réservée aux sous-titres
  E.seqs = {};                          // id -> définition de séquence
  E.defineSeq = (id, def) => { E.seqs[id] = def; };

  // ---------------------------------------------------------------- maths
  E.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.mixPt = (p, q, t) => [E.lerp(p[0], q[0], t), E.lerp(p[1], q[1], t)];
  E.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  E.hash = (i, s = 1) => E.rng(i * 9301 + s * 49297 + 233280)();

  // ---------------------------------------------------------------- easing (jamais linéaire)
  const ease = (E.ease = {
    cubicOut: t => 1 - Math.pow(1 - t, 3),
    cubicIn: t => t * t * t,
    cubicInOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expoOut: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    expoIn: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    expoInOut: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    sineInOut: t => -(Math.cos(Math.PI * t) - 1) / 2,
    // anticipation : petit recul (≈ -4 %) avant de partir, puis expo
    anticipate: t => { const a = 0.18; if (t < a) { const u = t / a; return -0.04 * Math.sin(Math.PI * u); } return ease.expoInOut((t - a) / (1 - a)); }
  });
  // progression bornée 0→1 entre t0 et t0+d avec easing
  E.prog = (t, t0, d, fn = ease.cubicInOut) => fn(E.clamp((t - t0) / d));
  // Ressort amorti (solution analytique, sans état) : 0 → 1, léger dépassement puis stabilisation
  E.spring = function (t, t0 = 0, o = {}) {
    const z = o.zeta ?? 0.62, f = o.freq ?? 1.7; const x = t - t0;
    if (x <= 0) return 0;
    const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x));
  };

  // ---------------------------------------------------------------- couleurs
  const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  E.rgba = (hex, a = 1) => { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${E.clamp(a)})`; };
  E.mix = (h1, h2, t, a = 1) => { const p = hexRGB(h1), q = hexRGB(h2); return `rgba(${p.map((v, i) => Math.round(E.lerp(v, q[i], E.clamp(t)))).join(',')},${a})`; };

  // ---------------------------------------------------------------- contexte de rendu
  E.font = (w, s, fam) => `${w} ${s}px ${fam || (s >= 56 ? 'InterDisplay' : 'Inter')}`;
  E.px = 1; // facteur d'échelle de sortie (aperçus basse définition)
  E.blur = r => (r > 0.05 ? `blur(${(r * E.px).toFixed(2)}px)` : 'none');
  E.sb = r => r * E.px; // shadowBlur à l'échelle

  // ---------------------------------------------------------------- texte
  // Retour à la ligne + réduction automatique. Renvoie {lines, size}
  E.fit = function (ctx, text, o) {
    const { weight = 600, maxW = 1200, maxLines = 2, size = 72, minSize = 28, fam, track = 0 } = o;
    for (let s = size; s >= minSize; s -= 2) {
      ctx.font = E.font(weight, s, fam); ctx.letterSpacing = (track * s).toFixed(2) + 'px';
      const words = String(text).split(/\s+/).filter(Boolean), lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; } }
      if (cur) lines.push(cur);
      if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxW)) return { lines, size: s };
      if (s - 2 < minSize) {
        // dernier recours : coupe les mots trop longs pour ne jamais déborder
        const out = []; for (const l of lines) { let cur2 = ''; for (const ch of l) { if (ctx.measureText(cur2 + ch).width > maxW) { out.push(cur2); cur2 = ch; } else cur2 += ch; } out.push(cur2); }
        return { lines: out.slice(0, Math.max(maxLines, out.length)), size: s };
      }
    }
  };

  // Texte révélé par masque, mot à mot (mode 'word') ou ligne à ligne ('line').
  // tIn : début d'entrée ; tOut : début de sortie (vers le haut) ; stagger en s.
  E.text = function (ctx, t, str, o) {
    const { x, y, color, align = 'left', valign = 'top', lh = 1.12, tIn = 0, tOut = 1e9, stagger = 0.06, mode = 'word', alpha = 1, track = 0 } = o;
    const f = E.fit(ctx, str, o), s = f.size;
    ctx.save();
    ctx.font = E.font(o.weight ?? 600, s, o.fam); ctx.letterSpacing = (track * s).toFixed(2) + 'px';
    ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
    const n = f.lines.length, step = s * lh;
    let y0 = valign === 'top' ? y + s * 0.8 : valign === 'middle' ? y - (n - 1) * step / 2 + s * 0.32 : y - (n - 1) * step;
    let k = 0, box = { x: 1e9, y: y0 - s * 0.8, w: 0, h: n * step, size: s, lines: n };
    f.lines.forEach((line, li) => {
      const by = y0 + li * step, lw = ctx.measureText(line).width;
      const lx = align === 'center' ? x - lw / 2 : align === 'right' ? x - lw : x;
      box.x = Math.min(box.x, lx); box.w = Math.max(box.w, lw);
      ctx.save(); ctx.beginPath(); ctx.rect(lx - s, by - s * 1.02, lw + 2 * s, s * 1.32); ctx.clip();
      const parts = mode === 'line' ? [line] : line.split(' ');
      let cx = lx;
      parts.forEach(w => {
        const d = (k++) * stagger;
        const pin = E.spring(t, tIn + d, { zeta: 0.7, freq: 1.5 });
        const pout = E.prog(t, tOut + d * 0.6, 0.45, ease.cubicIn);
        const dy = (1 - pin) * s * 1.1 - pout * s * 1.15;
        ctx.globalAlpha = alpha * E.clamp(pin * 1.6) * (1 - pout * 0.3);
        if (pin > 0.001 && pout < 1) ctx.fillText(w, cx, by + dy);
        cx += ctx.measureText(w + ' ').width;
      });
      ctx.restore();
    });
    ctx.restore();
    box.y2 = box.y + box.h;
    return box;
  };

  // ---------------------------------------------------------------- éléments graphiques
  E.dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 6.2832); ctx.fill(); };
  // Point flou bon marché (dégradé radial, sans filtre canvas) : hex, alpha, flou en px
  E.softDot = function (ctx, x, y, r, hex, a, b = 0) {
    if (a <= 0.002 || r <= 0) return;
    if (b < 0.3) return E.dot(ctx, x, y, r, E.rgba(hex, a));
    const R = r + b * 1.6, g = ctx.createRadialGradient(x, y, 0, x, y, R);
    const k = r * r / (R * R); // conserve à peu près l'énergie lumineuse
    g.addColorStop(0, E.rgba(hex, a * Math.min(1, 0.35 + k * 1.3))); g.addColorStop(E.clamp((r - b * 0.6) / R, 0, 0.9), E.rgba(hex, a * Math.min(1, k * 1.3 + 0.12))); g.addColorStop(1, E.rgba(hex, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
  };
  // Calque : dessine fn dans un tampon puis le compose UNE fois avec flou et opacité
  const POOL = [];
  let depth = 0;
  E.layer = function (ctx, blur, alpha, fn) {
    if (alpha <= 0.002) return;
    if (blur < 0.05 && alpha >= 0.999) { ctx.save(); fn(ctx); ctx.restore(); return; }
    const cv = ctx.canvas;
    if (!POOL[depth]) POOL[depth] = document.createElement('canvas');
    const oc = POOL[depth]; if (oc.width !== cv.width || oc.height !== cv.height) { oc.width = cv.width; oc.height = cv.height; }
    const o = oc.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, oc.width, oc.height);
    o.setTransform(ctx.getTransform()); o.filter = 'none'; o.globalAlpha = 1;
    depth++; o.save(); fn(o); o.restore(); depth--;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.filter = E.blur(blur); ctx.drawImage(oc, 0, 0); ctx.restore();
  };

  // La pépite : noyau chaud + halo. k = intensité (0..1.5)
  E.pepite = function (ctx, X, x, y, r, k = 1) {
    if (r <= 0.05 || k <= 0.001) return;
    const { S, B } = X;
    const br = 1 + 0.035 * Math.sin((X.t / (X.beat * 4)) * Math.PI * 2); // respiration calée sur 4 temps
    r *= br;
    ctx.save();
    ctx.globalCompositeOperation = S.mode === 'dark' ? 'lighter' : 'source-over';
    const R = r * 9, halo = ctx.createRadialGradient(x, y, 0, x, y, R);
    halo.addColorStop(0, E.rgba(B.amber, 0.36 * k * S.glow)); halo.addColorStop(0.22, E.rgba(B.amber, 0.11 * k * S.glow)); halo.addColorStop(1, E.rgba(B.amber, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = E.clamp(k);
    const core = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, 0, x, y, r);
    core.addColorStop(0, '#FFF6DC'); core.addColorStop(0.35, '#F7C04A'); core.addColorStop(1, B.amber);
    ctx.shadowColor = E.rgba(B.amber, 0.6); ctx.shadowBlur = E.sb(r * 1.6);
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.restore();
  };

  // Icônes au trait fin homogène (grille 32, trait 1.8)
  E.icon = function (ctx, name, x, y, s, color, p = 1) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 32, s / 32);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8 * 32 / s * (s / 32) * (32 / s) * (s / 32); ctx.lineWidth = 1.8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p < 1) { ctx.setLineDash([120 * p, 200]); }
    const P = new Path2D();
    switch (name) {
      case 'doc': P.moveTo(8, 3); P.lineTo(19, 3); P.lineTo(25, 9); P.lineTo(25, 29); P.lineTo(8, 29); P.closePath(); P.moveTo(19, 3); P.lineTo(19, 9); P.lineTo(25, 9); P.moveTo(12, 15); P.lineTo(21, 15); P.moveTo(12, 20); P.lineTo(21, 20); P.moveTo(12, 25); P.lineTo(17, 25); break;
      case 'report': P.rect(6, 4, 20, 25); P.moveTo(11, 23); P.lineTo(11, 18); P.moveTo(16, 23); P.lineTo(16, 12); P.moveTo(21, 23); P.lineTo(21, 15); break;
      case 'proc': P.rect(6, 4, 20, 25); P.moveTo(10, 11); P.lineTo(12, 13); P.lineTo(15, 9); P.moveTo(18, 11); P.lineTo(22, 11); P.moveTo(10, 19); P.lineTo(12, 21); P.lineTo(15, 17); P.moveTo(18, 19); P.lineTo(22, 19); break;
      case 'branch': P.arc(8, 8, 3, 0, 7); P.moveTo(27, 16); P.arc(24, 16, 3, 0, 7); P.moveTo(11, 24); P.arc(8, 24, 3, 0, 7); P.moveTo(11, 8); P.bezierCurveTo(16, 8, 16, 16, 21, 16); P.moveTo(8, 11); P.lineTo(8, 21); break;
      case 'hand': P.moveTo(9, 27); P.lineTo(9, 15); P.bezierCurveTo(9, 12, 13, 12, 13, 15); P.lineTo(13, 6); P.bezierCurveTo(13, 3, 17, 3, 17, 6); P.lineTo(17, 14); P.moveTo(17, 8); P.bezierCurveTo(17, 5, 21, 5, 21, 8); P.lineTo(21, 15); P.moveTo(21, 10); P.bezierCurveTo(21, 7, 25, 7, 25, 10); P.lineTo(25, 20); P.bezierCurveTo(25, 26, 21, 29, 17, 29); P.lineTo(13, 29); P.bezierCurveTo(11, 29, 9, 28, 9, 27); break;
      case 'alert': P.moveTo(16, 4); P.lineTo(29, 27); P.lineTo(3, 27); P.closePath(); P.moveTo(16, 12); P.lineTo(16, 19); P.moveTo(16, 23); P.lineTo(16, 23.2); break;
      case 'search': P.arc(14, 14, 8, 0, 7); P.moveTo(20, 20); P.lineTo(27, 27); break;
    }
    ctx.stroke(P); ctx.restore();
  };

  // Caméra : centre monde (cx, cy), échelle s → appliquée au contexte courant
  E.camera = (ctx, cx, cy, s) => { ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-cx, -cy); };
  E.toScreen = (p, cam) => [(p[0] - cam.cx) * cam.s + W / 2, (p[1] - cam.cy) * cam.s + H / 2];

  // ---------------------------------------------------------------- fond, poussière, grain, habillage
  E.background = function (ctx, X, S) {
    S = S || X.S;
    const g = ctx.createRadialGradient(W * 0.62, H * 0.42, 50, W * 0.5, H * 0.5, W * 0.75);
    g.addColorStop(0, S.bg); g.addColorStop(1, S.bgDeep);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  // Poussière lumineuse en 3 plans de profondeur, parallaxe lente et continue
  const DUST = []; { const r = E.rng(404); for (let i = 0; i < 150; i++) DUST.push({ x: r() * W, y: r() * H, z: r(), s: 0.6 + r() * 1.8, ph: r() * 6.28 }); }
  E.dust = function (ctx, X, cam = { cx: W / 2, cy: H / 2, s: 1 }, k = 1) {
    const { S } = X;
    for (let layer = 0; layer < 3; layer++) {
      ctx.save(); const bl = [2.6, 1.2, 0][layer];
      for (let i = layer; i < DUST.length; i += 3) {
        const d = DUST[i], par = 0.25 + layer * 0.3;
        let x = d.x + X.t * (4 + layer * 5) - (cam.cx - W / 2) * par, y = d.y - X.t * (1.5 + layer) - (cam.cy - H / 2) * par;
        x = ((x % W) + W) % W; y = ((y % H) + H) % H;
        const sc = 1 + (cam.s - 1) * par;
        x = (x - W / 2) * sc + W / 2; y = (y - H / 2) * sc + H / 2;
        const a = (0.05 + 0.08 * layer) * (0.6 + 0.4 * Math.sin(X.t * 0.8 + d.ph)) * k;
        E.softDot(ctx, x, y, d.s * (0.8 + layer * 0.35) * sc, S.line, a, bl * sc);
      }
      ctx.restore();
    }
  };

  // Grain adouci : bruit à demi-résolution (grain plus doux), renouvelé 12 fois/s
  // au lieu de 60 (beaucoup moins coûteux à l'encodage), amplitude réduite.
  let GRAIN = null;
  E.grain = function (ctx, X) {
    if (!GRAIN) {
      GRAIN = [];
      for (let k = 0; k < 6; k++) {
        const c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2;
        const g = c.getContext('2d'), id = g.createImageData(W / 2, H / 2), r = E.rng(1000 + k);
        for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 200; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
        g.putImageData(id, 0, 0); GRAIN.push(c);
      }
    }
    const fi = Math.floor(Math.round(X.t * X.fps) / Math.max(1, Math.round(X.fps / 12))) % 6;
    ctx.save(); ctx.globalAlpha = X.S.grain * 2; ctx.globalCompositeOperation = 'overlay'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(GRAIN[fi], 0, 0, W, H); ctx.restore();
  };

  E.vignette = function (ctx, X) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, X.S.mode === 'dark' ? 'rgba(2,10,24,0.55)' : 'rgba(60,45,20,0.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  E.chrome = function (ctx, X) {
    const { S, T } = X, a = E.prog(X.t, 0.3, 1.2, ease.cubicOut) * (1 - E.prog(X.t, X.total - 2.4, 1.2));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const lab = E.fit(ctx, T.PROJECT_LABEL.toUpperCase(), { weight: 500, size: 17, minSize: 12, maxW: 900, maxLines: 1, track: 0.14 });
    ctx.font = E.font(500, lab.size); ctx.letterSpacing = (0.14 * lab.size).toFixed(1) + 'px'; ctx.fillStyle = E.rgba(S.ink, 0.55);
    ctx.fillText(lab.lines[0], E.MX, E.MY - 22);
    ctx.textAlign = 'right'; ctx.fillText(String(X.seq).padStart(2, '0') + ' / 10', W - E.MX, E.MY - 22);
    if (X.logo) { const h = 30, w = X.logo.width / X.logo.height * h; ctx.drawImage(X.logo, W - E.MX - 110 - w, E.MY - 22 - h + 6, w, h); }
    ctx.fillStyle = E.rgba(S.line, S.lineAlpha * 0.8); ctx.fillRect(E.MX, E.MY - 6, W - 2 * E.MX, 1);
    ctx.restore();
  };

  // ---------------------------------------------------------------- minutage
  E.setup = function (cfg) {
    E.cfg = cfg;
    const tm = cfg.timing; E.beat = 60 / tm.bpm; E.fps = tm.fps;
    let acc = 0; E.timeline = tm.sequences.map(s => { const o = { ...s, start: acc }; acc += s.dur; return o; });
    E.total = acc;
    const S = cfg.theme.styles[cfg.style || cfg.theme.selected || 'B_nuit'];
    E.base = { S, B: cfg.theme.brand, T: cfg.texts, L: cfg.strings, media: cfg.media || {}, placeholders: !!cfg.placeholders, beat: E.beat, fps: E.fps, total: E.total, logo: null };
    if (cfg.texts.CLIENT_LOGO) { const im = new Image(); im.src = cfg.texts.CLIENT_LOGO; E.logoReady = im.decode().then(() => { E.base.logo = im; }).catch(() => {}); }
    else E.logoReady = Promise.resolve();
  };

  // contexte d'une séquence : cue(nom) → secondes locales
  E.ctxFor = function (i, t) {
    const sq = E.timeline[i], def = E.seqs[sq.id] || {};
    const defDur = def.defaultDur || sq.dur, k = Math.min(1, sq.dur / defDur);
    const cue = name => { const b = sq.cues[name] ?? (def.cues || {})[name] ?? 0; return b * E.beat * (b * E.beat > sq.dur ? k : 1); };
    return { ...E.base, t, seq: sq.id, dur: sq.dur, start: sq.start, cue, def, index: i };
  };

  // ---------------------------------------------------------------- seek(t)
  E.canvas = null; E.ctx = null;
  window.seek = function (t) {
    const ctx = E.ctx; E.mediaWant = {};
    ctx.setTransform(E.px, 0, 0, E.px, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    t = E.clamp(t, 0, E.total - 1e-6);
    let i = E.timeline.findIndex(s => t >= s.start && t < s.start + s.dur); if (i < 0) i = E.timeline.length - 1;
    const X = E.ctxFor(i, t), lt = t - X.start;
    E.background(ctx, X);
    // la séquence précédente peut prolonger ses sorties pendant sa « traîne »
    const prev = i > 0 ? E.ctxFor(i - 1, t) : null, pdef = prev && E.seqs[prev.seq];
    if (pdef && pdef.tail && lt < pdef.tail) { ctx.save(); pdef.draw(ctx, prev.dur + lt, prev, { tail: true }); ctx.restore(); }
    const def = E.seqs[X.seq];
    if (def) { ctx.save(); def.draw(ctx, lt, X, { prev }); ctx.restore(); }
    E.vignette(ctx, X);
    E.chrome(ctx, X);
    E.grain(ctx, X);
    // seule exception autorisée : fondu au noir sur la toute fin
    const fo = E.prog(t, E.total - 0.8, 0.8, ease.cubicIn);
    if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
    return true;
  };
})();
