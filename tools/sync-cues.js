// Recopie dans config/timing.json les repères par défaut des séquences (sans écraser vos réglages).
//   node tools/sync-cues.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..'), rj = p => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
(async () => {
  const b = await chromium.launch(), pg = await b.newPage();
  const cfg = { texts: rj('config/texts.json').fr, strings: rj('config/strings.json').fr, theme: rj('config/theme.json'), timing: rj('config/timing.json'), scale: 0.1 };
  await pg.addInitScript(c => { window.__CFG = c; }, cfg); await pg.goto('file://' + R + '/engine/index.html'); await pg.evaluate(() => boot());
  const defs = await pg.evaluate(() => Object.fromEntries(Object.entries(E.seqs).map(([k, d]) => [k, d.cues || {}])));
  await b.close();
  const t = rj('config/timing.json');
  t.sequences.forEach(s => { s.cues = { ...(defs[s.id] || {}), ...s.cues }; });
  fs.writeFileSync(path.join(R, 'config/timing.json'), JSON.stringify(t, null, 2) + '\n');
  console.log('timing.json mis à jour');
})();
