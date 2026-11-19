#!/usr/bin/env node
// Rendu image par image (Playwright) → ffmpeg (H.264, CRF 16, yuv420p, +faststart).
//
//   node tools/render.js                          film complet → render/video_<lang>.mp4
//   node tools/render.js --range 0 27             rendu partiel (secondes)
//   node tools/render.js --frames 3.5,12,20       PNG d'images isolées
//   options : --lang en|fr  --placeholders on|off  --config <texts.json>
//             --out <fichier>  --scale 0.5  --fps 60  --workers 3  --style B_nuit
//             --audio <wav>  (muxé en AAC ; le son des médias réels y est mixé, puis -16 LUFS)
//             --media <media.json>  (par défaut config/media.json)
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
  const mediaPath = o.media ? path.resolve(o.media) : path.join(ROOT, 'config/media.json');
  const mediaCfg = fs.existsSync(mediaPath) ? readJSON(mediaPath) : {};
  return { texts, strings: stringsAll[o.lang], theme, timing, style: o.style, placeholders: o.placeholders === 'on', scale: o.scale, mediaCfg, mediaDir: path.dirname(mediaPath) };
}

// Prépare les médias réels : extraction des images des vidéos à la cadence du film
function prepareMedia(cfg, schedule, tmp) {
  const media = {}, audio = [];
  for (const [slot, m] of Object.entries(cfg.mediaCfg)) {
    if (slot.startsWith('_') || !m || !m.file) continue;
    const file = path.resolve(cfg.mediaDir, m.file);
    if (!fs.existsSync(file)) { console.warn(`Média introuvable pour ${slot} : ${file} (cadre vide utilisé)`); continue; }
    const sch = schedule.find(s => s.slot === slot) || { start: 0, dur: 10 };
    if (/\.(png|jpe?g|webp|gif)$/i.test(file)) { media[slot] = { kind: 'image', url: 'file://' + file, fit: m.fit || 'cover' }; continue; }
    const dir = path.join(tmp, 'media_' + slot); fs.mkdirSync(dir, { recursive: true });
    const fps = cfg.timing.fps;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(m.start || 0), '-i', file, '-t', String(sch.dur + 0.5), '-vf', `fps=${fps},scale=1600:-2`, '-q:v', '2', path.join(dir, '%05d.jpg')]);
    const count = fs.readdirSync(dir).length;
    media[slot] = { kind: 'video', pattern: 'file://' + path.join(dir, '%05d.jpg'), count, fps, fit: m.fit || 'cover' };
    if (m.audio) audio.push({ file, from: m.start || 0, at: sch.start, dur: sch.dur, gain: m.gain_db || 0 });
    console.log(`Média ${slot} : ${count} images extraites`);
  }
  return { media, audio };
}

async function openPage(browser, cfg) {
  const page = await browser.newPage({ viewport: { width: Math.round(1920 * cfg.scale), height: Math.round(1080 * cfg.scale) } });
  page.on('pageerror', e => { console.error('Erreur page :', e.message); process.exit(1); });
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
    const b64 = await page.evaluate(async t => { window.seek(t); if (window.mediaPending()) { await window.mediaLoad(); window.seek(t); } return window.grab(); }, f / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  await page.close();
}

(async () => {
  const o = args(), cfg = loadConfig(o);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] }); // images locales lisibles sans « canvas souillé »
  const t0 = Date.now();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'km-'));
  { const { page } = await openPage(browser, cfg); const sched = await page.evaluate(() => window.slotSchedule()); await page.close();
    const pm = prepareMedia(cfg, sched, tmp); cfg.media = pm.media; cfg.slotAudio = pm.audio; }
  if (o.frames) {
    const dir = o.out || path.join(ROOT, 'render/frames'); fs.mkdirSync(dir, { recursive: true });
    const { page } = await openPage(browser, cfg);
    for (const t of o.frames) {
      const data = await page.evaluate(async t => { window.seek(t); if (window.mediaPending()) { await window.mediaLoad(); window.seek(t); } return E.canvas.toDataURL('image/png'); }, t);
      const f = path.join(dir, `frame_${t.toFixed(2).padStart(7, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); console.log(f);
    }
    await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); return;
  }
  const { page, info } = await openPage(browser, cfg); await page.close();
  const fps = info.fps;
  const [a, b] = o.range || [0, info.total];
  const F0 = Math.round(a * fps), F1 = Math.round(Math.min(b, info.total) * fps);
  const out = path.resolve(o.out || path.join(ROOT, `render/video_${o.lang}${cfg.placeholders ? '_placeholders' : ''}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
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
  if (o.audio) {
    // bande son + son des médias réels (décalés à leur place), puis normalisation -16 LUFS
    const args = ['-y', '-loglevel', 'error', '-i', vid, '-ss', String(a), '-i', path.resolve(o.audio)];
    const sa = (cfg.slotAudio || []).filter(c => c.at + c.dur > a && c.at < b);
    sa.forEach(c => args.push('-ss', String(c.from), '-t', String(c.dur), '-i', c.file));
    let filter = null;
    if (sa.length) {
      const parts = sa.map((c, i) => `[${i + 2}:a]aresample=48000,volume=${c.gain}dB,afade=t=in:d=0.15,afade=t=out:st=${Math.max(0, c.dur - 0.3)}:d=0.3,adelay=${Math.round(Math.max(0, c.at - a) * 1000)}:all=1[s${i}]`);
      filter = parts.join(';') + `;[1:a]${sa.map((_, i) => `[s${i}]`).join('')}amix=inputs=${sa.length + 1}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
      args.push('-filter_complex', filter, '-map', '0:v', '-map', '[aout]');
    } else args.push('-map', '0:v', '-map', '1:a');
    args.push('-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out);
    execFileSync('ffmpeg', args);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`→ ${out}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
})().catch(e => { console.error(e); process.exit(1); });
