// example_scenes.js - REFERENCE for writing a video's scenes.js (café video, segments s1-s4).
// A scenes file exports: scenes {key: (f, t, dur) => draw}, optional sfx {key: [[localTime, type, gain]]}, optional swipes [keys].
// f = Frame (engine.js). t = seconds since this segment started, dur = segment length. Time everything to the words in the segment.
// Tools: f.pop(x,y,text,size,t0,{c,hl,rot,font:'marker'|'hand',out}) f.text(...) f.sticker(name,x,y,size,{rot,scale,sy})
//        f.stick(x,y,s,{mood:'happy'|'shock'|'sad'|'smug'|'neutral',la,ra,ll,rl,apron,hat}) f.walker(x,y,s,phase,{...})
//        f.line f.curve f.arrow f.circle f.rect f.poly (all rough pen; {c,w,fill,fs:'hachure'|'solid',prog})  k oc ob io lerp easing
// sfx types: pop whoosh ding tick thud scribble
const { INK, OR, GREY, k, oc, ob, io, lerp } = require('./engine');

function where(f, t) { // "So where's the money going?"
  f.pop(540, 420, "WHERE'S THE", 118, 0.02, { rot: -2 });
  f.pop(540, 560, 'MONEY GOING?', 132, 0.38, { hl: oc(k(t, 0.5, 0.8)), rot: -2 });
  const tin = ob(k(t, 0.0, 0.3)); const ty0 = lerp(1500, 1060, tin);
  f.rect(500, ty0, 380, 230, { w: 8, fill: '#FFE7CC', fs: 'solid' });
  f.rect(530, ty0 + 25, 320, 80, { w: 6, fill: '#2b2b2b', fs: 'solid' });
  f.text(690, ty0 + 66, '£ £ £', 52, { c: '#7CFC9A' });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) f.rect(540 + j * 78, ty0 + 125 + i * 30, 56, 18, { w: 3, fill: OR, fs: 'solid' });
  const dr = oc(k(t, 0.28, 0.4)) * 70;
  if (t > 0.28) f.rect(520, ty0 + 220 + dr, 340, 60, { w: 7, fill: '#FFD2A6', gap: 8 });
  [[300, 790], [520, 700], [780, 760], [900, 900], [640, 880]].forEach(([tx, ty], i) => {
    const t0 = 0.3 + i * 0.07; if (t < t0) return;
    const p = oc(k(t, t0, t0 + 0.6)); const drift = Math.max(0, t - t0 - 0.6) * 120;
    const x = lerp(690, tx, p), y = lerp(1300, ty, p) - 140 * Math.sin(Math.PI * p) - drift; const flap = Math.sin(t * 26 + i);
    for (const sd of [-1, 1]) f.curve([[x + sd * 70, y - 10], [x + sd * 110, y - 40 - 25 * flap], [x + sd * 150, y - 30 - 45 * flap]], { w: 5, r: .6 });
    f.sticker(i % 2 ? 'coin' : 'pound-banknote', x, y, i % 2 ? 110 : 150, { rot: Math.sin(t * 9 + i) * 16 });
  });
  const up = ob(k(t, 0.34, 0.55));
  f.stick(260, 1050, 1.05, { mood: t > 0.34 ? 'shock' : 'neutral', apron: true, la: [lerp(20, 150, up), lerp(10, 175, up)], ra: [lerp(-20, -150, up), lerp(-10, -175, up)] });
  if (t > 0.45) f.pop(150, 930, '!!', 90, 0.45, { c: OR, rot: -12 });
}

function cupScene(f, t) { // spans s2 ("Let's follow one coffee") and s3 ("Say a flat white costs three pound forty"); t from s2 start
  const cx = lerp(540, 330, io(k(t, 1.55, 1.95))); const cy = lerp(2300, 1070, ob(k(t, 0.0, 0.42), 1.3));
  f.sticker('hot-beverage', cx, cy, 440, { rot: Math.sin(t * 2.2) * 3 });
  f.pop(540, 420, 'FOLLOW ONE COFFEE', 104, 0.05, { rot: -2, out: 1.45 });
  if (t < 1.5) f.arrow([[540, 500], [575, 580], [550, 670], [540, 740]], { prog: oc(k(t, 0.35, 0.8)), c: OR, w: 9, head: 30 });
  f.pop(540, 420, 'ONE FLAT WHITE', 118, 1.6, { rot: -2, hl: oc(k(t, 1.8, 2.1)) });
  if (t > 1.9) {
    const a = 30 * Math.exp(-3.0 * (t - 1.9)) * Math.cos(8.5 * (t - 1.9)) * Math.PI / 180;
    const px = cx + 175, py = 900, L = 230; const tx = px + L * Math.sin(a) + 30, ty = py + L * Math.cos(a);
    f.line(px, py, tx + 20, ty - 70, { w: 4, r: 0.6 });
    f.add(`<g transform="translate(${tx} ${ty}) rotate(${-a * 180 / Math.PI * 1.2})">`);
    f.poly([[0, -70], [300, -70], [360, 0], [300, 70], [0, 70]], { w: 7, fill: '#FFE7CC', fs: 'solid' }); f.circle(310, 0, 26, { w: 5 });
    const val = 3.4 * oc(k(t, 2.75, 3.45)); f.text(140, 0, '£' + val.toFixed(2), 104, { c: OR, scale: t > 3.45 ? 1 + 0.25 * Math.exp(-12 * (t - 3.45)) : 1 });
    f.add('</g>');
  }
}

