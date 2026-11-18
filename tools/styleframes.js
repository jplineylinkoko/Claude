// Rendu des style frames : node tools/styleframes.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(root, 'config/theme.json')));
const texts = JSON.parse(fs.readFileSync(path.join(root, 'config/texts.json'))).fr;
const out = path.join(root, 'styleframes/out');
fs.mkdirSync(out, { recursive: true });

const plan = {
  A_clair: { s2: 'A_clair', s3: 'A_clair', s7: 'A_clair' },
  B_nuit: { s2: 'B_nuit', s3: 'B_nuit', s7: 'B_nuit' },
  C_hybride: { s2: 'B_nuit', s3: 'A_clair', s7: 'A_clair' }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(([t, x]) => { window.__THEME = t; window.__TEXTS = x; }, [theme, texts]);
  await page.goto('file://' + path.join(root, 'styleframes/styleframes.html'));
  await page.evaluate(() => document.fonts.ready.then(() => Promise.all([...document.fonts].map(f => f.load()))));
  const done = new Set();
  for (const [style, scenes] of Object.entries(plan)) {
    for (const [scene, key] of Object.entries(scenes)) {
      const file = path.join(out, `${scene}_${key}.png`);
      if (!done.has(file)) {
        await page.evaluate(([k, s]) => window.renderFrame(k, s), [key, scene]);
        await (await page.$('canvas')).screenshot({ path: file });
        done.add(file);
      }
      console.log(style, scene, '→', path.basename(file));
    }
  }
  await browser.close();
})();
