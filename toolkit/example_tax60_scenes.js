// example_tax60_scenes.js - REFERENCE for Tax in 60 videos (render with SB_THEME=tax60).
// Same API as example_scenes.js, but: dark slate theme (INK = white, OR = green accent, RED for warnings),
// `clock: true` draws the 60->0 stopwatch bottom-left on every frame (keep content out of x<320 when y>1300),
// first segment key is "hook" (no form screenshot: render with FORM_PNG '-').
// Recurring cast: DAVE (everyman stickman, makes the mistake) and THE TAXMAN (top hat, smug, pounces).
// Topic here: Self Assessment late filing penalties (2025/26 returns, due 31 Jan 2027).
const { INK, OR, GREY, RED, PAPERC, k, oc, ob, io, lerp } = require('./engine');
const DARK = '#15181D';

// helpers ---------------------------------------------------------------
const dave = (f, x, y, s, o = {}) => { const h = f.stick(x, y, s, { mood: 'happy', ...o }); f.text(x, y - 95 * s, 'DAVE', 40 * Math.max(.8, s), { font: 'hand', c: GREY }); return h; };
const taxman = (f, x, y, s, o = {}) => f.stick(x, y, s, { mood: 'smug', hat: true, ...o });
const pill = (f, x, y, txt, size, col, t0) => { if (f.t < t0) return; const sc = ob(k(f.t, t0, t0 + 0.3)); const w = f.width(txt, size) + 70;
  f.add(`<g transform="translate(${x} ${y}) scale(${sc}) rotate(-2) translate(${-x} ${-y})">`); f.rect(x - w / 2, y - size * 0.75, w, size * 1.5, { w: 5, c: col, fill: col, fs: 'solid', r: 0.8 }); f.text(x, y, txt, size, { c: DARK }); f.add('</g>'); };
const calendar = (f, x, y, s, day, mon) => { f.rect(x - 150 * s, y - 160 * s, 300 * s, 320 * s, { w: 6, fill: '#F3F5F8', fs: 'solid' }); f.rect(x - 150 * s, y - 160 * s, 300 * s, 85 * s, { w: 6, fill: RED, fs: 'solid' });
  f.text(x, y - 118 * s, mon, 56 * s, { c: '#fff' }); f.text(x, y + 45 * s, day, 150 * s, { c: DARK }); };
const counter = (f, x, y, val, t0, t1, size, o = {}) => { if (f.t < t0) return; const v = Math.round(val * oc(k(f.t, t0, t1))); f.text(x, y, (o.pre ?? '£') + v.toLocaleString('en-GB') + (o.post ?? ''), size, { c: o.c ?? OR, rot: -3, scale: f.t > t1 ? 1 + 0.25 * Math.exp(-10 * (f.t - t1)) : 1 }); };
const bars = (f, t, upto) => { // running fine stack, bottom right
  const V = [[100, 'DAY 1'], [900, '3 MTHS'], [300, '6 MTHS'], [300, '12 MTHS']]; const x0 = 380, base = 1460, bw = 120, gap = 30;
  V.forEach(([v, lab], i) => { if (i > upto) return; const h = 360 * v / 900 * (i === upto ? oc(k(t, 0.1, 0.6)) : 1);
    f.rect(x0 + i * (bw + gap), base - h, bw, Math.max(4, h), { w: 5, fill: i === upto ? OR : '#3A6B52', gap: 8 }); f.text(x0 + i * (bw + gap) + bw / 2, base + 34, lab, 30, { font: 'hand', c: GREY }); }); };