function vat(f, t) { // "First, V A T. One sixth of that was never yours. That's fifty-seven pence, straight to the taxman."
  if (t > 2.6) f.cam.x = 12 * Math.exp(-14 * (t - 2.6)) * Math.sin(70 * t); // impact shake
  f.circle(300, 420, 150, { c: OR, w: 9, prog: oc(k(t, 0.02, 0.35)) }); f.pop(300, 424, '1', 110, 0.1, { c: OR });
  f.pop(600, 420, 'VAT', 150, 0.55, { rot: -2 }); f.pop(610, 530, '(value added tax)', 48, 0.9, { font: 'hand', c: GREY });
  const c = [540, 760], r = 190;
  f.circle(c[0], c[1], r * 2, { w: 8, prog: oc(k(t, 1.1, 1.5)), start: -90 });
  if (t > 1.5) f.circle(c[0], c[1], r * 2, { w: 8, fill: '#F3DDBA', fs: 'solid' });
  f.pop(c[0], c[1], '£3.40', 96, 1.2, { out: 1.55 });
  for (let i = 0; i < 6; i++) { const a = (-90 + i * 60) * Math.PI / 180, p = oc(k(t, 1.6 + i * .11, 1.8 + i * .11)); if (p > 0) f.line(c[0], c[1], c[0] + r * Math.cos(a) * p, c[1] + r * Math.sin(a) * p, { w: 6 }); }
  const tx = t < 5.55 ? lerp(1300, 800, io(k(t, 4.0, 5.15))) : lerp(800, 1400, io(k(t, 5.6, 6.8)));
  const walking = (t > 4.0 && t < 5.15) || t > 5.6, grab = ob(k(t, 5.15, 5.35)); let hands = null;
  if (t > 4.0) hands = f.walker(tx, 1250, 0.66, walking ? t * 9 : 0, { hat: true, mood: 'smug', ra: t > 5.15 ? [lerp(-20, -95, grab), lerp(-10, -100, grab)] : undefined });
  const wedge = (x, y, rr) => { const pts = [[x, y]]; for (let a = 30; a <= 90; a += 6) pts.push([x + rr * Math.cos(a * Math.PI / 180), y + rr * Math.sin(a * Math.PI / 180)]); f.poly(pts, { w: 7, fill: OR, gap: 8 }); };
  if (t > 2.55) {
    const off = 70 * ob(k(t, 2.6, 2.9));
    if (t < 5.3) { const m = Math.PI / 3; wedge(c[0] + off * Math.cos(m), c[1] + off * Math.sin(m), r); }
    else { const [hx, hy] = hands ? hands[1] : [tx, 1350]; const p = oc(k(t, 5.3, 5.55));
      const sx = lerp(c[0] + 35, hx - 130, p), sy = lerp(c[1] + 60, hy - 100, p) - 200 * Math.sin(Math.PI * p);
      wedge(sx, sy, r * 0.7); f.text(sx + 48, sy + 88, '57p', 46, { font: 'hand' }); }
  }
  const s = '£3.40 ÷ 6 ='; const n = Math.floor(s.length * k(t, 2.9, 3.5)); if (n) f.text(150, 1030, s.slice(0, n), 96, { anchor: 'start', rot: -1 });
  if (t > 3.75) { const v = Math.round(57 * oc(k(t, 3.75, 4.45))); f.text(830, 1030, v + 'p', 130, { c: OR, rot: -3, scale: t > 4.45 ? 1 + 0.3 * Math.exp(-10 * (t - 4.45)) : 1 }); f.circle(830, 1030, 270, { c: OR, w: 9, sy: 0.62, prog: oc(k(t, 4.5, 4.95)) }); }
  if (t > 5.4) f.pop(Math.min(tx, 900) - 250, 1150, 'ta very much!', 54, 5.4, { font: 'hand', c: OR, rot: -6, out: 6.2 });
}

module.exports = {
  scenes: { s1: where, s2: (f, t, d) => cupScene(f, t), s3: (f, t, d) => cupScene(f, t + 1.58), s4: vat },
  swipes: ['s1', 's4'],            // orange swipe transition INTO these segments (s0 always gets one)
  sfx: {
    s1: [[0.28, 'thud', .6], [0.3, 'whoosh', .45], [0.45, 'ding', .2], [0.6, 'ding', .18], [0.5, 'scribble', .6]],
    s2: [[0.35, 'scribble', .6]],
    s3: [[0.05, 'pop', .45], [0.25, 'scribble', .5], [0.32, 'whoosh', .3], [1.9, 'ding', .5], ...[1.2, 1.27, 1.34, 1.41, 1.48, 1.55, 1.62, 1.69, 1.76, 1.83].map(x => [x, 'tick', .45])],
    s4: [[0.02, 'scribble', .6], [0.55, 'pop', .45], [1.1, 'scribble', .6], [2.6, 'thud', .65], [2.9, 'scribble', .55], [4.45, 'ding', .5], [4.5, 'scribble', .45], [5.3, 'whoosh', .45], [5.4, 'pop', .35],
         ...[0, 1, 2, 3, 4, 5].map(i => [1.6 + i * .11, 'tick', .55]), ...Array.from({ length: 12 }, (_, i) => [3.75 + i * 0.06, 'tick', .4])],
  },
};
