// Halftone — renders images as a living print screen.
// Each image is broken into a rotated dot grid whose dot size follows the
// image's tone. Images dissolve into one another cell by cell, and a loupe
// under the pointer shows the continuous-tone original, magnified.

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uCell;
uniform float uAngle;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform float uProg;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLoupeR;
uniform float uLoupeOn;
uniform float uZoom;
uniform float uScroll;
uniform float uMix;
uniform float uIntro;
uniform float uDrift;
uniform float uGamma;
uniform float uGainA;
uniform float uGainB;
uniform vec3 uInk;
uniform vec3 uDot;
uniform vec3 uLime;
uniform vec2 uVel;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec2 coverUV(vec2 p, vec2 img) {
  float s = max(uRes.x / img.x, uRes.y / img.y) * (1.0 + uDrift);
  vec2 d = img * s;
  vec2 o = (uRes - d) * 0.5;
  return (p - o) / d;
}

// The continuous-tone source at a canvas point, mid-dissolve between images
vec3 source(vec2 p) {
  return mix(texture2D(uA, coverUV(p, uSizeA)).rgb, texture2D(uB, coverUV(p, uSizeB)).rgb, smoothstep(0.3, 0.7, uProg));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float cs = uCell * (1.0 + uScroll * 2.4);
  float ca = cos(uAngle), sa = sin(uAngle);
  vec2 q = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);
  vec2 cell = floor(q / cs);
  vec2 cq = (cell + 0.5) * cs;
  vec2 c = vec2(ca * cq.x + sa * cq.y, -sa * cq.x + ca * cq.y);
  float h = hash(cell);

  vec3 colA = texture2D(uA, coverUV(c, uSizeA)).rgb;
  vec3 colB = texture2D(uB, coverUV(c, uSizeB)).rgb;
  float lA = clamp(luma(colA) * uGainA, 0.0, 1.0);
  float lB = clamp(luma(colB) * uGainB, 0.0, 1.0);

  // Dissolve order: a diagonal sweep roughened by per-cell noise.
  float order = clamp(0.6 * (c.x / uRes.x * 0.65 + (1.0 - c.y / uRes.y) * 0.35) + 0.4 * h, 0.0, 1.0);
  float tB = smoothstep(order * 0.72, order * 0.72 + 0.28, uProg);
  float intro = smoothstep(order * 0.75, order * 0.75 + 0.25, uIntro);

  float breathe = 1.0 + 0.08 * sin(uTime * 1.25 + h * 6.2831);
  // Liquid lens: measure distance in a space stretched along the pointer's motion,
  // so the glass elongates when dragged and wobbles back when it stops.
  vec2 rel = p - uMouse;
  float sAmt = length(uVel);
  vec2 sDir = sAmt > 0.0001 ? uVel / sAmt : vec2(1.0, 0.0);
  float along = dot(rel, sDir);
  vec2 relS = sDir * (along / (1.0 + sAmt)) + (rel - sDir * along) * (1.0 + sAmt * 0.5);
  float dm = length(relS);
  float lr = uLoupeR * uLoupeOn;
  float swell = 1.0 + 0.75 * uLoupeOn * exp(-pow((dm - lr) / max(lr * 0.42, 1.0), 2.0));
  float rMax = cs * 0.64 * breathe * swell * intro;
  float rA = pow(lA, uGamma) * rMax * (1.0 - tB);
  float rB = pow(lB, uGamma) * rMax * tB;

  float d = length(q - cq);
  float mA = 1.0 - smoothstep(rA - 0.9, rA + 0.9, d);
  float mB = 1.0 - smoothstep(rB - 0.9, rB + 0.9, d);

  vec3 col = uInk;
  col = mix(col, mix(uDot, colA, uMix), mA);
  col = mix(col, mix(uDot, colB, uMix), mB);
  col = mix(col, uInk, uScroll * 0.7);

  // Liquid Glass loupe, after Apple's: a clear slab whose rim is a convex squircle bevel. The flat
  // face magnifies; the bevel bends light outward, so the rim gathers the print from just beyond
  // the glass. Nothing on it is painted white: the rim mirrors and catches the colour of what
  // surrounds it, so it burns lime over lime and all but vanishes over ink, save thin glints
  // where the bevel turns to the light. Only pixels near the lens pay for the extra samples.
  if (uLoupeOn > 0.002 && dm < lr * 1.4) {
    float R = max(lr, 1.0);
    vec2 dir = rel / max(length(rel), 0.001);
    // Key light from the top-left (screen y points down). It swings a little as the lens
    // travels, so the glints slide round the rim the way they do when you tilt a phone.
    vec2 L = normalize(vec2(-0.5547, -0.8321) - (uMouse / uRes - 0.5) * 0.5);
    float facing = dot(dir, L);                            // +1 where the rim faces the light
    float inside = 1.0 - smoothstep(R - 1.0, R + 0.5, dm);
    float e = R - dm;                                      // px in from the rim

    // Bevel: x is 0 at the rim and 1 where the face turns flat. h is a convex squircle, near
    // vertical at the rim and easing into the face; N is the bevel's surface normal.
    float x = clamp(e / (R * 0.36), 0.0, 1.0);
    float u = 1.0 - x;
    float k = max(1.0 - u * u * u * u, 1e-4);
    float h = pow(k, 0.25);
    vec3 N = normalize(vec3(dir * min(u * u * u * pow(k, -0.75), 24.0) * 0.8, 1.0));
    float graze = max(1.0 - N.z, 0.0);                     // 0 on the face, ~1 on the steep rim

    // What the rim sees: the print just past the glass on that side, softened across a short arc
    vec2 eP = uMouse + dir * R * 1.3, eT = vec2(-dir.y, dir.x) * R * 0.22;
    vec3 env = (source(eP) + source(eP + eT) + source(eP - eT)) / 3.0;

    // On the print: a soft contact shadow falling away from the light, and inside it the faint
    // crescent of light the glass focuses. Both multiply the print, so over ink they vanish.
    float outside = (1.0 - inside) * uLoupeOn;
    float sd = length(relS + L * R * 0.07) / R;
    col *= 1.0 - outside * exp(-pow(max(sd - 0.97, 0.0) / 0.24, 2.0)) * 0.24;
    col *= 1.0 + outside * exp(-pow((dm / R - 1.05) / 0.045, 2.0)) * pow(max(-facing, 0.0), 2.0) * 0.45;

    // Refraction: the face magnifies; the bevel bends light outward, so the image compresses
    // toward the rim and the rim itself shows the print just beyond the glass, continuous with
    // what lies outside. Channels bend slightly differently (dispersion).
    float bend = (1.0 - h) * (R * 1.06 - R / uZoom);
    vec2 base = uMouse + rel / uZoom;
    vec2 oR = base + dir * bend * 1.07, oG = base + dir * bend, oB = base + dir * bend * 0.93;
    vec3 la = vec3(texture2D(uA, coverUV(oR, uSizeA)).r, texture2D(uA, coverUV(oG, uSizeA)).g, texture2D(uA, coverUV(oB, uSizeA)).b);
    vec3 lb = vec3(texture2D(uB, coverUV(oR, uSizeB)).r, texture2D(uB, coverUV(oG, uSizeB)).g, texture2D(uB, coverUV(oB, uSizeB)).b);
    vec3 lc = mix(la, lb, smoothstep(0.3, 0.7, uProg));
    lc = mix(vec3(luma(lc)), lc, 1.1);                     // glass deepens colour a touch
    // The bevel is lit on the side facing the light and falls into shade opposite, which gives
    // the slab its volume over bright print (and does nothing over ink)
    lc *= 1.0 + graze * facing * 0.28;

    // Fresnel: the steeper the bevel, the more it mirrors its surroundings
    lc = mix(lc, env, pow(graze, 5.0) * 0.65);
    // Light caught in the glass takes the content's colour: hot lime over lime, dim pewter over
    // ink, whitening only at the very peak of the lit side
    float lit = pow(max(facing, 0.0), 3.0), back = pow(max(-facing, 0.0), 4.0);
    vec3 glint = mix(env, vec3(1.0), 0.45 + 0.4 * lit * lit) * (0.15 + 0.85 * luma(env));
    // Hairline glints on the rim, strongest facing the light, with a softer return on the far
    // side where light bounces back through the glass
    float line = smoothstep(0.0, 1.2, e) * exp(-e / (1.6 + R * 0.012));
    lc += glint * line * (0.08 + 1.2 * lit + 0.55 * back);
    // and a broader sheen just inside, where the bevel's slope meets the light square on
    vec3 H = normalize(vec3(L * 0.89, 1.447)), H2 = normalize(vec3(-L * 0.89, 1.447));
    lc += glint * (0.55 * pow(max(dot(N, H), 0.0), 60.0) + 0.2 * pow(max(dot(N, H2), 0.0), 60.0));

    col = mix(col, lc, inside);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class Halftone {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.o = Object.assign({
      images: [],            // [{ src }] or [{ canvas }]
      cell: [7, 11],         // css px, min / max — scales with width
      angle: 45,
      mix: 0,                // 0 = flat dot colour, 1 = dots take the image colour
      ink: '#0b0b0a', dot: '#ecebe5', lime: '#a8ff00',
      gamma: 0.9,
      exposure: 0.46,      // target mean tone for auto exposure (0 = off)
      loupe: 120,            // loupe radius in css px (0 disables)
      zoom: 1.7,
      cycle: 0,              // ms between images (0 = static)
      transition: 1500,
      wander: false,         // drift the loupe on its own when there is no pointer
      onChange: null, onTick: null, onReady: null,
    }, opts);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tex = [];
    this.cur = 0; this.nxt = 0; this.prog = 0; this.transStart = 0; this.inTrans = false;
    this.intro = this.reduced ? 1 : 0; this.introStart = 0;
    this.mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: 0, target: 0, last: 0 };
    this.scroll = 0; this.visible = true; this.running = false; this.cycleAt = 0; this.paused = false; this.held = false; this.heldAt = 0; this.tOff = 0;
    this.ok = this.init();
  }

  init() {
    const gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    this.gl = gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr); this.pr = pr;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    ['uRes', 'uCell', 'uAngle', 'uA', 'uB', 'uSizeA', 'uSizeB', 'uProg', 'uTime', 'uMouse', 'uLoupeR', 'uLoupeOn', 'uZoom', 'uScroll', 'uMix', 'uIntro', 'uDrift', 'uGamma', 'uGainA', 'uGainB', 'uInk', 'uDot', 'uLime', 'uVel']
      .forEach(n => { this.u[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1i(this.u.uA, 0); gl.uniform1i(this.u.uB, 1);
    gl.uniform3fv(this.u.uInk, hex(this.o.ink)); gl.uniform3fv(this.u.uDot, hex(this.o.dot)); gl.uniform3fv(this.u.uLime, hex(this.o.lime));
    gl.uniform1f(this.u.uAngle, this.o.angle * Math.PI / 180);
    gl.uniform1f(this.u.uMix, this.o.mix); gl.uniform1f(this.u.uZoom, this.o.zoom); gl.uniform1f(this.u.uGamma, this.o.gamma);
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.stop(); this.canvas.dispatchEvent(new CustomEvent('halftone:lost', { bubbles: true })); });
    this.resize();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.canvas);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); }, { rootMargin: '100px' });
    this.io.observe(this.canvas);
    this.onPointer = this.onPointer.bind(this);
    this.onLeave = () => { this.mouse.target = 0; };
    addEventListener('pointermove', this.onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
    this.loop = this.loop.bind(this);
    return true;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    this.dpr = dpr; this.w = Math.max(1, Math.round(r.width * dpr)); this.h = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== this.w || this.canvas.height !== this.h) { this.canvas.width = this.w; this.canvas.height = this.h; }
    const [cmin, cmax] = this.o.cell;
    this.cellPx = clamp(r.width / 165, cmin, cmax) * dpr;
    if (this.gl) { this.gl.viewport(0, 0, this.w, this.h); this.kick(); }
  }

  onPointer(e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
    const over = e.target.closest && e.target.closest('a, button, input, textarea, [data-no-loupe]');
    this.mouse.tx = x * this.dpr; this.mouse.ty = y * this.dpr;
    if (this.mouse.x < -999) { this.mouse.x = this.mouse.tx; this.mouse.y = this.mouse.ty; }
    this.mouse.target = inside && !over && this.o.loupe ? 1 : 0;
    this.mouse.last = performance.now();
    this.kick();
  }

  async load(src) {
    if (src.canvas) return src.canvas;
    const img = new Image(); img.decoding = 'async'; img.src = src.src;
    await img.decode();
    return img;
  }

  upload(source) {
    const gl = this.gl; const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { t, w: source.naturalWidth || source.width, h: source.naturalHeight || source.height, gain: this.gain(source) };
  }

  // Auto exposure: lift dark images so every piece prints with a full tonal range.
  gain(source) {
    if (!this.o.exposure) return 1;
    try {
      const c = document.createElement('canvas'); c.width = c.height = 24;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(source, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      return clamp(this.o.exposure / Math.max(s / (d.length / 4), 0.04), 0.85, 2.6);
    } catch (e) { return 1; }
  }

  async start() {
    if (!this.ok) return false;
    const imgs = this.o.images;
    try { this.tex[0] = this.upload(await this.load(imgs[0])); } catch (e) { return false; }
    this.introStart = performance.now(); this.cycleAt = performance.now() + (this.o.cycle || 0) + (this.reduced ? 0 : 900);
    this.running = true; this.kick();
    this.o.onReady && this.o.onReady();
    this.o.onChange && this.o.onChange(0);
    // remaining images load lazily, one at a time
    const rest = async () => { for (let i = 1; i < imgs.length; i++) { try { this.tex[i] = this.upload(await this.load(imgs[i])); } catch (e) { /* skip */ } } };
    // a busy rAF loop can starve idle time, so the rest load by 1.5 s at the latest
    if ('requestIdleCallback' in window) requestIdleCallback(rest, { timeout: 1500 }); else setTimeout(rest, 200);
    return true;
  }

  goTo(i) {
    const n = this.o.images.length; if (n < 2) return;
    i = ((i % n) + n) % n;
    if (i === this.cur || this.inTrans) return;
    if (!this.tex[i]) return;
    this.nxt = i; this.inTrans = true; this.transStart = performance.now();
    this.o.onChange && this.o.onChange(i);
    this.kick();
  }
  next() { this.goTo(this.cur + 1); this.cycleAt = performance.now() + this.o.cycle + this.o.transition; }
  prev() { this.goTo(this.cur - 1); this.cycleAt = performance.now() + this.o.cycle + this.o.transition; }
  setScroll(v) { const n = clamp(v, 0, 1); if (Math.abs(n - this.scroll) > .0005) { this.scroll = n; this.kick(); } }
  pause(p) { this.paused = p; if (!p) this.cycleAt = performance.now() + this.o.cycle; this.kick(); }
  // Hold press (the visitor's pause control): no slide cycle, no breathing, no wandering lens.
  // The dot screen's clock stops where it is and carries on from there on release.
  hold(on) {
    const now = performance.now();
    if (on && !this.held) this.heldAt = now;
    if (!on && this.held) { this.tOff += now - this.heldAt; this.cycleAt = now + this.o.cycle; }
    this.held = on; this.kick();
  }

  kick() { if (this.running && !this.raf && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.loop); }
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }

  loop(now) {
    this.raf = 0;
    if (!this.running || !this.visible || document.hidden) return;
    const gl = this.gl, o = this.o, m = this.mouse;
    let animating = false;

    // intro build
    if (this.intro < 1) { this.intro = clamp((now - this.introStart) / 1800, 0, 1); animating = true; }

    // auto cycle
    if (o.cycle && !this.reduced && !this.paused && !this.held && !this.inTrans && now >= this.cycleAt && this.o.images.length > 1) {
      const i = (this.cur + 1) % this.o.images.length;
      if (this.tex[i]) { this.goTo(i); this.cycleAt = now + o.cycle + o.transition; } else this.cycleAt = now + 400;
    }
    if (this.inTrans) {
      this.prog = ease(clamp((now - this.transStart) / o.transition, 0, 1));
      if (this.prog >= 1) { this.cur = this.nxt; this.prog = 0; this.inTrans = false; }
      animating = true;
    }
    if (o.cycle && !this.reduced && !this.paused && !this.held) {
      o.onTick && o.onTick(this.inTrans ? 0 : 1 - clamp((this.cycleAt - now) / o.cycle, 0, 1));
      animating = true;
    }

    // loupe: follow pointer, or wander when idle on touch / when asked
    const idle = now - m.last > 4000;
    if (o.wander && (idle || m.last === 0) && !this.reduced && !this.held) {
      const t = now / 1000;
      m.tx = this.w * (0.5 + 0.32 * Math.sin(t * 0.37)); m.ty = this.h * (0.42 + 0.22 * Math.sin(t * 0.53 + 1.3));
      m.target = 0.75;
      if (m.x < -999) { m.x = m.tx; m.y = m.ty; }
    }
    const k = this.reduced ? 1 : 0.18;
    const px = m.x, py = m.y;
    m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k;
    // Liquid stretch: an under-damped spring chases the lens velocity, so the glass
    // elongates along a drag and wobbles back to round when the pointer stops.
    const st = this.stretch || (this.stretch = { x: 0, y: 0, vx: 0, vy: 0 });
    if (!this.reduced && px > -999) {
      const R = Math.max(o.loupe * this.dpr, 1);
      let tx = (m.x - px) / R * 1.8, ty = (m.y - py) / R * 1.8;
      const len = Math.hypot(tx, ty); if (len > 0.2) { tx *= 0.2 / len; ty *= 0.2 / len; }
      st.vx = (st.vx + (tx - st.x) * 0.16) * 0.74; st.vy = (st.vy + (ty - st.y) * 0.16) * 0.74;
      st.x += st.vx; st.y += st.vy;
      if (Math.abs(st.x) + Math.abs(st.y) + Math.abs(st.vx) + Math.abs(st.vy) > 0.0005) animating = true;
    }
    m.on += (m.target - m.on) * (this.reduced ? 1 : 0.12);
    if (Math.abs(m.tx - m.x) > .3 || Math.abs(m.ty - m.y) > .3 || Math.abs(m.target - m.on) > .002) animating = true;
    if (!this.reduced && !this.held) animating = true; // breathing

    const a = this.tex[this.cur], b = this.tex[this.inTrans ? this.nxt : this.cur];
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.t);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.t);
    gl.uniform2f(this.u.uRes, this.w, this.h);
    gl.uniform1f(this.u.uCell, this.cellPx);
    gl.uniform2f(this.u.uSizeA, a.w, a.h); gl.uniform2f(this.u.uSizeB, b.w, b.h);
    gl.uniform1f(this.u.uGainA, a.gain); gl.uniform1f(this.u.uGainB, b.gain);
    gl.uniform1f(this.u.uProg, this.inTrans ? this.prog : 0);
    const clock = (this.held ? this.heldAt : now) - this.tOff; // stops while held, resumes without a jump
    gl.uniform1f(this.u.uTime, this.reduced ? 0 : clock / 1000);
    gl.uniform2f(this.u.uMouse, m.x, m.y);
    gl.uniform1f(this.u.uLoupeR, o.loupe * this.dpr * (o.wander && m.target < 1 ? 0.8 : 1));
    gl.uniform1f(this.u.uLoupeOn, m.on);
    gl.uniform2f(this.u.uVel, st.x, st.y);
    gl.uniform1f(this.u.uScroll, this.scroll);
    gl.uniform1f(this.u.uIntro, this.intro);
    gl.uniform1f(this.u.uDrift, this.reduced ? 0.02 : 0.02 + 0.02 * Math.sin(clock / 9000));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (animating) this.raf = requestAnimationFrame(this.loop);
  }
}

