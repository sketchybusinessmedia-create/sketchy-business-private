// engine.js - Sketchy Business animation engine v2 (SVG per frame -> resvg -> ffmpeg)
// Rough.js pen strokes that "boil", marker/handwritten fonts, Fluent illustration stickers, easing helpers.
const fs = require('fs');
const rough = require('roughjs');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');
const ICONS = require('@iconify-json/fluent-emoji-flat/icons.json');

const W = 1080, H = 1920, FPS = 30;
const INK = '#161616', OR = '#FF7A00', HL = '#FFB15C', PAPERC = '#FAF7F0', GREY = '#6b6b6b';
const FONT = { marker: 'Permanent Marker', hand: 'Kalam' };
const ld = p => { const b = fs.readFileSync(__dirname + p); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const OT = { marker: ld('/fonts/PermanentMarker.ttf'), hand: ld('/fonts/Kalam-Bold.ttf') };
const PAPER = 'data:image/png;base64,' + fs.readFileSync(__dirname + '/paper.png').toString('base64');
const gen = rough.generator();

// easing
const cl = t => t < 0 ? 0 : t > 1 ? 1 : t;
const k = (t, a, b) => cl((t - a) / (b - a));
const oc = t => 1 - Math.pow(1 - cl(t), 3);
const ob = (t, s = 1.9) => { t = cl(t); return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const io = t => { t = cl(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

class Frame {
  constructor(t) { this.t = t; this.boil = Math.floor(t * FPS / 3); this.parts = []; this.n = 0; }
  seed(extra = 0) { this.n++; return 1 + ((this.boil * 7919 + this.n * 104729 + extra) % 2147483); }
  add(s) { this.parts.push(s); }
  paths(drawable) {
    for (const p of gen.toPaths(drawable)) {
      this.add(`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  }
  // ---- pen strokes ----
  line(x1, y1, x2, y2, o = {}) {
    const p = o.prog === undefined ? 1 : o.prog; if (p <= 0) return;
    this.paths(gen.line(x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), { seed: this.seed(), roughness: o.r ?? 1.1, strokeWidth: o.w ?? 7, stroke: o.c ?? INK, bowing: o.bow ?? 1 }));
  }
  curve(pts, o = {}) {
    const p = o.prog === undefined ? 1 : o.prog; if (p <= 0) return;
    const n = Math.max(2, Math.ceil(pts.length * p)); const sub = pts.slice(0, n);
    if (sub.length < 2) return;
    this.paths(gen.curve(sub, { seed: this.seed(), roughness: o.r ?? 1.0, strokeWidth: o.w ?? 7, stroke: o.c ?? INK }));
  }
  circle(x, y, d, o = {}) {
    const p = o.prog === undefined ? 1 : o.prog; if (p <= 0) return;
    const opts = { seed: this.seed(), roughness: o.r ?? 1.2, strokeWidth: o.w ?? 7, stroke: o.c ?? INK, fill: o.fill, fillStyle: o.fs ?? 'hachure', hachureGap: o.gap ?? 10, fillWeight: o.fw ?? 3, hachureAngle: o.ha ?? -41 };
    if (p >= 1) this.paths(gen.ellipse(x, y, d * (o.sx ?? 1), d * (o.sy ?? 1), opts));
    else { const a0 = (o.start ?? -90) * Math.PI / 180; this.paths(gen.arc(x, y, d * (o.sx ?? 1), d * (o.sy ?? 1), a0, a0 + Math.PI * 2 * p, false, { ...opts, fill: undefined })); }
  }
  rect(x, y, w, h, o = {}) {
    this.paths(gen.rectangle(x, y, w, h, { seed: this.seed(), roughness: o.r ?? 1.1, strokeWidth: o.w ?? 7, stroke: o.c ?? INK, fill: o.fill, fillStyle: o.fs ?? 'hachure', hachureGap: o.gap ?? 10, fillWeight: o.fw ?? 3 }));
  }
  poly(pts, o = {}) {
    this.paths(gen.polygon(pts, { seed: this.seed(), roughness: o.r ?? 1.1, strokeWidth: o.w ?? 7, stroke: o.c ?? INK, fill: o.fill, fillStyle: o.fs ?? 'hachure', hachureGap: o.gap ?? 9, fillWeight: o.fw ?? 3, hachureAngle: o.ha ?? -41 }));
  }
  arrow(pts, o = {}) {
    const p = o.prog === undefined ? 1 : o.prog; if (p <= 0) return;
    this.curve(pts, { ...o, prog: p });
    if (p >= 0.98) {
      const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const L = o.head ?? 34;
      for (const s of [-1, 1]) this.line(b[0], b[1], b[0] - L * Math.cos(ang + s * 0.5), b[1] - L * Math.sin(ang + s * 0.5), o);
    }
  }
  // ---- type ----
  width(s, size, font = 'marker') { return OT[font].getAdvanceWidth(s, size); }
  text(x, y, s, size, o = {}) {
    const sc = o.scale ?? 1; if (sc <= 0.01) return;
    const font = o.font ?? 'marker'; let sz = size; const maxw = o.maxw ?? 920;
    while (this.width(s, sz, font) > maxw && sz > 30) sz -= 3;
    const anchor = o.anchor ?? 'middle'; const rot = o.rot ?? 0;
    const tw = this.width(s, sz, font);
    if (o.hl) { // highlighter swipe behind text
      const hp = o.hl; const x0 = anchor === 'middle' ? x - tw / 2 : x; const hx = x0 - 18, hw = (tw + 36) * hp;
      if (hp > 0) this.add(`<g transform="translate(${x} ${y}) scale(${sc}) rotate(${rot}) translate(${-x} ${-y})"><path d="M${hx} ${y - sz * 0.05} q ${hw / 2} ${-sz * 0.06} ${hw} ${sz * 0.02} l 6 ${sz * 0.42} q ${-hw / 2} ${sz * 0.07} ${-hw - 4} ${-sz * 0.02} z" fill="${o.hlc ?? HL}" opacity="0.75"/></g>`);
    }
    const fill = o.c ?? INK; const op = o.alpha ?? 1;
    this.add(`<g transform="translate(${x} ${y}) scale(${sc}) rotate(${rot}) translate(${-x} ${-y})" opacity="${op}"><text x="${x}" y="${y + sz * 0.36}" font-family="${FONT[font]}" font-size="${sz}" text-anchor="${anchor}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 10}" paint-order="stroke" stroke-linejoin="round"` : ''}>${esc(s)}</text></g>`);
    return tw;
  }
  pop(x, y, s, size, t0, o = {}) {
    if (this.t < t0) return;
    let sc = ob(k(this.t, t0, t0 + (o.dur ?? 0.32)));
    if (o.out !== undefined && this.t > o.out) sc *= 1 - io(k(this.t, o.out, o.out + 0.16));
    return this.text(x, y, s, size, { ...o, scale: sc });
  }
  // ---- illustration stickers ----
  sticker(name, x, y, size, o = {}) {
    const ic = ICONS.icons[name]; if (!ic) throw new Error('no icon ' + name);
    const sc = (o.scale ?? 1); if (sc <= 0.01) return;
    const s = size / 32; const rot = o.rot ?? 0; const sy = o.sy ?? 1;
    this.add(`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc * s} ${sc * s * sy}) translate(-16 -16)" filter="url(#stk)" opacity="${o.alpha ?? 1}">${ic.body}</g>`);
  }
  // ---- stickman (rough pen) ----
  stick(x, y, s = 1, o = {}) {
    const la = o.la ?? [20, 10], ra = o.ra ?? [-20, -10], ll = o.ll ?? [12, 0], rl = o.rl ?? [-12, 0], w = (o.w ?? 8) * Math.max(0.7, s);
    const v = (a, L) => [Math.sin(a * Math.PI / 180) * L, Math.cos(a * Math.PI / 180) * L];
    const neck = [x, y + 52 * s], hip = [x + (o.lean ?? 0) * s, y + 225 * s], sh = [x + (o.lean ?? 0) * 0.25 * s, y + 98 * s];
    this.circle(x, y, 104 * s, { w, fill: PAPERC, fs: 'solid' });
    // face
    const m = o.mood ?? 'happy';
    for (const ex of [-17, 17]) this.add(`<ellipse cx="${x + ex * s}" cy="${y - 4 * s}" rx="${5.5 * s}" ry="${7 * s}" fill="${INK}"/>`);
    if (m === 'happy') this.curve([[x - 22 * s, y + 18 * s], [x, y + 32 * s], [x + 22 * s, y + 18 * s]], { w: 5.5 * s, r: 0.6 });
    else if (m === 'shock') { this.circle(x, y + 27 * s, 22 * s, { w: 5 * s, fill: INK, fs: 'solid', sy: 1.3, r: 0.4 }); for (const ex of [-17, 17]) this.line(x + ex * s - 9 * s, y - 24 * s, x + ex * s + 9 * s, y - 28 * s, { w: 4 * s, r: .5 }); }
    else if (m === 'smug') { this.curve([[x - 18 * s, y + 22 * s], [x + 4 * s, y + 28 * s], [x + 24 * s, y + 14 * s]], { w: 5.5 * s, r: 0.6 }); }
    else this.line(x - 16 * s, y + 25 * s, x + 16 * s, y + 25 * s, { w: 5 * s, r: .4 });
    this.line(neck[0], neck[1], hip[0], hip[1], { w });
    const hands = [];
    for (const [a1, a2] of [la, ra]) { const e = [sh[0] + v(a1, 85 * s)[0], sh[1] + v(a1, 85 * s)[1]]; const h = [e[0] + v(a2, 80 * s)[0], e[1] + v(a2, 80 * s)[1]]; this.line(sh[0], sh[1], e[0], e[1], { w }); this.line(e[0], e[1], h[0], h[1], { w }); hands.push(h); }
    for (const [a1, a2] of [ll, rl]) { const kn = [hip[0] + v(a1, 98 * s)[0], hip[1] + v(a1, 98 * s)[1]]; const f = [kn[0] + v(a2, 98 * s)[0], kn[1] + v(a2, 98 * s)[1]]; this.line(hip[0], hip[1], kn[0], kn[1], { w }); this.line(kn[0], kn[1], f[0], f[1], { w }); }
    if (o.apron) this.poly([[x - 32 * s, y + 130 * s], [x + 32 * s, y + 130 * s], [x + 40 * s, y + 230 * s], [x - 40 * s, y + 230 * s]], { w: 5 * s, fill: OR, fs: 'hachure', gap: 7 });
    if (o.hat) this.sticker('top-hat', x + 4 * s, y - 92 * s, 170 * s, { rot: -6 });
    return hands;
  }
  walker(x, y, s, ph, o = {}) {
    const a = Math.sin(ph), b = Math.sin(ph + Math.PI);
    return this.stick(x, y - Math.abs(Math.cos(ph)) * 9 * s, s, { la: o.la ?? [25 * b, 15], ra: o.ra ?? [25 * a, -15], ll: [28 * a, -5 + Math.max(0, -30 * a)], rl: [28 * b, -5 + Math.max(0, -30 * b)], ...o, la: o.la ?? [25 * b, 15], ra: o.ra ?? [25 * a, -15] });
  }
  // ---- transitions ----
  swipe(tcut, dur = 0.34) {
    const t = this.t; if (t < tcut - dur / 2 || t > tcut + dur / 2) return;
    const p = io((t - (tcut - dur / 2)) / dur); const x = lerp(-1000, W + 1000, p);
    this.add(`<path d="M${x - 760} 0 L${x + 300} 0 L${x + 760} ${H} L${x - 300} ${H} Z" fill="${OR}"/>`);
    this.add(`<path d="M${x - 300} 0 L${x - 220} 0 L${x + 240} ${H} L${x + 160} ${H} Z" fill="${INK}" opacity="0.9"/>`);
  }
  svg(cam = { z: 1, x: 0, y: 0 }) {
    const z = cam.z ?? 1, cx = cam.x ?? 0, cy = cam.y ?? 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><filter id="stk" x="-25%" y="-25%" width="150%" height="150%">
<feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="d"/><feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="white"/>
<feGaussianBlur in="d" stdDeviation="0.9" result="b"/><feOffset in="b" dx="0.5" dy="0.9" result="o"/><feFlood flood-color="#000" flood-opacity="0.28"/><feComposite in2="o" operator="in" result="sh"/>
<feMerge><feMergeNode in="sh"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<image href="${PAPER}" x="0" y="0" width="${W}" height="${H}"/>
<g transform="translate(${540 + cx} ${960 + cy}) scale(${z}) translate(-540 -960)">${this.body ?? ''}</g>${this.overlay ?? ''}</svg>`;
  }
}

function renderPNG(svg) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { fontFiles: [__dirname + '/fonts/PermanentMarker.ttf', __dirname + '/fonts/Kalam-Bold.ttf', __dirname + '/fonts/CaveatBrush.ttf'], loadSystemFonts: false, defaultFontFamily: 'Kalam' } }).render().asPng();
}

module.exports = { Frame, renderPNG, W, H, FPS, INK, OR, HL, PAPERC, GREY, cl, k, oc, ob, io, lerp };
