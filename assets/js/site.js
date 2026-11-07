// DSB / PROOF — site interactions.
import { Halftone, PrintReveal, textCanvas } from './halftone.js?v=20261106a';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const motion = { held: false }; // the hero's Hold control; 'dsb:hold' fires when it changes
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};

/* Clock ------------------------------------------------------------------ */
function clock() {
  const els = $$('[data-clock]'); if (!els.length) return;
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', hour12: true });
  const tick = () => { const t = f.format(new Date()).replace(/\s?([ap])\.?m\.?/i, (m, a) => ' ' + a.toUpperCase() + 'M'); els.forEach(e => { e.textContent = t; }); };
  tick(); setInterval(tick, 15000);
}

/* Header: theme by section, hide on scroll down -------------------------- */
function header() {
  const hdr = $('[data-hdr]'); if (!hdr) return;
  const themed = $$('main [data-theme], .ftr[data-theme]');
  let lastY = scrollY, ticking = false;
  const update = () => {
    ticking = false;
    const probe = 34; let theme = 'ink';
    for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) theme = s.dataset.theme; }
    if (hdr.dataset.hdrTheme !== theme) hdr.dataset.hdrTheme = theme;
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    if (!document.body.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 320 && y > lastY + 2);
    if (y < lastY - 2 || y < 320) hdr.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* Mobile menu ------------------------------------------------------------ */
function menu() {
  const btn = $('[data-menu-btn]'), m = $('#menu'); if (!btn || !m) return;
  const label = $('[data-menu-label]', btn);
  // While the menu is open the page behind it is inert, so Tab stays on the header and the menu.
  const behind = $$('main, .ftr, .skip');
  const set = open => {
    btn.setAttribute('aria-expanded', open); m.classList.toggle('is-open', open); m.inert = !open;
    behind.forEach(el => { el.inert = open; });
    document.body.classList.toggle('menu-open', open); if (label) label.textContent = open ? 'Close' : 'Menu';
    if (open) setTimeout(() => $('a', m)?.focus(), 300); else btn.focus({ preventScroll: true });
  };
  m.inert = true;
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') set(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) set(false); });
}

/* Split text into masked words ------------------------------------------ */
function splitWords(el, cls = 'w') {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span'); w.className = cls; w.style.setProperty('--i', i++);
          const s = document.createElement('span'); s.textContent = p; w.appendChild(s); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el); return i;
}

/* Reveals ---------------------------------------------------------------- */
function reveals(gl) {
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => { c.classList.add('reveal'); c.style.setProperty('--i', i); }));
  $$('[data-split]').forEach(el => splitWords(el));
  // Images develop through the WebGL print reveal when it is available; the
  // CSS dot mask is the fallback.
  if (gl) gl.observe($$('.print-in'));
  const els = $$(gl ? '.reveal, [data-split]' : '.reveal, [data-split], .print-in');
  if (!('IntersectionObserver' in window) || reduced) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(e => { if (!e.closest('[data-hold]')) io.observe(e); });
  document.addEventListener('dsb:release', () => $$('[data-hold] .reveal, [data-hold] [data-split], [data-hold] .print-in').forEach(e => io.observe(e)));
}

/* Manifesto — words ink up as the block scrolls through the viewport ----- */
function manifesto() {
  const el = $('[data-light]'); if (!el) return;
  const n = splitWords(el, 'w');
  const words = $$('.w', el), hls = $$('.hl', el);
  if (reduced) { words.forEach(w => w.classList.add('is-lit')); hls.forEach(h => h.classList.add('is-lit')); return; }
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = el.getBoundingClientRect(); const vh = innerHeight;
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.35), 0, 1);
    const lit = Math.round(p * n * 1.08);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    hls.forEach(h => { const last = $$('.w', h).pop(); h.classList.toggle('is-lit', !!last && last.classList.contains('is-lit')); });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* Kinetic name ----------------------------------------------------------- */