// PrintReveal — images arrive as a tonal halftone and "develop" into the
// photograph as they scroll into view: the dots swell, pick up colour and
// merge into continuous tone in a diagonal print pass. One shared WebGL
// context renders every image into its own 2D canvas, so any number of
// images can be on a page without running out of contexts.

const FRAG_REVEAL = `
precision highp float;
uniform vec2 uRes;
uniform float uCell;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uProg;
uniform float uGain;
uniform vec3 uInk;
uniform vec3 uDot;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec2 coverUV(vec2 p, vec2 img) {
  float s = max(uRes.x / img.x, uRes.y / img.y);
  vec2 d = img * s;
  return (p - (uRes - d) * 0.5) / d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  const float ca = 0.70710678, sa = 0.70710678;
  vec2 q = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);
  vec2 cell = floor(q / uCell);
  vec2 cq = (cell + 0.5) * uCell;
  vec2 c = vec2(ca * cq.x + sa * cq.y, -sa * cq.x + ca * cq.y);
  float h = hash(cell);

  vec3 cc = texture2D(uTex, coverUV(c, uSize)).rgb;
  float l = clamp(luma(cc) * uGain, 0.0, 1.0);

  // A print pass: top-left to bottom-right, roughened per cell.
  float order = clamp(0.62 * (c.x / uRes.x * 0.38 + c.y / uRes.y * 0.62) + 0.38 * h, 0.0, 1.0);
  float t = smoothstep(order * 0.6, order * 0.6 + 0.4, uProg);

  float r = (pow(l, 0.9) * 0.6 + 0.05) * uCell * (1.0 + 1.7 * t * t);
  float d = length(q - cq);
  float m = 1.0 - smoothstep(r - 0.9, r + 0.9, d);

  vec3 dotCol = mix(uDot, cc, smoothstep(0.05, 0.6, t));
  vec3 col = mix(uInk, dotCol, m);
  vec3 photo = texture2D(uTex, coverUV(p, uSize)).rgb;
  col = mix(col, photo, smoothstep(0.5, 1.0, t));
  gl_FragColor = vec4(col, 1.0);
}
`;