// scenes ------------------------------------------------------------------
module.exports = {
  clock: true,
  swipes: ['s2', 's7', 's8', 's9', 's11'],
  scenes: {
    hook(f, t) { // "Miss one date... and HMRC can fine you sixteen hundred pound. Even if you owe nothing."
      f.pop(540, 470, 'MISS ONE DATE...', 104, 0.05, { rot: -2 });
      counter(f, 540, 760, 1600, 1.4, 2.6, 230);
      f.circle(540, 760, 700, { c: OR, w: 9, sy: 0.42, prog: oc(k(t, 2.6, 3.0)) });
      f.pop(540, 960, 'IN FINES', 90, 1.6);
      pill(f, 600, 1150, 'EVEN IF YOU OWE £0', 64, RED, 3.3);
      if (t > 0.6) f.sticker('alarm-clock', 830, 1340, 190, { rot: Math.sin(t * 40) * 6 * (t > 3.3 ? 1 : 0.2) });
    },
    s0(f, t, dur) { // "This is Dave. Dave's self-employed. And Dave thinks his tax return can wait."
      const x = lerp(-150, 430, io(k(t, 0, 0.9)));
      dave(f, x, 900, 1.0, t < 0.9 ? { la: [25 * Math.sin(t * 9), 15], ra: [-25 * Math.sin(t * 9), -15] } : { ra: [-40, -150], la: [20, 10] });
      f.pop(540, 470, 'THIS IS DAVE', 120, 0.1, { rot: -2, hl: oc(k(t, 0.4, 0.7)) });
      f.pop(720, 760, 'self-employed', 52, 1.1, { font: 'hand', c: OR, rot: -4 });
      if (t > 1.2) f.sticker('briefcase', 760, 900, 150, { scale: ob(k(t, 1.2, 1.5)), rot: 6 });
      if (t > 2.3) { const p = oc(k(t, 2.3, 2.7)); f.circle(740, 1180, 400 * p, { w: 6, sy: 0.6, fill: DARK, fs: 'solid' }); f.circle(560, 1070, 30 * p, { w: 5 });
        f.pop(740, 1150, 'tax return?', 50, 2.6, { font: 'hand' }); f.pop(740, 1215, 'LATER.', 54, 2.75, { font: 'hand', c: OR }); f.pop(900, 1020, 'z z z', 40, 3.0, { font: 'hand', c: GREY }); }
    },
    s1(f, t) { // "Big mistake. The deadline for your online Self Assessment is the thirty-first of January."
      if (t < 0.25) f.cam.x = 14 * Math.sin(t * 90);
      f.pop(540, 470, 'BIG MISTAKE', 130, 0.02, { rot: -3, c: RED });
      const s = ob(k(t, 0.7, 1.1)); if (s > 0) { f.add(`<g transform="translate(540 960) scale(${s}) translate(-540 -960)">`); calendar(f, 540, 930, 1.25, '31', 'JAN'); f.add('</g>'); }
      f.pop(540, 1250, 'ONLINE DEADLINE', 72, 1.5, { hl: oc(k(t, 1.8, 2.1)) });
      f.pop(560, 1340, 'Self Assessment · 2025/26 return', 44, 1.8, { font: 'hand', c: GREY });
    },
    s2(f, t) { // "One day late? That's a hundred pound fine. Straight away."
      f.pop(540, 470, '1 DAY LATE', 120, 0.02, { rot: -2 });
      counter(f, 540, 680, 100, 0.8, 1.3, 170);
      taxman(f, lerp(1250, 820, io(k(t, 0.2, 1.0))), 860, 0.8, { ra: [-80, -110] });
      dave(f, 330, 900, 0.8, { mood: 'shock', la: [150, 175], ra: [-150, -175] });
      bars(f, t, 0);
    },
    s3(f, t) { // "Three months late, it's ten pound a day, for up to ninety days. That's another nine hundred."
      f.pop(540, 470, '3 MONTHS LATE', 112, 0.02, { rot: -2 });
      f.pop(540, 640, '£10 A DAY × 90', 84, 0.9, { c: OR });
      counter(f, 500, 800, 900, 3.0, 3.8, 120, { pre: '= £' });
      taxman(f, 850, 940, 0.75, { mood: 'smug', ra: [-150, -170] }); dave(f, 330, 900, 0.8, { mood: 'sad' });
      bars(f, t, 1);
    },
    s4(f, t) { // "Six months late? Another three hundred pound, or five percent of the tax you owe, whichever's bigger."
      f.pop(540, 470, '6 MONTHS LATE', 112, 0.02, { rot: -2 });
      counter(f, 540, 650, 300, 0.9, 1.4, 130, { pre: '+ £' });
      f.pop(540, 790, 'or 5% of tax owed, if bigger', 50, 2.2, { font: 'hand', c: GREY });
      taxman(f, 820, 860, 0.8); dave(f, 330, 900, 0.8, { mood: 'sad' });
      bars(f, t, 2);
    },
    s5(f, t) { // "Twelve months late? Same again."
      f.pop(540, 470, '12 MONTHS LATE', 112, 0.02, { rot: -2 });
      f.pop(540, 650, '+ £300 AGAIN', 110, 0.8, { c: OR });
      taxman(f, 820, 860, 0.8, { ra: [-150, -170], la: [150, 170] }); dave(f, 330, 900, 0.8, { mood: 'shock' });
      bars(f, t, 3);
    },
    s6(f, t) { // "Add it up. Sixteen hundred pound. For a form."
      f.pop(540, 470, 'ADD IT UP', 120, 0.02, { rot: -2 });
      counter(f, 540, 760, 1600, 0.5, 1.4, 230);
      f.circle(540, 760, 720, { c: OR, w: 9, sy: 0.42, prog: oc(k(t, 1.4, 1.8)) });
      f.pop(540, 1000, 'FOR A FORM.', 110, 1.9, { hl: oc(k(t, 2.1, 2.4)) });
      if (t > 1.0) f.sticker('memo', 760, 1250, 170, { rot: -10, scale: ob(k(t, 1.9, 2.2)) });
      dave(f, 420, 1150, 0.6, { mood: 'shock', la: [150, 175], ra: [-150, -175] });
    },
    s7(f, t) { // "So what should Dave do?"
      dave(f, 540, 820, 1.1, { mood: 'neutral', ra: [-150, -40] });
      f.pop(540, 470, 'SO WHAT SHOULD', 104, 0.02, { rot: -2 }); f.pop(540, 590, 'DAVE DO?', 120, 0.3, { rot: -2, hl: oc(k(t, 0.5, 0.8)) });
      ['?', '?', '?'].forEach((q, i) => f.pop(700 + i * 60, 760 - i * 50, q, 80 + i * 10, 0.5 + i * 0.15, { c: OR, rot: 10 }));
    },
    s8(f, t) { // "One. File early. Filing in November doesn't mean paying in November. You still pay by the end of January."
      f.circle(215, 470, 140, { c: OR, w: 9, prog: oc(k(t, 0, 0.3)) }); f.pop(215, 474, '1', 100, 0.1, { c: OR });
      f.pop(320, 470, 'FILE EARLY', 116, 0.3, { rot: -2, anchor: 'start', maxw: 640 });
      const s = ob(k(t, 1.2, 1.5)); if (s > 0) { f.add(`<g transform="translate(360 900) scale(${s}) translate(-360 -900)">`); calendar(f, 360, 900, 0.8, '14', 'NOV'); f.add('</g>'); }
      f.pop(360, 1100, 'FILE', 64, 1.5, { c: OR });
      if (t > 2.6) f.arrow([[500, 900], [580, 860], [660, 880], [700, 900]], { prog: oc(k(t, 2.6, 3.0)), c: OR, w: 8 });
      const s2 = ob(k(t, 3.0, 3.3)); if (s2 > 0) { f.add(`<g transform="translate(830 900) scale(${s2}) translate(-830 -900)">`); calendar(f, 830, 900, 0.8, '31', 'JAN'); f.add('</g>'); }
      f.pop(830, 1100, 'PAY', 64, 3.3, { c: OR });
      dave(f, 600, 1180, 0.55, { mood: 'happy', ra: [-150, -170] });
    },
    s9(f, t) { // "Two. Can't pay it all? File on time anyway, and ask HMRC about a payment plan. Late filing and late paying are fined separately."
      f.circle(215, 470, 140, { c: OR, w: 9, prog: oc(k(t, 0, 0.3)) }); f.pop(215, 474, '2', 100, 0.1, { c: OR });
      f.pop(320, 450, "CAN'T PAY?", 106, 0.3, { rot: -2, anchor: 'start', maxw: 640 }); f.pop(540, 590, 'FILE ANYWAY', 112, 1.0, { rot: -2, hl: oc(k(t, 1.2, 1.5)) });
      f.pop(560, 720, 'ask HMRC about a payment plan', 50, 2.0, { font: 'hand', c: GREY });
      if (t > 3.6) { f.rect(330, 830, 300, 200, { w: 6, c: RED, fill: RED, gap: 14, prog: 1 }); f.rect(680, 830, 300, 200, { w: 6, c: RED, fill: RED, gap: 14 });
        f.text(480, 930, 'LATE FILING', 46, { scale: ob(k(t, 3.6, 3.9)) }); f.text(830, 930, 'LATE PAYING', 46, { scale: ob(k(t, 3.8, 4.1)) });
        f.pop(655, 1090, 'two separate fines', 50, 4.3, { font: 'hand', c: OR }); }
      if (t > 1.6) f.sticker('memo', 800, 1290, 150, { rot: 8, scale: ob(k(t, 1.6, 1.9)) });
      dave(f, 560, 1180, 0.55, { mood: 'happy' });
    },
    s10(f, t) { // "Don't be Dave."
      f.pop(540, 600, "DON'T BE", 150, 0.02, { rot: -3 }); f.pop(540, 780, 'DAVE.', 210, 0.3, { rot: -3, c: OR });
      dave(f, 540, 1000, 0.75, { mood: 'sad', la: [10, 5], ra: [-10, -5] });
    },
    s11(f, t) { // "That's tax in sixty. Follow for more."
      f.pop(540, 560, "THAT'S", 110, 0.02, { rot: -2, c: GREY }); f.pop(540, 720, 'TAX IN 60', 170, 0.2, { rot: -3, c: OR });
      f.pop(540, 880, 'FOLLOW FOR MORE', 84, 1.0, { hl: oc(k(t, 1.2, 1.5)) });
      f.sticker('alarm-clock', 760, 1150, 170, { scale: ob(k(t, 0.4, 0.7)), rot: 8 });
      f.pop(650, 1360, 'General info, not tax advice.', 36, 0.6, { font: 'hand', c: GREY, maxw: 580 });
      f.pop(650, 1410, 'Check your situation with an accountant.', 36, 0.7, { font: 'hand', c: GREY, maxw: 580 });
    },
  },
  sfx: {
    hook: [[1.4, 'scribble', .5], ...Array.from({ length: 12 }, (_, i) => [1.4 + i * 0.1, 'tick', .4]), [2.6, 'ding', .5], [3.3, 'thud', .6]],
    s0: [[1.2, 'pop', .4], [2.3, 'scribble', .4]],
    s1: [[0.02, 'thud', .7], [0.7, 'pop', .5], [1.5, 'scribble', .5]],
    s2: [[0.2, 'whoosh', .4], [1.3, 'ding', .5]], s3: [[0.9, 'scribble', .5], [3.8, 'ding', .5]], s4: [[1.4, 'ding', .5]], s5: [[0.8, 'thud', .6]],
    s6: [...Array.from({ length: 9 }, (_, i) => [0.5 + i * 0.1, 'tick', .4]), [1.4, 'ding', .6], [1.9, 'thud', .5]],
    s7: [[0.5, 'pop', .3], [0.65, 'pop', .3], [0.8, 'pop', .3]], s8: [[1.2, 'pop', .4], [2.6, 'scribble', .5], [3.0, 'pop', .4]],
    s9: [[1.0, 'scribble', .5], [3.6, 'thud', .5]], s10: [[0.3, 'thud', .6]], s11: [[0.2, 'ding', .5]],
  },
};