function kineticName() {
  const name = $('[data-kinetic]'); if (!name) return null;
  const lines = $$('.line', name);
  const chars = [];
  const rows = lines.map(line => {
    const text = line.textContent; line.textContent = '';
    const row = { line, end: line.classList.contains('line--2'), chars: [], width: 0 };
    [...text].forEach(c => {
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c;
      s.style.setProperty('--i', chars.length); line.appendChild(s);
      const ch = { el: s, w: 125, g: 900, tw: 62, tg: 900, cx: 0, cy: 0 };
      chars.push(ch); row.chars.push(ch);
    });
    return row;
  });

  // Letters sit in absolutely positioned boxes and are set side by side with transforms, so the
  // width axis can animate (intro, pointer, ambient wave) without reflowing the line: no layout
  // shift. Line 2 hangs from the right edge, as its old flex-end layout did.
  const place = () => rows.forEach(r => {
    const ws = r.chars.map(c => c.el.getBoundingClientRect().width);
    r.width = ws.reduce((a, b) => a + b, 0);
    let x = r.end ? r.line.clientWidth - r.width : 0;
    r.chars.forEach((c, i) => { c.el.style.transform = `translateX(${x.toFixed(2)}px)`; x += ws[i]; });
  });
  place();

  // Size the name so its widest line spans most of the measure at rest,
  // leaving room for letters to stretch under the pointer.
  // The CSS already starts at this size (site.css, .hero__name.d-mega), so keep the CSS value
  // unless the measurement disagrees by more than half a pixel: no resize, no layout shift.
  let faceIn = false;
  const fit = () => {
    // Measuring the fallback face would size the name wrong and jump when Archivo lands;
    // keep the CSS size until Archivo itself has loaded (faceIn, below, fits again then).
    if (!faceIn) { place(); return; }
    // Under reduced motion site.css gives every element a .01ms transition on `all`, so a font-size
    // set here would still read the old size; switch transitions off while measuring.
    const still = on => [name, ...lines].forEach(el => { el.style.transitionProperty = on ? 'none' : ''; });
    still(true);
    const wrap = name.getBoundingClientRect().width;
    const target = innerWidth < 861 ? 0.9 : 0.72;
    name.style.fontSize = '';
    const css = parseFloat(getComputedStyle(name).fontSize);
    name.style.fontSize = '100px';
    chars.forEach(c => { c.el.style.setProperty('--w', 62); c.el.style.setProperty('--g', 900); });
    place();
    const w = Math.max(...rows.map(r => r.width)) || 1;
    const size = Math.min(wrap * target / w * 100, innerHeight * 0.25);
    name.style.fontSize = Math.abs(size - css) < 0.5 ? '' : size + 'px';
    place(); measure();
    chars.forEach(c => { c.el.style.setProperty('--w', c.w.toFixed(1)); c.el.style.setProperty('--g', c.g.toFixed(0)); });
    place();
    still(false);
  };
  const measure = () => chars.forEach(c => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2 + scrollX; c.cy = r.top + r.height / 2 + scrollY; });

  let mx = -9999, my = -9999, active = false, raf = 0, started = false, t0 = 0, lastMove = 0;
  const loop = now => {
    raf = 0; let moving = false;
    const R = Math.max(innerWidth * 0.2, 190);
    const intro = clamp((now - t0) / 1400, 0, 1);
    const ambient = !fine || now - lastMove > 5000;
    chars.forEach((c, i) => {
      let f = 0;
      if (active && !ambient) { const d = Math.hypot(c.cx - scrollX - mx, c.cy - scrollY - my); f = Math.exp(-((d / R) ** 2)); }
      else if (!reduced && !motion.held) { const ph = (now / 1000) * 1.1 - i * 0.42; f = Math.pow(Math.max(0, Math.sin(ph)), 14) * 0.85; }
      const local = clamp(intro * 1.6 - i * 0.04, 0, 1);
      c.tw = lerp(125, 62 + 63 * f, local); c.tg = lerp(500, 900 - 620 * f, local);
      c.w = lerp(c.w, c.tw, 0.14); c.g = lerp(c.g, c.tg, 0.14);
      if (Math.abs(c.w - c.tw) > .05 || Math.abs(c.g - c.tg) > .5) moving = true;
      c.el.style.setProperty('--w', c.w.toFixed(2)); c.el.style.setProperty('--g', c.g.toFixed(1));
    });
    place();
    if (moving || (ambient && !motion.held) || intro < 1) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && started) raf = requestAnimationFrame(loop); };
  document.addEventListener('dsb:hold', kick); // settle to rest when held, wave again on release

  // When the pointer goes still, wake the loop once the idle window has passed so the wave returns.
  let idleT = 0;
  if (fine) addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; active = true; lastMove = performance.now(); kick(); clearTimeout(idleT); idleT = setTimeout(kick, 5050); }, { passive: true });
  addEventListener('resize', () => { fit(); kick(); });
  addEventListener('scroll', () => { if (scrollY < innerHeight * 1.2) kick(); }, { passive: true });
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
  io.observe(name);

  const begin = () => {
    fit();
    if (reduced) { chars.forEach(c => { c.w = 62; c.g = 900; c.el.style.setProperty('--w', 62); c.el.style.setProperty('--g', 900); }); place(); name.classList.add('is-in'); return; }
    name.classList.add('is-in'); started = true; t0 = performance.now(); kick();
  };
  // fonts.status reads 'loaded' before Archivo has even been requested (nothing pending yet),
  // so wait for the face itself; load() also starts the fetch. A failed load fits on the fallback.
  (document.fonts?.load('900 100px Archivo') || Promise.resolve()).catch(() => {}).then(() => { faceIn = true; fit(); });
  return begin;
}