export class PrintReveal {
  constructor(opts = {}) {
    this.o = Object.assign({ duration: 2600, ink: '#121211', dot: '#c9c7bf', exposure: 0.46, onFail: null }, opts);
    this.items = new Map(); this.active = new Set(); this.raf = 0;
    this.ok = !matchMedia('(prefers-reduced-motion: reduce)').matches && this.init();
  }

  init() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG_REVEAL);
    if (!vs || !fs) return false;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; ['uRes', 'uCell', 'uTex', 'uSize', 'uProg', 'uGain', 'uInk', 'uDot'].forEach(n => { this.u[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform3fv(this.u.uInk, hex(this.o.ink)); gl.uniform3fv(this.u.uDot, hex(this.o.dot));
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.failAll(); });
    this.gl = gl; this.glc = canvas;
    this.near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { this.near.unobserve(e.target); this.prepare(e.target); } }), { rootMargin: '90% 0px 90% 0px' });
    this.seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { this.seen.unobserve(e.target); this.play(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });
    this.ro = new ResizeObserver(es => es.forEach(e => { const it = this.items.get(e.target); if (it && it.ready && !it.started) this.draw(it, 0); }));
    this.loop = this.loop.bind(this);
    return true;
  }

  observe(els) { els.forEach(el => { this.near.observe(el); this.seen.observe(el); }); }

  async prepare(el) {
    const img = el.querySelector('img'); if (!img) return this.fail(el);
    const prev = this.items.get(el);
    const it = { el, img, ready: false, started: false, want: !!(prev && prev.want), t0: 0, tex: null };
    this.items.set(el, it);
    try { if (!img.complete || !img.naturalWidth) await img.decode(); else await img.decode().catch(() => {}); } catch (e) { return this.fail(el); }
    if (!img.naturalWidth) return this.fail(el);
    const gl = this.gl;
    it.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, it.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch (e) { return this.fail(el); }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    it.w = img.naturalWidth; it.h = img.naturalHeight; it.gain = this.gain(img);
    const c = document.createElement('canvas'); c.className = 'ht-canvas'; c.setAttribute('aria-hidden', 'true');
    img.after(c); it.canvas = c; it.ctx = c.getContext('2d');
    this.ro.observe(el);
    this.draw(it, 0);
    it.ready = true;
    el.classList.add('ht-gl');
    if (it.want) this.start(it);
  }

  play(el) {
    const it = this.items.get(el);
    if (!it) { this.items.set(el, { el, want: true }); return; }
    if (it.ready) this.start(it); else it.want = true;
  }

  start(it) {
    if (it.started) return;
    // stagger images that start together (a row of cards) by a beat each
    const now = performance.now();
    const queued = [...this.active].filter(a => now - a.t0 < 120).length;
    it.started = true; it.t0 = now + queued * 140;
    this.active.add(it);
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  loop(now) {
    this.raf = 0;
    this.active.forEach(it => {
      const p = Math.min(1, Math.max(0, (now - it.t0) / this.o.duration));
      this.draw(it, ease(p));
      if (p >= 1) this.finish(it);
    });
    if (this.active.size) this.raf = requestAnimationFrame(this.loop);
  }

  draw(it, prog) {
    const r = it.el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.min(2048, Math.round(r.width * dpr)), h = Math.min(2048, Math.round(r.height * dpr));
    if (it.canvas.width !== w || it.canvas.height !== h) { it.canvas.width = w; it.canvas.height = h; }
    const gl = this.gl, gc = this.glc;
    if (gc.width < w || gc.height < h) { gc.width = Math.max(gc.width, w); gc.height = Math.max(gc.height, h); }
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, it.tex);
    gl.uniform2f(this.u.uRes, w, h);
    gl.uniform1f(this.u.uCell, clamp(r.width / 120, 5, 9.5) * dpr);
    gl.uniform2f(this.u.uSize, it.w, it.h);
    gl.uniform1f(this.u.uProg, prog);
    gl.uniform1f(this.u.uGain, it.gain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    it.ctx.drawImage(gc, 0, gc.height - h, w, h, 0, 0, w, h);
  }

  finish(it) {
    this.active.delete(it);
    it.canvas.classList.add('is-done');
    setTimeout(() => { it.canvas.remove(); this.gl.deleteTexture(it.tex); this.ro.unobserve(it.el); this.items.delete(it.el); }, 400);
  }

  fail(el) {
    this.near.unobserve(el); this.seen.unobserve(el);
    const it = this.items.get(el); if (it && it.canvas) it.canvas.remove();
    this.items.delete(el); el.classList.remove('ht-gl');
    this.o.onFail && this.o.onFail(el);
  }

  failAll() { [...this.items.keys()].forEach(el => this.fail(el)); this.active.clear(); }

  gain(img) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 24;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      return clamp(this.o.exposure / Math.max(s / (d.length / 4), 0.04), 0.85, 2.6);
    } catch (e) { return 1; }
  }
}

// Draw text to a canvas so it can be fed to the halftone as an image.
export function textCanvas(text, { w = 1600, h = 900, font = '900 620px Archivo', fg = '#ecebe5', bg = '#0b0b0a', stretch = '62%' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  try { x.fontStretch = stretch === '62%' ? 'extra-condensed' : 'normal'; } catch (e) { /* older engines */ }
  x.font = font; x.fillText(text, w / 2, h / 2 + h * 0.04);
  return c;
}
