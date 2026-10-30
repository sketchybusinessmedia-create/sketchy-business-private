// render.js - renders a whole video's frames from a scenes module + voice timings.
// node render.js SCENES_JS TIMINGS_JSON FORM_PNG OUT_DIR            -> OUT_DIR/frames.mp4 + OUT_DIR/sfx.json
// node render.js SCENES_JS TIMINGS_JSON FORM_PNG OUT_DIR --stills t1 t2 ...   -> OUT_DIR/still_<t>.png (check before full render)
const fs = require('fs'), path = require('path'); const { spawn } = require('child_process');
const E = require('./engine'); const { Frame, renderPNG, FPS, INK, OR, k, oc, ob, io, lerp } = E;
const [scenesFile, timFile, formPng, outDir, flag, ...stillTimes] = process.argv.slice(2);
const S = require(path.resolve(scenesFile)); const tim = JSON.parse(fs.readFileSync(timFile));
fs.mkdirSync(outDir, { recursive: true });
const TOTAL = tim[tim.length - 1][2];
const FORM = 'data:image/png;base64,' + fs.readFileSync(formPng).toString('base64');
const { execSync } = require('child_process');
const [fw, fh] = execSync(`python3 -c "from PIL import Image;im=Image.open('${formPng}');print(im.size[0],im.size[1])"`).toString().trim().split(' ').map(Number);
const swipeInto = new Set(['s0', ...(S.swipes || [])]);
const cuts = tim.filter(([key]) => swipeInto.has(key)).map(([, a]) => a);

function drawForm(f, t, dur) {
  // the Tally form, taped into the sketchbook, popping in then slowly pushing in
  const sc = ob(k(t, 0, 0.35), 1.2); const maxH = 1240, w = Math.min(900, maxH * fw / fh), h = w * fh / fw;
  const x = 540 - w / 2, y = 930 - h / 2, rot = -1.5;
  f.add(`<g transform="translate(540 930) scale(${sc}) rotate(${rot}) translate(-540 -930)"><rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="#fff" filter="url(#stk)"/><image href="${FORM}" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
  for (const [tx, ty, r] of [[x + 40, y - 8, -22], [x + w - 40, y - 8, 20]]) f.add(`<rect x="${tx - 70}" y="${ty - 22}" width="140" height="44" fill="#F4E2B8" opacity="0.85" transform="rotate(${r} ${tx} ${ty})"/>`);
  f.add('</g>');
}

function frameAt(t) {
  let i = tim.findIndex(([, a, b]) => t >= a && t < b); if (i < 0) i = tim.length - 1;
  const [key, a, b] = tim[i]; const lt = t - a, dur = b - a;
  const f = new Frame(t); f.t = lt; f.dur = dur; f.cam = { z: 1 + 0.025 * lt / Math.max(1, dur) * 2, x: 0, y: 0 };
  if (key === 'form') drawForm(f, lt, dur);
  else if (S.scenes[key]) S.scenes[key](f, lt, dur);
  else f.text(540, 900, `missing scene ${key}`, 60, { c: OR });
  f.body = f.parts.join(''); f.parts = []; f.t = t; for (const c of cuts) f.swipe(c); f.overlay = f.parts.join('');
  return renderPNG(f.svg(f.cam));
}

// sound effects: auto whoosh on swipes, pop at each scene start, plus each scene's own list
const ev = [];
for (const c of cuts) ev.push([c - 0.17, 'whoosh', 0.55]);
for (const [key, a] of tim) { if (key !== 'form') ev.push([a + 0.03, 'pop', 0.3]); for (const [lt, type, g] of (S.sfx?.[key] || [])) ev.push([a + lt, type, g]); }
ev.push([0, 'thud', 0.5]);
fs.writeFileSync(path.join(outDir, 'sfx.json'), JSON.stringify({ total: TOTAL, events: ev }));

if (flag === '--stills') {
  for (const s of stillTimes) fs.writeFileSync(path.join(outDir, `still_${(+s).toFixed(2).padStart(6, '0')}.png`), frameAt(+s));
} else {
  const n = Math.round(TOTAL * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', path.join(outDir, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  (async () => {
    for (let i = 0; i < n; i++) {
      if (!ff.stdin.write(frameAt(i / FPS))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}`);
    }
    ff.stdin.end(); ff.on('close', c => console.log(c === 0 ? 'FRAMES_OK' : 'FRAMES_FAILED'));
  })();
}