/* Hero halftone ---------------------------------------------------------- */
function heroArt() {
  const hero = $('[data-hero]'); if (!hero) return null;
  const canvas = $('canvas', hero);
  const slides = JSON.parse($('#hero-slides').textContent);
  const card = $('[data-now]'), title = $('[data-now-title]'), sub = $('[data-now-sub]'), idx = $('[data-now-idx]'), bar = $('[data-now-bar]');
  const onChange = i => {
    const s = slides[i];
    if (title) { title.textContent = s.title; sub.textContent = s.sub; idx.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0'); card.href = s.href; card.setAttribute('aria-label', 'Now showing: ' + s.title + ' — open project'); }
  };
  const art = new Halftone(canvas, {
    images: slides, cycle: 5200, transition: 1600, loupe: 118, zoom: 1.75, wander: !fine, cell: [6, 9.5], dot: '#c9c7bf', gamma: 1.05,
    onChange,
    onTick(p) { if (bar) bar.style.transform = `scaleX(${p})`; },
    onReady() { hero.classList.add('gl-ready'); },
  });

  // Hold: one control stops everything that moves on its own here (WCAG 2.2.2) and is remembered
  // for the session. Pointer-driven effects still answer the pointer.
  const holdBtn = $('[data-now-hold]', hero);
  const setHold = on => {
    motion.held = on; holdBtn?.setAttribute('aria-pressed', String(on));
    if (art.ok) art.hold(on);
    store.sset('dsb-hold', on ? '1' : '');
    document.dispatchEvent(new Event('dsb:hold'));
  };
  holdBtn?.addEventListener('click', () => setHold(holdBtn.getAttribute('aria-pressed') !== 'true'));
  if (!reduced && store.sget('dsb-hold')) setHold(true);

  const prevBtn = $('[data-now-prev]'), nextBtn = $('[data-now-next]');
  if (!art.ok) {
    // No WebGL: the dot-masked fallback print stays, and the arrows page through the slides on it.
    hero.classList.add('no-gl');
    const fb = $('.hero__fallback', hero); let cur = 0;
    const go = n => {
      cur = (n + slides.length) % slides.length;
      if (fb) { fb.removeAttribute('srcset'); fb.removeAttribute('sizes'); fb.src = slides[cur].src; }
      onChange(cur);
    };
    prevBtn?.addEventListener('click', () => go(cur - 1));
    nextBtn?.addEventListener('click', () => go(cur + 1));
    return null;
  }
  canvas.addEventListener('halftone:lost', () => hero.classList.remove('gl-ready'));
  prevBtn?.addEventListener('click', () => art.prev());
  nextBtn?.addEventListener('click', () => art.next());
  // Hovering or focusing anything in the Now showing box (card or its controls) holds the slide.
  const box = $('.hero__now', hero) || card;
  box?.addEventListener('pointerenter', () => art.pause(true));
  box?.addEventListener('pointerleave', () => art.pause(false));
  box?.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) art.pause(true); }); // keyboard only: a tap leaves focus behind
  box?.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) art.pause(false); });
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; const r = hero.getBoundingClientRect(); art.setScroll(-r.top / r.height); }); }, { passive: true });
  return art;
}

