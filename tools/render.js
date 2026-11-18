#!/usr/bin/env node
// Rendu image par image (Playwright) → ffmpeg (H.264, CRF 16, yuv420p, +faststart).
//
//   node tools/render.js                          film complet → render/video_<lang>.mp4
//   node tools/render.js --range 0 27             rendu partiel (secondes)
//   node tools/render.js --frames 3.5,12,20       PNG d'images isolées
//   options : --lang en|fr  --placeholders on|off  --config <texts.json>
//             --out <fichier>  --scale 0.5  --fps 60  --workers 3  --style B_nuit
//             --audio <wav>  (muxé en AAC si fourni)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const ROOT = path.resolve(__dirname, '..');
function args() {
  const a = process.argv.slice(2), o = { lang: 'en', placeholders: 'off', scale: 1, workers: Math.max(1, Math.min(4, os.cpus().length - 1)) };
  for (let i = 0; i < a.length; i++) {
    const k = a[i].replace(/^--/, '');
    if (k === 'range') { o.range = [parseFloat(a[++i]), parseFloat(a[++i])]; }
    else if (k === 'frames') o.frames = a[++i].split(',').map(Number);
    else o[k] = a[++i];
  }
  o.scale = parseFloat(o.scale); o.workers = parseInt(o.workers);
  return o;
}
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));

function loadConfig(o) {
  const textsAll = readJSON(o.config ? path.resolve(o.config) : path.join(ROOT, 'config/texts.json'));
  const stringsAll = readJSON(path.join(ROOT, 'config/strings.json'));
  if (!textsAll[o.lang]) throw new Error(`Langue inconnue dans texts.json : ${o.lang}`);
  const texts = { ...textsAll[o.lang] };
  if (texts.CLIENT_LOGO) { const lp = path.resolve(o.config ? path.dirname(path.resolve(o.config)) : ROOT, texts.CLIENT_LOGO); texts.CLIENT_LOGO = fs.existsSync(lp) ? 'file://' + lp : ''; }
  const theme = readJSON(path.join(ROOT, 'config/theme.json'));
  const timing = readJSON(path.join(ROOT, 'config/timing.json'));
  if (o.fps) timing.fps = parseFloat(o.fps);
  return { texts, strings: stringsAll[o.lang], theme, timing, style: o.style, placeholders: o.placeholders === 'on', scale: o.scale };
}

async function openPage(browser, cfg) {
  const page = await browser.newPage({ viewport: { width: Math.round(1920 * cfg.scale), height: Math.round(1080 * cfg.scale) } });
  page.on('pageerror', e => { console.error('Erreur page :', e.message); process.exitCode = 1; });
  await page.addInitScript(c => { window.__CFG = c; }, cfg);
  await page.goto('file://' + path.join(ROOT, 'engine/index.html'));
  const info = await page.evaluate(() => window.boot());
  return { page, info };
}

async function renderSegment(browser, cfg, f0, f1, fps, file) {
  const { page } = await openPage(browser, cfg);
  const w = Math.round(1920 * cfg.scale), h = Math.round(1080 * cfg.scale);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-r', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    const b64 = await page.evaluate(t => { window.seek(t); return window.grab(); }, f / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  await page.close();
}

(async () => {
  const o = args(), cfg = loadConfig(o);
  const browser = await chromium.launch();
  const t0 = Date.now();
  if (o.frames) {
    const dir = o.out || path.join(ROOT, 'render/frames'); fs.mkdirSync(dir, { recursive: true });
    const { page } = await openPage(browser, cfg);
    for (const t of o.frames) {
      const data = await page.evaluate(t => { window.seek(t); return E.canvas.toDataURL('image/png'); }, t);
      const f = path.join(dir, `frame_${t.toFixed(2).padStart(7, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); console.log(f);
    }
    await browser.close(); return;
  }
  const { page, info } = await openPage(browser, cfg); await page.close();
  const fps = info.fps;
  const [a, b] = o.range || [0, info.total];
  const F0 = Math.round(a * fps), F1 = Math.round(Math.min(b, info.total) * fps);
  const out = path.resolve(o.out || path.join(ROOT, `render/video_${o.lang}${cfg.placeholders ? '_placeholders' : ''}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'km-'));
  const n = Math.max(1, Math.min(o.workers, Math.ceil((F1 - F0) / 60)));
  const per = Math.ceil((F1 - F0) / n), segs = [];
  console.log(`Rendu ${F1 - F0} images (${a}s → ${b}s) à ${fps} i/s, ${n} processus…`);
  await Promise.all(Array.from({ length: n }, (_, k) => {
    const s0 = F0 + k * per, s1 = Math.min(F1, s0 + per), file = path.join(tmp, `seg${k}.mp4`); segs[k] = file;
    return renderSegment(browser, cfg, s0, s1, fps, file);
  }));
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map(s => `file '${s}'`).join('\n'));
  const vid = o.audio ? path.join(tmp, 'video.mp4') : out;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', '-movflags', '+faststart', vid]);
  if (o.audio) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-ss', String(a), '-i', path.resolve(o.audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`→ ${out}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
})().catch(e => { console.error(e); process.exit(1); });
