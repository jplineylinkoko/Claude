// Séquence 3 — gabarit provisoire (construit à l'étape 3)
(function () {
  function draw(ctx, lt, X, o = {}) {
    if (o.tail) return;
    E.dust(ctx, X);
    const p = E.S2 ? E.S2.endScreen() : [E.W / 2, E.H / 2];
    E.pepite(ctx, X, p[0], p[1], E.S2 ? E.S2.endR : 16, 1.2);
    E.text(ctx, lt, 'Séquence 3 — à construire', { x: E.MX, y: 300, valign: 'bottom', size: 64, weight: 600, maxW: 900, maxLines: 1, color: E.rgba(X.S.ink, 0.35), tIn: 0.2 });
  }
  E.defineSeq(3, { draw });
})();