/* Colophon: hover (or tap) a script and the whole section re-sets in it ---- */
function colophon() {
  const sec = $('[data-colophon]'), data = $('#colophon-i18n'); if (!sec || !data) return;
  const dict = JSON.parse(data.textContent), els = $$('[data-i18n]', sec), btns = $$('[data-lang]', sec);
  dict.en = {}; els.forEach(el => { dict.en[el.dataset.i18n] = el.innerHTML; });
  // Full Gurmukhi/Devanagari faces load only once someone comes near the switch
  let fontsIn = false;
  const loadFonts = () => {
    if (fontsIn) return; fontsIn = true;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;800&family=Noto+Sans+Gurmukhi:wght@400;500;800&family=Noto+Serif+Devanagari&family=Noto+Serif+Gurmukhi&display=swap';
    document.head.appendChild(l);
  };
  let cur = 'en';
  const set = lang => {
    if (lang === cur || !dict[lang]) return; cur = lang; sec.dataset.lang = lang;
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang && lang !== 'en')));
    els.forEach((el, i) => {
      const html = dict[lang][el.dataset.i18n]; if (html == null) return;
      el.innerHTML = html;
      if (lang === 'en') el.removeAttribute('lang'); else el.lang = lang;
      if (!reduced) { el.classList.remove('is-reink'); void el.offsetWidth; el.style.setProperty('--ri', i); el.classList.add('is-reink'); }
    });
  };
  sec.addEventListener('pointerenter', loadFonts, { once: true });
  sec.addEventListener('focusin', loadFonts, { once: true });
  btns.forEach(b => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(b.dataset.lang); });
    b.addEventListener('click', () => { loadFonts(); set(b.dataset.lang); });
  });
  // Mouse: the language holds while you read, and resets when you leave the section
  sec.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set('en'); });
}

