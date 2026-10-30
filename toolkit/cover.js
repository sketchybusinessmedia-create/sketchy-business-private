// cover.js - cover in the animated style.  node cover.js "TOP|LINES" "HIT|LINES" STICKER_NAME out.png [mood]
// TOP = black marker lines, HIT = orange-highlighted punchline, STICKER = fluent-emoji-flat name (e.g. hot-beverage, pound-banknote, house).
const fs = require('fs'); const E = require('./engine'); const { Frame, renderPNG } = E;
const [top, hit, stk, out, mood] = process.argv.slice(2);
const f = new Frame(0.37); const T = top.split('|'), Hh = hit.split('|');
let y = 520 - (T.length - 1) * 70;
for (const s of T) { f.text(540, y, s, 190, { rot: -3, maxw: 960 }); y += 165; }
y += 40;
for (const s of Hh) { f.text(540, y, s, 210, { rot: -3, hl: 1, maxw: 960 }); y += 190; }
const gy = Math.min(y + 150, 1330);
f.sticker(stk || 'pound-banknote', 720, gy, 300, { rot: 8 });
f.stick(330, gy - 130, 0.82, { mood: mood || 'shock', la: [150, 175], ra: [-150, -175] });
f.text(540, 1780, 'SKETCHY BUSINESS', 60, { font: 'marker' });
f.body = f.parts.join('');
fs.writeFileSync(out, renderPNG(f.svg())); console.log('COVER_OK', out);