/* Portrait halftones (manifesto / about) --------------------------------- */
function portraits() {
  // The halftone portrait is an inspect-with-the-loupe piece; touch screens get the photograph.
  if (!fine) return;
  $$('[data-halftone]').forEach(frame => {
    const img = $('img', frame), canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true'); frame.appendChild(canvas);
    const src = frame.dataset.halftone || img.currentSrc || img.src;
    const art = new Halftone(canvas, { images: [{ src }], mix: 1, cell: [4.5, 6.5], loupe: fine ? 76 : 0, zoom: 1.6, gamma: 0.8, ink: '#0b0b0a', onReady() { frame.classList.add('gl-ready'); } });
    if (!art.ok) { canvas.remove(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { art.start(); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(frame);
  });
}

/* Loader ----------------------------------------------------------------- */
function loader(ready) {
  // The inline head script decides: .proofing only on the first page view of a session, when that
  // page is home and motion is allowed. Any page marks the session as proofed, so arriving on a
  // case study and then going home doesn't run the loader after the page transition.
  const el = $('[data-loader]'), root = document.documentElement;
  // If this script arrived so late that the CSS failsafe already lifted the cover, don't drop it
  // back over a page the visitor is reading.
  const lifted = el && getComputedStyle(el).visibility === 'hidden';
  if (!el || reduced || lifted || !root.classList.contains('proofing')) { el?.remove(); root.classList.remove('proofing'); return Promise.resolve(); }
  el.classList.add('is-on'); root.style.overflow = 'hidden';
  const count = $('[data-loader-count]', el), bar = $('[data-loader-bar]', el);
  const t0 = performance.now(), min = 1250, max = 3200;
  let isReady = false; ready.then(() => { isReady = true; });
  return new Promise(res => {
    const step = now => {
      const t = now - t0;
      const target = isReady ? clamp(t / min, 0, 1) : Math.min(0.9, t / max);
      const p = Math.max(+el.dataset.p || 0, target); el.dataset.p = p;
      count.textContent = String(Math.round(p * 100)).padStart(3, '0'); bar.style.setProperty('--p', p);
      if ((p >= 1 && isReady) || t > max) {
        count.textContent = '100'; bar.style.setProperty('--p', 1);
        setTimeout(() => {
          el.classList.add('is-out'); root.style.overflow = ''; root.classList.remove('proofing');
          setTimeout(() => el.remove(), 950); res();
        }, 180);
      } else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* Cursor label ----------------------------------------------------------- */
function cursorLabel() {
  if (!fine) return;
  const c = $('.cursor'), label = $('.cursor__label'); if (!c) return;
  let x = -100, y = -100, cx = 0, cy = 0, raf = 0, lastTarget = null;
  const loop = () => { cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22); c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; raf = Math.abs(cx - x) + Math.abs(cy - y) > .2 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop);
    const t = e.target.closest?.('[data-cursor]');
    lastTarget = t;
    if (t) { label.textContent = t.dataset.cursor; c.classList.add('is-on'); } else c.classList.remove('is-on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  addEventListener('scroll', () => { const el = document.elementFromPoint(x, y); const t = el && el.closest('[data-cursor]'); if (t) { label.textContent = t.dataset.cursor; c.classList.add('is-on'); } else c.classList.remove('is-on'); }, { passive: true });
}

/* Loupe — printer's loupe over gallery images ----------------------------- */
function loupe() {
  if (!fine) return;
  const l = $('.loupe'), read = $('.loupe__read'); if (!l) return;
  const Z = 2.4, R = 95; let cur = null;
  const move = e => {
    if (!cur) return;
    const img = $('img', cur), r = img.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) { l.classList.remove('is-on'); return; }
    l.classList.add('is-on');
    l.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    l.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    l.style.backgroundPosition = `${-(x * Z - R)}px ${-(y * Z - R)}px`;
    read.textContent = `X ${String(Math.round(x / r.width * 100)).padStart(3, '0')} · Y ${String(Math.round(y / r.height * 100)).padStart(3, '0')} · ${Z * 100}%`;
  };
  $$('[data-loupe]').forEach(el => {
    el.addEventListener('pointerenter', e => {
      const img = $('img', el); cur = el;
      const hi = el.dataset.loupe || img.currentSrc || img.src;
      l.style.backgroundImage = `url("${hi}"), url("${img.currentSrc || img.src}")`; move(e);
    });
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', () => { cur = null; l.classList.remove('is-on'); });
  });
  addEventListener('scroll', () => { if (cur) l.classList.remove('is-on'); }, { passive: true });
}

/* Floating preview for index rows and capabilities ----------------------- */
function preview() {
  if (!fine) return;
  const rows = $$('[data-preview]'); if (!rows.length) return;
  const box = document.createElement('div'); box.className = 'preview'; box.setAttribute('aria-hidden', 'true'); document.body.appendChild(box);
  const imgs = new Map();
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, vx = 0, raf = 0, on = false;
  const loop = () => {
    const nx = lerp(cx, x, 0.16), ny = lerp(cy, y, 0.16); vx = lerp(vx, nx - cx, 0.3); cx = nx; cy = ny;
    const rot = clamp(vx * 0.35, -9, 9);
    box.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${on ? 1 : .85})`;
    raf = (on || Math.abs(cx - x) > .3 || Math.abs(vx) > .05) ? requestAnimationFrame(loop) : 0;
  };
  const show = src => {
    if (!imgs.has(src)) { const i = new Image(); i.src = src; i.alt = ''; i.decoding = 'async'; box.appendChild(i); imgs.set(src, i); }
    imgs.forEach((i, k) => i.classList.toggle('is-cur', k === src));
    on = true; box.classList.add('is-on'); if (!raf) raf = requestAnimationFrame(loop);
  };
  // Once the page is being left, hold the preview as it is: it is what the case hero grows out of,
  // and Chrome fires pointerleave just before the old page is captured.
  let leaving = false;
  addEventListener('pageswap', () => { leaving = true; });
  addEventListener('pageshow', () => { leaving = false; });
  rows.forEach(r => {
    r.addEventListener('pointerenter', e => { x = e.clientX; y = e.clientY; if (!on) { cx = x; cy = y; } show(r.dataset.preview); });
    r.addEventListener('pointerleave', () => { if (leaving) return; on = false; box.classList.remove('is-on'); });
  });
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (on && !raf) raf = requestAnimationFrame(loop); }, { passive: true });
}

/* Work index: filters + list / grid -------------------------------------- */
function workIndex() {
  const idx = $('[data-index]'); if (!idx) return;
  const items = $$('[data-cat]', idx);
  const fbtns = $$('[data-filter]'), vbtns = $$('[data-view]');
  const setFilter = f => {
    fbtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === f));
    let n = 0;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.cat === f; it.hidden = !show;
      if (show && !reduced) { it.classList.remove('is-in'); it.classList.add('reveal'); it.style.setProperty('--i', n++ % 14); requestAnimationFrame(() => requestAnimationFrame(() => it.classList.add('is-in'))); }
    });
    const live = $('[data-index-live]'); if (live) live.textContent = `${items.filter(i => !i.hidden).length / 2} projects shown`;
  };
  const setView = v => { idx.dataset.view = v; vbtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v)); store.set('dsb-view', v); };
  fbtns.forEach(b => b.addEventListener('click', () => { setFilter(b.dataset.filter); const u = new URL(location); if (b.dataset.filter === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', b.dataset.filter); history.replaceState(null, '', u); }));
  vbtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  const saved = store.get('dsb-view'); setView(saved || (innerWidth < 861 ? 'grid' : 'list'));
  const cat = new URLSearchParams(location.search).get('cat');
  if (cat && fbtns.some(b => b.dataset.filter === cat)) setFilter(cat);
}

/* Lightbox --------------------------------------------------------------- */
function lightbox() {
  const dlg = $('.lightbox'); if (!dlg) return;
  const figs = $$('[data-lb]'); if (!figs.length) return;
  const img = $('img', dlg), cap = $('[data-lb-cap]', dlg), code = $('[data-lb-code]', dlg), count = $('[data-lb-count]', dlg);
  img.draggable = false; // a native image drag would cancel the swipe
  let i = 0, token = 0;
  const label = f => {
    img.alt = f.dataset.alt || '';
    cap.textContent = f.dataset.caption || ''; code.textContent = f.dataset.code || '';
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(figs.length).padStart(2, '0')}`;
  };
  // Opening sets image and caption together; stepping waits for the next image to decode, so the
  // caption never names an image that isn't on screen yet.
  const show = (n, now) => {
    i = (n + figs.length) % figs.length; const f = figs[i], t = ++token;
    if (now) { img.src = f.dataset.lb; label(f); return; }
    const next = new Image(); next.src = f.dataset.lb;
    const swap = () => { if (t !== token) return; img.src = f.dataset.lb; label(f); };
    (next.decode ? next.decode() : Promise.resolve()).then(swap, swap);
  };
  figs.forEach((f, n) => f.addEventListener('click', () => { show(n, true); dlg.showModal(); }));
  $('[data-lb-prev]', dlg).addEventListener('click', () => show(i - 1));
  $('[data-lb-next]', dlg).addEventListener('click', () => show(i + 1));
  $('[data-lb-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
  let sx = null, swiped = false;
  // A drag that ends on the letterbox is a swipe, not a click to close.
  dlg.addEventListener('click', e => { if (swiped) { swiped = false; return; } if (e.target === dlg || e.target.classList.contains('lightbox__stage')) dlg.close(); });
  dlg.addEventListener('pointerdown', e => { sx = e.clientX; swiped = false; });
  dlg.addEventListener('pointercancel', () => { sx = null; });
  dlg.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; swiped = Math.abs(dx) > 60; if (swiped) show(i + (dx < 0 ? 1 : -1)); sx = null; });
}

/* Copy email ------------------------------------------------------------- */
/* Marquee pause (WCAG 2.2.2) ----------------------------------------------- */
function marquee() {
  $$('.marquee__toggle').forEach(btn => {
    const m = document.getElementById(btn.getAttribute('aria-controls')); if (!m) return;
    btn.addEventListener('click', () => {
      const paused = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(paused)); m.classList.toggle('is-paused', paused);
    });
  });
}

function copyEmail() {
  $$('[data-copy]').forEach(b => b.addEventListener('click', async e => {
    e.preventDefault(); const st = $('.state', b);
    try { await navigator.clipboard.writeText(b.dataset.copy); if (st) st.textContent = 'Copied ✓'; }
    catch (err) { location.href = 'mailto:' + b.dataset.copy; return; }
    setTimeout(() => { if (st) st.textContent = 'Copy'; }, 2200);
  }));
}

/* Contact form ----------------------------------------------------------- */
function contactForm() {
  const f = $('#contact-form'); if (!f) return;
  const status = $('[data-form-status]', f), btn = $('button[type=submit]', f), label = $('[data-btn-label]', btn);
  const idle = label?.textContent;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    btn.disabled = true; f.setAttribute('aria-busy', 'true'); if (label) label.textContent = 'Sending…';
    status.className = 'form__status mono'; status.textContent = 'Sending to press…';
    try {
      const r = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      f.reset(); status.classList.add('is-ok'); status.textContent = 'Received — I’ll reply within 48 hours.';
    } catch (err) {
      // Keep what they wrote, and hand it to their own mail app in one click.
      const to = 'singhbrardivshaan@gmail.com', msg = f.elements.message?.value || '';
      const a = document.createElement('a');
      a.href = `mailto:${to}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(msg)}`;
      a.textContent = 'Email it to me directly';
      status.classList.add('is-err'); status.replaceChildren('That didn’t go through. ', a, ' — your message is still in the form.');
      a.focus({ preventScroll: true }); // the way forward is the link, and focus order follows it
    } finally {
      btn.disabled = false; f.removeAttribute('aria-busy'); if (label) label.textContent = idle;
      // Disabling the focused button sent focus to <body>; put it back so keyboard users keep their place.
      if (document.activeElement === document.body) btn.focus({ preventScroll: true });
    }
  });
}

/* Live site embeds — load on request ------------------------------------- */
function liveEmbeds() {
  $$('[data-live]').forEach(btn => btn.addEventListener('click', () => {
    const frame = btn.closest('.live__frame');
    const ifr = document.createElement('iframe');
    ifr.src = btn.dataset.live; ifr.title = btn.dataset.title || 'Live preview'; ifr.loading = 'lazy';
    ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.replaceChildren(ifr);
  }));
}

/* 3D models (Sapporo) — load model-viewer only on request ----------------- */
function models() {
  const wrap = $('[data-models]'); if (!wrap) return;
  const stage = $('.models__stage', wrap), load = $('[data-models-load]', wrap);
  const base = wrap.dataset.models;
  const btns = $$('[data-model]', wrap);
  let mv = null;
  const pick = (file, btn) => { btns.forEach(b => b.setAttribute('aria-pressed', b === btn)); if (mv) mv.src = base + file; };
  load.addEventListener('click', () => {
    if (!customElements.get('model-viewer')) { const s = document.createElement('script'); s.type = 'module'; s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'; document.head.appendChild(s); }
    mv = document.createElement('model-viewer');
    const first = btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0];
    Object.entries({ src: base + first.dataset.model, alt: 'Sapporo The Sabbatical 3D model', 'camera-controls': '', 'auto-rotate': '', 'auto-rotate-delay': '800', 'rotation-per-second': '18deg', 'shadow-intensity': '1', 'shadow-softness': '0.8', 'environment-image': 'neutral', exposure: '1.1', 'tone-mapping': 'aces' }).forEach(([k, v]) => mv.setAttribute(k, v));
    stage.replaceChildren(mv);
    btns.forEach(b => { b.disabled = false; });
  });
  btns.forEach(b => b.addEventListener('click', () => pick(b.dataset.model, b)));
}

/* Cross-document view transitions: morph clicked image into case hero ---- */
function viewTransitions() {
  // A name may sit on only one element when the old page is captured, or the browser drops the
  // whole transition. The case hero names itself in site.css, so on a case page it is switched off
  // before the Next-case image takes the name.
  const clear = () => $$('img').forEach(i => { if (i.style.viewTransitionName) i.style.viewTransitionName = ''; });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-vt]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    clear();
    // In the list view the row thumbnail is hidden: the floating preview is the image in view.
    const img = (a.matches('[data-preview]') && $('.preview.is-on img.is-cur')) || $('[data-vt-img] img', a) || $('img', a);
    $$('.case-hero__media img').forEach(h => { if (h !== img) h.style.viewTransitionName = 'none'; });
    // A hidden or fully transparent image has nothing to morph from: the page just prints over.
    const seen = img && img.getClientRects().length && +getComputedStyle(img.closest('.next__media') || img).opacity > 0.95;
    if (seen) img.style.viewTransitionName = 'case-hero';
  });
  addEventListener('pageshow', clear);
  // Going Back restores a case page scrolled far down; its hero (named in CSS) would fly in from
  // thousands of pixels away. A hero out of view takes no part, on either side of the swap.
  const offstage = () => $$('.case-hero__media img').forEach(h => {
    const r = h.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) h.style.viewTransitionName = 'none';
  });
  addEventListener('pageswap', e => { if (e.viewTransition) offstage(); });
  addEventListener('pagereveal', e => { if (e.viewTransition) offstage(); });
}

/* 404 -------------------------------------------------------------------- */
function misprint() {
  const art = $('[data-misprint]'); if (!art) return;
  const canvas = $('canvas', art);
  (document.fonts?.load('900 100px Archivo') || Promise.resolve()).then(() => {
    const ht = new Halftone(canvas, { images: [{ canvas: textCanvas('404') }, { canvas: textCanvas('MISPRINT', { font: '900 300px Archivo' }) }], cycle: 3600, transition: 1400, mix: 0, loupe: fine ? 130 : 0, wander: !fine, cell: [7, 11] });
    if (ht.ok) ht.start();
  });
}

/* Boot ------------------------------------------------------------------- */
function boot() {
  const develop = new PrintReveal({ onFail: el => el.classList.add('is-in') });
  clock(); header(); menu(); manifesto(); reveals(develop.ok ? develop : null); colophon(); cursorLabel(); loupe(); preview();
  workIndex(); lightbox(); marquee(); copyEmail(); contactForm(); liveEmbeds(); models(); viewTransitions(); misprint(); portraits();
  const begin = kineticName();
  const art = heroArt();
  const ready = art ? art.start() : Promise.resolve();
  loader(ready).then(() => {
    document.dispatchEvent(new Event('dsb:release'));
    begin && begin();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
