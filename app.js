/* ============================================================
   BLAKE — CINEMATIC MASTERPIECE 2025
   Ultra-Orchestrated Scroll Film
   Every beat connected. No gaps. No dead frames.
============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  /* ----------------------------------------------------------
     HARD GUARDS
  ---------------------------------------------------------- */
  if (typeof gsap === 'undefined') {
    console.error('[BlakeReel] GSAP not loaded');
    return;
  }

  const ST = (typeof ScrollTrigger !== 'undefined')
    ? ScrollTrigger
    : (gsap.plugins && gsap.plugins.ScrollTrigger)
      ? gsap.plugins.ScrollTrigger
      : null;

  if (!ST) {
    console.error('[BlakeReel] ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ST);
  const ScrollTrigger = ST;

  const main = document.querySelector('main');
  if (!main) {
    console.error('[BlakeReel] <main> not found');
    return;
  }

  /* ----------------------------------------------------------
     CONFIG — GRID, NOT MAGIC NUMBERS
  ---------------------------------------------------------- */
  const vw = () => Math.max(window.innerWidth, 1);
  const vh = () => Math.max(window.innerHeight, 1);

  const CONFIG = {
    PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2),
    VARIANT: vw() >= 1280 ? 'full' : 'lite',
    BPM: 96,
    BEATS_PER_BAR: 4,
    TIME_SCALE: 1,
    OVERLAP_BEATS: 1.4,
    MASTER_SCROLL_DENSITY: 0.95,
    MASTER_GAIN: 0.09,
    MATERIAL: {
      chrome: { glint: 0.3 },
      glass:  { glint: 0.24 },
      fabric: { shear: 0.18 }
    }
  };

  const BEAT = 60 / CONFIG.BPM;
  const BAR  = BEAT * CONFIG.BEATS_PER_BAR;

  /* ----------------------------------------------------------
     UTILS
  ---------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const map = (v, a, b, c, d) => {
    if (a === b) return (c + d) / 2;
    return c + (d - c) * ((v - a) / (b - a));
  };
  const rand = (min, max) => min + Math.random() * (max - min);

  /* ----------------------------------------------------------
     LENIS + SCROLLER PROXY
  ---------------------------------------------------------- */
  let lenis = null;

  (function initLenis() {
    if (typeof Lenis === 'undefined') {
      console.warn('[BlakeReel] Lenis not found, using native scroll');
      ScrollTrigger.defaults({ scroller: window });
      return;
    }

    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      smoothTouch: true,
      syncTouch: true
    });

    lenis.on('scroll', () => ScrollTrigger.update());

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return window.scrollY || window.pageYOffset || 0;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: vw(), height: vh() };
      },
      pinType: document.documentElement.style.transform ? 'transform' : 'fixed'
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    ScrollTrigger.defaults({
      scroller: document.documentElement,
      anticipatePin: 1
    });
  })();

  /* ----------------------------------------------------------
     AUDIO ENGINE — SINGLE CONTEXT
  ---------------------------------------------------------- */
  const AudioCtx = {
    ctx: null,
    master: null,
    enabled: true,
    ensure() {
      if (this.ctx) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        console.warn('[BlakeReel] Web Audio not supported');
        this.enabled = false;
        return null;
      }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = CONFIG.MASTER_GAIN;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  };

  const Audio = {
    unlocked: false,
    unlockOnce() {
      if (this.unlocked) return;
      const unlock = () => {
        const ctx = AudioCtx.ensure();
        if (ctx) AudioCtx.resume();
        this.unlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    },
    note(freq, dur, gain = CONFIG.MASTER_GAIN, type = 'sine') {
      if (!AudioCtx.enabled) return;
      const ctx = AudioCtx.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g);
      g.connect(AudioCtx.master);
      osc.start(t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      osc.stop(t0 + dur);
    },
    chromePing() { this.note(1400, 0.16, CONFIG.MASTER_GAIN * 1.1, 'sine'); },
    fabricSoft() { this.note(520, 0.22, CONFIG.MASTER_GAIN * 0.9, 'sine'); },
    glassTick()  { this.note(980, 0.16, CONFIG.MASTER_GAIN, 'triangle'); },
    lowPulse()   { this.note(120, 0.32, CONFIG.MASTER_GAIN * 0.6, 'sine'); },
    softWhoosh() { this.note(260, 0.26, CONFIG.MASTER_GAIN * 0.4, 'sine'); }
  };

  Audio.unlockOnce();

  /* ----------------------------------------------------------
     PROGRAMMATIC LIGHT
  ---------------------------------------------------------- */
  const Light = (() => {
    const layer = document.createElement('div');
    layer.className = 'blake-light-layer';
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999;
      opacity: 0;
      mix-blend-mode: soft-light;
      will-change: opacity, background-position, background-image;
    `;
    document.body.appendChild(layer);

    function apply(p, sceneMood) {
      const warm = sceneMood === 'fabric';
      const cool = sceneMood === 'glass';
      const chrome = sceneMood === 'chrome';

      const baseWarm = warm ? 0.2 : chrome ? 0.14 : 0.08;
      const baseCool = cool ? 0.2 : chrome ? 0.12 : 0.07;

      const x1 = map(p, 0, 1, 10, 80);
      const y1 = map(Math.sin(p * Math.PI), -1, 1, 35, 65);
      const x2 = map(1 - p, 0, 1, 85, 20);
      const y2 = map(Math.cos(p * Math.PI), -1, 1, 30, 70);

      layer.style.opacity = 0.5;
      layer.style.backgroundImage = `
        radial-gradient(120vmax 80vmax at ${x1}% ${y1}%,
          rgba(255,245,210,${baseWarm}) 0%,
          transparent 60%),
        radial-gradient(90vmax 70vmax at ${x2}% ${y2}%,
          rgba(150,160,255,${baseCool}) 0%,
          transparent 65%)
      `;
    }

    return {
      update(globalProgress, sceneMood) {
        apply(globalProgress, sceneMood || 'chrome');
      }
    };
  })();

  /* ----------------------------------------------------------
     PARALLAX MANAGER
  ---------------------------------------------------------- */
  const Parallax = (() => {
    const layers = [];
    let lastProgress = 0;

    return {
      add(el, depth = 0.5) {
        if (!el) return;
        layers.push({ el, depth });
      },
      update(progress) {
        const delta = progress - lastProgress;
        lastProgress = progress;
        const velocity = clamp(delta * 40, -2, 2);

        layers.forEach(({ el, depth }) => {
          const offset = velocity * depth * 20;
          gsap.to(el, {
            y: offset,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: true
          });
        });
      }
    };
  })();

  /* ----------------------------------------------------------
     MOTIFS
  ---------------------------------------------------------- */
  const Motif = {
    glint(el, strength = 0.28, dur = BEAT * 1.1) {
      if (!el) return gsap.timeline();
      const g = document.createElement('div');
      g.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        mix-blend-mode: screen;
        opacity: 0;
        background: linear-gradient(
          100deg,
          transparent 0%,
          rgba(255,255,255,${strength}) 40%,
          transparent 72%
        );
        transform: translateX(-140%);
      `;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(g);

      const tl = gsap.timeline();
      tl.to(g, {
        x: '240%',
        opacity: 1,
        duration: dur,
        ease: 'power3.inOut'
      }).to(g, {
        opacity: 0,
        duration: dur * 0.35,
        ease: 'power1.out'
      }, '-=0.2')
      .add(() => g.remove());
      return tl;
    },

    sheenCircular(el, strength = 0.18, dur = BEAT * 1.4) {
      if (!el) return gsap.timeline();
      const s = document.createElement('div');
      s.style.cssText = `
        position: absolute;
        inset: 14%;
        border-radius: 50%;
        pointer-events: none;
        mix-blend-mode: screen;
        opacity: 0;
        background:
          conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255,255,255,${strength}) 12deg,
            transparent 30deg
          );
      `;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(s);

      const tl = gsap.timeline();
      tl.to(s, {
        opacity: 0.52,
        rotation: 360,
        duration: dur,
        ease: 'none'
      }).to(s, {
        opacity: 0,
        duration: dur * 0.35,
        ease: 'power1.out'
      }, '-=0.18')
      .add(() => s.remove());
      return tl;
    },

    fabricShear(el, dur = BEAT * 0.9) {
      if (!el) return gsap.timeline();
      const tl = gsap.timeline();
      tl.fromTo(el,
        { skewY: 0.0001 },
        { skewY: 3.4, duration: dur * 0.4, ease: 'power2.in' }
      ).to(el, {
        skewY: 0,
        duration: dur * 0.6,
        ease: 'power3.out'
      });
      return tl;
    }
  };

  /* ----------------------------------------------------------
     SVG CLIP UTIL (for selective wipes)
  ---------------------------------------------------------- */
  function ensureMask(id) {
    let svg = document.getElementById('blake-masks');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'blake-masks';
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.position = 'absolute';
      svg.style.overflow = 'hidden';
      document.body.appendChild(svg);
    }

    const maskId = `mask-${id}`;
    let mask = svg.querySelector(`#${maskId}`);
    if (!mask) {
      mask = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      mask.id = maskId;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', '0');
      r.setAttribute('y', '0');
      r.setAttribute('width', '0');
      r.setAttribute('height', '0');
      mask.appendChild(r);
      svg.appendChild(mask);
    }

    return { id: maskId, rect: mask.firstChild };
  }

  /* ----------------------------------------------------------
     MASTER REEL
  ---------------------------------------------------------- */
  const reel = gsap.timeline({
    paused: true,
    defaults: { ease: 'power4.inOut' }
  });

  let reelEnd = 0;

  function addScene(label, tl, overlapBeats = CONFIG.OVERLAP_BEATS) {
    if (!tl || typeof tl.totalDuration !== 'function') return;
    const d = tl.totalDuration();
    if (!d || d <= 0) return;

    const overlap = Math.max(0, overlapBeats) * BEAT;
    const startTime = Math.max(0, reelEnd - overlap);

    reel.add(label, startTime);
    reel.add(tl, startTime);
    reelEnd = Math.max(reelEnd, startTime + d);
  }

  /* ----------------------------------------------------------
     SCENES — ALL OF THEM
  ---------------------------------------------------------- */

  // HERO
  function heroScene() {
    const sec = $('section[data-scene="hero"]');
    if (!sec) return gsap.timeline();
    const h1 = $('.hero-copy h1', sec);
    const p  = $('.hero-copy p', sec);
    const line = $('.hero-line', sec);

    const tl = gsap.timeline();

    tl.fromTo(sec, { opacity: 0 }, { opacity: 1, duration: BEAT * 0.6 }, 0);

    if (h1) {
      tl.fromTo(h1,
        {
          y: vh() * 0.16,
          opacity: 0,
          rotationX: 78,
          filter: 'blur(20px) brightness(1.9)'
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          filter: 'blur(0) brightness(1)',
          duration: BAR * 0.9
        },
        BEAT * 0.4
      );
      tl.add(Motif.glint(h1, CONFIG.MATERIAL.chrome.glint, BEAT * 1.2), BEAT * 1.1);
    }

    if (p) {
      tl.fromTo(p,
        { y: vh() * 0.06, opacity: 0, filter: 'blur(14px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0)',
          duration: BEAT * 2,
          ease: 'power3.out'
        },
        BEAT * 1.0
      );
    }

    if (line) {
      tl.fromTo(line,
        { scaleX: 0, opacity: 0, transformOrigin: '0% 50%' },
        { scaleX: 1, opacity: 1, duration: BEAT * 1.2 },
        BEAT * 1.4
      );
    }

    tl.add(() => {
      Audio.chromePing();
      Audio.lowPulse();
    }, BEAT * 1.5);

    Parallax.add(sec, 0.32);
    return tl;
  }

  // S63
  function s63Scene() {
    const sec = $('section[data-scene="s63"]');
    if (!sec) return gsap.timeline();
    const frames = $$('.s63', sec);
    const chips  = $$('.spec-chips li', sec);

    const tl = gsap.timeline();

    if (frames.length) {
      tl.set(frames, {
        opacity: 0,
        scale: 1.06,
        rotationY: -22,
        transformPerspective: 900
      });

      // frame 1
      tl.to(frames[0], {
        opacity: 1,
        rotationY: 0,
        scale: 1,
        duration: BEAT * 1.4
      }, 0);
      tl.add(Motif.glint(frames[0], CONFIG.MATERIAL.chrome.glint, BEAT * 0.9), BEAT * 0.4);

      const f2 = frames[1] || frames[0];
      const f3 = frames[2] || f2;

      // frame 1 -> 2
      tl.to(frames[0], {
        opacity: 0,
        rotationY: 18,
        scale: 1.03,
        duration: BEAT * 1.0
      }, BEAT * 1.4);

      tl.to(f2, {
        opacity: 1,
        rotationY: 0,
        duration: BEAT * 1.0
      }, BEAT * 1.4);

      tl.add(Motif.glint(f2, CONFIG.MATERIAL.chrome.glint, BEAT * 0.8), BEAT * 2.0);

      // frame 2 -> 3
      tl.to(f2, {
        opacity: 0,
        y: -vh() * 0.03,
        scale: 0.97,
        rotationY: -10,
        duration: BEAT * 1.2
      }, BEAT * 2.6);

      tl.to(f3, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        duration: BEAT * 1.3
      }, BEAT * 2.6);

      tl.add(Motif.glint(f3, CONFIG.MATERIAL.chrome.glint, BEAT * 1.0), BEAT * 3.3);
    }

    if (chips.length) {
      tl.from(chips, {
        y: 24,
        opacity: 0,
        rotationX: 40,
        transformOrigin: '50% 0%',
        stagger: { each: BEAT * 0.12, from: 'center' },
        duration: BEAT * 0.9
      }, BEAT * 1.8);
    }

    tl.add(() => Audio.chromePing(), BEAT * 0.8);
    Parallax.add(sec, 0.55);
    return tl;
  }

  // DRIVERS
  function driversScene() {
    const sec = $('section[data-scene="drivers"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const blurb = $('.blurb', sec);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();

    tl.fromTo(img,
      {
        scale: 1.16,
        y: vh() * 0.12,
        rotation: -4,
        filter: 'contrast(1.2) saturate(1.15) blur(8px) brightness(0.84)'
      },
      {
        scale: 1,
        y: 0,
        rotation: 0,
        filter: 'contrast(1) saturate(1) blur(0) brightness(1)',
        duration: BAR * 0.9
      },
      0
    );

    if (blurb) {
      tl.fromTo(blurb,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: BEAT * 0.8 },
        BEAT * 0.9
      );
    }

    tl.add(Motif.fabricShear(img, BEAT), BEAT * 0.5);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.6);

    Parallax.add(sec, 0.4);
    return tl;
  }

  // HOODIE
  function hoodieScene() {
    const sec = $('section[data-scene="hoodie"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const blurb = $('.blurb', sec);
    if (!img) return gsap.timeline();
    const tl = gsap.timeline();

    tl.fromTo(img,
      {
        y: -vh() * 0.08,
        scale: 1.14,
        rotation: -5,
        filter: 'brightness(0.82) contrast(1.1)'
      },
      {
        y: 0,
        scale: 1,
        rotation: 0,
        filter: 'brightness(1) contrast(1)',
        duration: BAR * 0.75
      },
      0
    );

    if (blurb) {
      tl.fromTo(blurb,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: BEAT * 0.9 },
        BEAT * 0.6
      );
    }

    tl.add(Motif.fabricShear(img, BEAT * 0.9), BEAT * 0.35);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.4);

    Parallax.add(sec, 0.38);
    return tl;
  }

  // WATCH
  function watchScene() {
    const sec = $('section[data-scene="watch"]');
    if (!sec) return gsap.timeline();
    const img  = $('img', sec);
    const date = $('.date-window', sec);

    const tl = gsap.timeline();

    if (img) {
      tl.fromTo(img,
        {
          scale: 1.08,
          opacity: 0,
          rotationY: -16,
          filter: 'blur(5px)'
        },
        {
          scale: 1,
          opacity: 1,
          rotationY: 0,
          filter: 'blur(0)',
          duration: BEAT * 1.2
        },
        0
      );
    }

    if (date) {
      tl.fromTo(date,
        {
          rotationX: -110,
          opacity: 0,
          scale: 0.7,
          y: 14,
          transformOrigin: '50% 0%'
        },
        {
          rotationX: 0,
          opacity: 1,
          scale: 1,
          y: 0,
          duration: BEAT * 0.9,
          ease: 'back.out(2)'
        },
        BEAT * 0.6
      );
    }

    tl.add(Motif.sheenCircular(sec, CONFIG.MATERIAL.glass.glint, BEAT * 1.4), BEAT * 0.9);
    tl.add(() => {
      Audio.glassTick();
      Audio.lowPulse();
    }, BEAT * 0.9);

    Parallax.add(sec, 0.6);
    return tl;
  }

  // LINEN
  function linenScene() {
    const sec = $('section[data-scene="linen"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('.color-weave img', sec);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();

    tl.from(imgs, {
      xPercent: (i) => (i - Math.floor(imgs.length / 2)) * 105,
      opacity: 0,
      rotationY: 34,
      stagger: { each: BEAT * 0.16, from: 'center' },
      duration: BEAT * 0.9
    }, 0);

    tl.to(imgs, {
      xPercent: -100 * (imgs.length - 1),
      duration: BAR * 2.0,
      ease: 'none',
      modifiers: {
        xPercent: gsap.utils.wrap(-100, 400)
      }
    }, BEAT * 0.7);

    tl.add(() => Audio.fabricSoft(), BEAT * 0.5);
    Parallax.add(sec, 0.32);
    return tl;
  }

  // CLUBMASTER
  function clubmasterScene() {
    const sec = $('section[data-scene="clubmaster"]');
    if (!sec) return gsap.timeline();
    const frame = $('.frame', sec);
    const lens  = $('.lens-bg', sec);

    const tl = gsap.timeline();

    if (frame) {
      tl.fromTo(frame,
        {
          y: 26,
          opacity: 0,
          rotationX: 34,
          transformOrigin: '50% 50%'
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: BEAT * 1.2
        },
        0
      );
    }

    if (lens) {
      tl.fromTo(lens,
        {
          opacity: 0,
          scale: 0.9,
          backgroundPosition: '-130% 0'
        },
        {
          opacity: 0.65,
          scale: 1,
          backgroundPosition: '230% 0',
          duration: BEAT * 1.6
        },
        BEAT * 0.25
      );
    }

    if (frame) {
      frame.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
        const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
        const rx = map(ny, 0, 1, 9, -9);
        const ry = map(nx, 0, 1, -9, 9);
        gsap.to(frame, {
          rotationX: rx,
          rotationY: ry,
          duration: BEAT * 0.45,
          ease: 'power2.out',
          overwrite: true
        });
      });

      frame.addEventListener('mouseleave', () => {
        gsap.to(frame, {
          rotationX: 0,
          rotationY: 0,
          duration: BEAT * 0.8,
          ease: 'elastic.out(1, 0.5)',
          overwrite: true
        });
      });
    }

    tl.add(Motif.glint(frame || sec, CONFIG.MATERIAL.glass.glint, BEAT * 1.0), BEAT * 0.5);
    tl.add(() => Audio.glassTick(), BEAT * 0.6);

    Parallax.add(sec, 0.5);
    return tl;
  }

  // HEROD — vapor + bottle glow
  function herodScene() {
    const sec = $('section[data-scene="herod"]');
    if (!sec) return gsap.timeline();
    const bottle = $('.bottle img', sec);
    const vapor = $('.vapor', sec);
    const blurb = $('.blurb', sec);

    const tl = gsap.timeline();

    if (bottle) {
      tl.fromTo(bottle,
        {
          y: 40,
          opacity: 0,
          scale: 0.96,
          filter: 'blur(4px) saturate(0.9)'
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0) saturate(1)',
          duration: BEAT * 1.1
        },
        0
      );
      tl.add(Motif.glint(bottle, 0.22, BEAT * 0.9), BEAT * 0.4);
    }

    if (vapor) {
      tl.fromTo(vapor,
        { opacity: 0 },
        { opacity: 0.55, duration: BEAT * 1.6, ease: 'power1.out' },
        BEAT * 0.3
      ).to(vapor,
        { opacity: 0.2, duration: BEAT * 2.0, ease: 'power1.inOut' },
        BEAT * 1.8
      );
    }

    if (blurb) {
      tl.fromTo(blurb,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: BEAT * 0.9 },
        BEAT * 0.9
      );
    }

    tl.add(() => Audio.softWhoosh(), BEAT * 0.6);
    Parallax.add(sec, 0.28);
    return tl;
  }

  // CREAM BLAZER — blueprint stitch
  function creamBlazerScene() {
    const sec = $('section[data-scene="creamBlazer"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const stitch = $('.stitch path', sec);

    const tl = gsap.timeline();

    if (img) {
      tl.fromTo(img,
        { opacity: 0, y: 30, scale: 1.02 },
        { opacity: 1, y: 0, scale: 1, duration: BEAT * 1.0 },
        0
      );
      tl.add(Motif.fabricShear(img, BEAT * 0.8), BEAT * 0.4);
    }

    if (stitch) {
      const len = stitch.getTotalLength ? stitch.getTotalLength() : 1200;
      tl.set(stitch, {
        strokeDasharray: len,
        strokeDashoffset: len,
        stroke: 'rgba(255,255,255,0.7)',
        fill: 'transparent'
      }, 0);
      tl.to(stitch, {
        strokeDashoffset: 0,
        duration: BEAT * 1.4,
        ease: 'power2.out'
      }, BEAT * 0.3);
    }

    Parallax.add(sec, 0.34);
    return tl;
  }

  // GG — sneaker pedestal
  function ggScene() {
    const sec = $('section[data-scene="gg"]');
    if (!sec) return gsap.timeline();
    const shoe = $('.gg-shoe', sec);
    const pedestal = $('.gallery-pedestal', sec);

    const tl = gsap.timeline();

    if (shoe) {
      tl.fromTo(shoe,
        {
          y: 40,
          opacity: 0,
          rotation: -6,
          scale: 0.96
        },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
          duration: BEAT * 1.1
        },
        0
      );
      tl.add(Motif.glint(shoe, 0.26, BEAT), BEAT * 0.5);
    }

    if (pedestal) {
      tl.fromTo(pedestal,
        { opacity: 0, scaleX: 0.7 },
        { opacity: 1, scaleX: 1, duration: BEAT * 0.8 },
        BEAT * 0.3
      );
    }

    Parallax.add(sec, 0.35);
    return tl;
  }

  // JOGGERS
  function joggersScene() {
    const sec = $('section[data-scene="joggers"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, y: 40, scale: 1.04 },
      { opacity: 1, y: 0, scale: 1, duration: BEAT * 1.0 },
      0
    );
    tl.add(Motif.fabricShear(img, BEAT * 0.7), BEAT * 0.4);

    Parallax.add(sec, 0.3);
    return tl;
  }

  // CARDIGANS
  function cardigansScene() {
    const sec = $('section[data-scene="cardigans"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('.zip-gallery img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 32,
      stagger: { each: BEAT * 0.14, from: 'center' },
      duration: BEAT * 0.9
    }, 0);

    tl.add(() => Audio.fabricSoft(), BEAT * 0.4);
    Parallax.add(sec, 0.32);
    return tl;
  }

  // BLAZERS
  function blazersScene() {
    const sec = $('section[data-scene="blazers"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('.mannequins img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 40,
      rotationY: -18,
      transformOrigin: '50% 100%',
      stagger: { each: BEAT * 0.12, from: 'center' },
      duration: BEAT * 0.9
    }, 0);

    tl.add(Motif.glint(sec, 0.18, BEAT * 1.0), BEAT * 0.6);
    Parallax.add(sec, 0.45);
    return tl;
  }

  // V-NECKS
  function vnecksScene() {
    const sec = $('section[data-scene="vnecks"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('.vneck-row img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: { each: BEAT * 0.12, from: 'center' },
      duration: BEAT * 0.8
    }, 0);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.3);
    Parallax.add(sec, 0.25);
    return tl;
  }

  // VELVET
  function velvetScene() {
    const sec = $('section[data-scene="velvet"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, scale: 1.06, filter: 'brightness(0.7)' },
      { opacity: 1, scale: 1, filter: 'brightness(1)', duration: BEAT * 1.0 },
      0
    );
    tl.add(Motif.glint(img, 0.22, BEAT * 0.8), BEAT * 0.5);
    Parallax.add(sec, 0.3);
    return tl;
  }

  // CHAINS
  function chainsScene() {
    const sec = $('section[data-scene="chains"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('.chains-row img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 30,
      stagger: { each: BEAT * 0.1, from: 'center' },
      duration: BEAT * 0.8
    }, 0);
    tl.add(Motif.glint(sec, CONFIG.MATERIAL.chrome.glint, BEAT * 0.9), BEAT * 0.4);
    Parallax.add(sec, 0.35);
    return tl;
  }

  // SUITS BLUEPRINT
  function suitsScene() {
    const sec = $('section[data-scene="suits"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, scale: 1.04, filter: 'blur(4px)' },
      { opacity: 1, scale: 1, filter: 'blur(0)', duration: BEAT * 1.0 },
      0
    );
    Parallax.add(sec, 0.32);
    return tl;
  }

  // PURPLE VELVET
  function purpleScene() {
    const sec = $('section[data-scene="purple"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, y: 40, scale: 1.05 },
      { opacity: 1, y: 0, scale: 1, duration: BEAT * 1.0 },
      0
    );
    tl.add(Motif.glint(img, 0.24, BEAT * 0.9), BEAT * 0.4);
    Parallax.add(sec, 0.32);
    return tl;
  }

  // CHINOS + SCARF
  function chinosScene() {
    const sec = $('section[data-scene="chinos"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 32,
      stagger: { each: BEAT * 0.12 },
      duration: BEAT * 0.9
    }, 0);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.4);
    Parallax.add(sec, 0.28);
    return tl;
  }

  // GAMES
  function gamesScene() {
    const sec = $('section[data-scene="games"]');
    if (!sec) return gsap.timeline();
    const covers = $$('.covers img', sec);
    const tl = gsap.timeline();
    if (!covers.length) return tl;

    tl.from(covers, {
      opacity: 0,
      y: 40,
      rotation: -4,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.9
    }, 0);

    Parallax.add(sec, 0.25);
    return tl;
  }

  // ULTIMA
  function ultimaScene() {
    const sec = $('section[data-scene="ultima"]');
    if (!sec) return gsap.timeline();
    const photo = $('.ultima-photo', sec);
    const rail = $('.year-rail', sec);
    const blurb = $('.blurb', sec);

    const tl = gsap.timeline();

    if (photo) {
      tl.fromTo(photo,
        { opacity: 0, y: 40, scale: 1.03 },
        { opacity: 1, y: 0, scale: 1, duration: BEAT * 1.0 },
        0
      );
      tl.add(Motif.glint(photo, CONFIG.MATERIAL.chrome.glint, BEAT * 1.0), BEAT * 0.6);
    }

    if (rail) {
      const spans = $$('span', rail);
      tl.fromTo(rail,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: BEAT * 0.6 },
        BEAT * 0.4
      );
      tl.from(spans, {
        opacity: 0.2,
        color: 'rgba(255,255,255,0.3)',
        stagger: { each: BEAT * 0.12 },
        duration: BEAT * 0.4
      }, BEAT * 0.7);
    }

    if (blurb) {
      tl.fromTo(blurb,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: BEAT * 0.8 },
        BEAT * 0.9
      );
    }

    Parallax.add(sec, 0.4);
    return tl;
  }

  // EXOTICS
  function exoticsScene() {
    const sec = $('section[data-scene="exotics"]');
    if (!sec) return gsap.timeline();
    const ribbon = $('.speed-ribbon', sec);
    const cars = $$('.fleet img', sec);
    const tl = gsap.timeline();

    if (ribbon) {
      tl.fromTo(ribbon,
        { opacity: 0, scaleX: 0.4, xPercent: -40 },
        { opacity: 1, scaleX: 1, xPercent: 0, duration: BEAT * 0.9 },
        0
      );
    }

    if (cars.length) {
      tl.from(cars, {
        opacity: 0,
        y: 40,
        stagger: { each: BEAT * 0.12 },
        duration: BEAT * 0.8
      }, BEAT * 0.2);
    }

    tl.add(() => Audio.softWhoosh(), BEAT * 0.3);
    Parallax.add(sec, 0.45);
    return tl;
  }

  // DESK
  function deskScene() {
    const sec = $('section[data-scene="desk"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.8
    }, 0);

    Parallax.add(sec, 0.3);
    return tl;
  }

  // DUBAI
  function dubaiScene() {
    const sec = $('section[data-scene="dubai"]');
    if (!sec) return gsap.timeline();
    const haze = $('.heat-haze', sec);
    const img = $('img', sec);
    const blurb = $('.blurb', sec);
    const tl = gsap.timeline();

    if (img) {
      tl.fromTo(img,
        { opacity: 0, scale: 1.06, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: BEAT * 1.0 },
        0
      );
    }
    if (haze) {
      tl.fromTo(haze,
        { opacity: 0 },
        { opacity: 0.45, duration: BEAT * 1.2 },
        BEAT * 0.3
      );
    }
    if (blurb) {
      tl.fromTo(blurb,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: BEAT * 0.7 },
        BEAT * 0.7
      );
    }

    Parallax.add(sec, 0.35);
    return tl;
  }

  // SWEATERS / BAG / PEN
  function sweatersBagPenScene() {
    const sec = $('section[data-scene="sweatersbagpen"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();

    tl.from(imgs, {
      opacity: 0,
      y: 24,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.8
    }, 0);

    tl.add(() => Audio.fabricSoft(), BEAT * 0.4);
    Parallax.add(sec, 0.3);
    return tl;
  }

  // FRAGRANCES CONSTELLATION
  function fragsScene() {
    const sec = $('section[data-scene="frags"]');
    if (!sec) return gsap.timeline();
    const canvas = $('.constellation', sec);
    const imgs = $$('.frag-grid img', sec);
    const tl = gsap.timeline();

    if (canvas) {
      tl.fromTo(canvas,
        { opacity: 0 },
        { opacity: 0.6, duration: BEAT * 1.0 },
        0
      );
    }

    if (imgs.length) {
      tl.from(imgs, {
        opacity: 0,
        y: 24,
        stagger: { each: BEAT * 0.1, from: 'center' },
        duration: BEAT * 0.8
      }, BEAT * 0.2);
    }

    Parallax.add(sec, 0.28);
    return tl;
  }

  // UNDERGLOW
  function underglowScene() {
    const sec = $('section[data-scene="underglow"]');
    if (!sec) return gsap.timeline();
    const road = $('.road', sec);
    const img = $('img', sec);
    const tl = gsap.timeline();

    if (road) {
      tl.fromTo(road,
        { opacity: 0, scaleX: 0.5 },
        { opacity: 1, scaleX: 1, duration: BEAT * 0.7 },
        0
      );
    }
    if (img) {
      tl.fromTo(img,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: BEAT * 0.8 },
        BEAT * 0.2
      );
    }

    Parallax.add(sec, 0.35);
    return tl;
  }

  // DJI
  function djiScene() {
    const sec = $('section[data-scene="dji"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const hud = $('.hud', sec);
    const chips = hud ? $$('span', hud) : [];
    const tl = gsap.timeline();

    if (img) {
      tl.fromTo(img,
        { opacity: 0, y: 26, scale: 1.04 },
        { opacity: 1, y: 0, scale: 1, duration: BEAT * 0.9 },
        0
      );
    }

    if (hud) {
      tl.fromTo(hud,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: BEAT * 0.6 },
        BEAT * 0.3
      );
    }
    if (chips.length) {
      tl.from(chips, {
        opacity: 0,
        y: 8,
        stagger: { each: BEAT * 0.1 },
        duration: BEAT * 0.4
      }, BEAT * 0.4);
    }

    Parallax.add(sec, 0.32);
    return tl;
  }

  // EMBODY
  function embodyScene() {
    const sec = $('section[data-scene="embody"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, y: 40, scale: 1.02 },
      { opacity: 1, y: 0, scale: 1, duration: BEAT * 0.9 },
      0
    );
    Parallax.add(sec, 0.28);
    return tl;
  }

  // POLO / TROUSERS
  function poloTrousersScene() {
    const sec = $('section[data-scene="poloTrousers"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();

    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.8
    }, 0);

    Parallax.add(sec, 0.26);
    return tl;
  }

  // FINGEARS
  function fingearsScene() {
    const sec = $('section[data-scene="fingears"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, scale: 0.9, rotation: -8 },
      { opacity: 1, scale: 1, rotation: 0, duration: BEAT * 0.8 },
      0
    );

    Parallax.add(sec, 0.22);
    return tl;
  }

  // P-WATCH / COLLAR CHAIN
  function pwatchScene() {
    const sec = $('section[data-scene="pwatch"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();

    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.8
    }, 0);
    tl.add(Motif.glint(sec, 0.18, BEAT * 0.8), BEAT * 0.5);

    Parallax.add(sec, 0.26);
    return tl;
  }

  // AUDIO SOFTWARE
  function audioSoftScene() {
    const sec = $('section[data-scene="audioSoft"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();

    tl.from(imgs, {
      opacity: 0,
      y: 24,
      stagger: { each: BEAT * 0.1 },
      duration: BEAT * 0.8
    }, 0);

    Parallax.add(sec, 0.24);
    return tl;
  }

  // GEMINI
  function geminiScene() {
    const sec = $('section[data-scene="gemini"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    const tl = gsap.timeline();
    if (!img) return tl;

    tl.fromTo(img,
      { opacity: 0, y: 30, scale: 1.05 },
      { opacity: 1, y: 0, scale: 1, duration: BEAT * 0.9 },
      0
    );

    Parallax.add(sec, 0.24);
    return tl;
  }

  // BONSAI + HEAT PAD
  function bonsaiScene() {
    const sec = $('section[data-scene="bonsai"]');
    if (!sec) return gsap.timeline();
    const imgs = $$('img', sec);
    const tl = gsap.timeline();
    if (!imgs.length) return tl;

    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: { each: BEAT * 0.12 },
      duration: BEAT * 0.8
    }, 0);

    Parallax.add(sec, 0.22);
    return tl;
  }

  // CLOSER
  function closerScene() {
    const sec = $('section.closer');
    if (!sec) return gsap.timeline();
    const h2 = $('h2', sec);
    const actions = $('.actions', sec);

    const tl = gsap.timeline();

    tl.fromTo(sec,
      { opacity: 0 },
      { opacity: 1, duration: BEAT * 0.8 },
      0
    );

    if (h2) {
      tl.fromTo(h2,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: BEAT * 0.9 },
        BEAT * 0.2
      );
    }

    if (actions) {
      tl.fromTo(actions,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: BEAT * 0.8 },
        BEAT * 0.7
      );
    }

    tl.add(() => {
      Audio.lowPulse();
      Audio.fabricSoft();
    }, BEAT * 0.7);

    Parallax.add(sec, 0.18);
    return tl;
  }

  // Optional: S63 -> WATCH wipe already defined as motif
  function carToWatchWipe() {
    const s63 = $('section[data-scene="s63"]');
    const watch = $('section[data-scene="watch"]');
    if (!s63 || !watch) return gsap.timeline();

    const tl = gsap.timeline();
    const { rect, id } = ensureMask('car-watch');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '0');
    rect.setAttribute('height', String(vh() * 1.2));

    s63.style.clipPath = `url(#${id})`;
    watch.style.clipPath = `url(#${id})`;

    tl.to(rect, {
      attr: { width: vw() * 1.4 },
      duration: BEAT * 1.1,
      ease: 'power3.inOut',
      onComplete: () => {
        s63.style.clipPath = '';
        watch.style.clipPath = '';
      }
    }, 0);

    tl.add(() => {
      Audio.chromePing();
      Audio.glassTick();
    }, BEAT * 0.3);

    return tl;
  }

  /* ----------------------------------------------------------
     BUILD MASTER REEL — ORDERED, OVERLAPPED
  ---------------------------------------------------------- */
  addScene('hero',             heroScene(),          0);
  addScene('s63',              s63Scene());
  addScene('drivers',          driversScene());
  addScene('hoodie',           hoodieScene());
  addScene('watch',            watchScene());
  addScene('linen',            linenScene());
  addScene('clubmaster',       clubmasterScene());
  addScene('herod',            herodScene());
  addScene('creamBlazer',      creamBlazerScene());
  addScene('gg',               ggScene());
  addScene('joggers',          joggersScene());
  addScene('cardigans',        cardigansScene());
  addScene('blazers',          blazersScene());
  addScene('vnecks',           vnecksScene());
  addScene('velvet',           velvetScene());
  addScene('chains',           chainsScene());
  addScene('suits',            suitsScene());
  addScene('purple',           purpleScene());
  addScene('chinos',           chinosScene());
  addScene('games',            gamesScene());
  addScene('ultima',           ultimaScene());
  addScene('exotics',          exoticsScene());
  addScene('desk',             deskScene());
  addScene('dubai',            dubaiScene());
  addScene('sweatersbagpen',   sweatersBagPenScene());
  addScene('frags',            fragsScene());
  addScene('underglow',        underglowScene());
  addScene('dji',              djiScene());
  addScene('embody',           embodyScene());
  addScene('poloTrousers',     poloTrousersScene());
  addScene('fingears',         fingearsScene());
  addScene('pwatch',           pwatchScene());
  addScene('audioSoft',        audioSoftScene());
  addScene('gemini',           geminiScene());
  addScene('bonsai',           bonsaiScene());
  addScene('closer',           closerScene());

  // Integrate the special chrome→glass motif between S63 and watch
  addScene('car→watch',        carToWatchWipe(),     CONFIG.OVERLAP_BEATS * 0.7);

  /* ----------------------------------------------------------
     PRELOAD (OPTIONAL FOCUSED LIST)
  ---------------------------------------------------------- */
  const preloadList = []; // Fill with key hero images if desired

  function preloadImages(list) {
    if (!list || !list.length) return Promise.resolve();
    return Promise.all(list.map(src => new Promise(res => {
      const img = new Image();
      img.src = src;
      const done = () => res(src);
      img.onload = done;
      img.onerror = done;
      if (img.decode) img.decode().then(done).catch(done);
    })));
  }

  /* ----------------------------------------------------------
     START — SCROLLTRIGGER + LIGHT/PARALLAX SYNC
  ---------------------------------------------------------- */
  async function start() {
    try {
      await Promise.race([
        preloadImages(preloadList),
        new Promise(res => setTimeout(res, 900))
      ]);
    } catch (e) {
      console.warn('[BlakeReel] Preload warning', e);
    }

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }

    // If duration is suspiciously small, give ScrollTrigger a big fixed runway
   const total = reel.totalDuration() || 12;
   const fallbackEnd = 8000; // px
   const scrollDistance = total < 2
     ? fallbackEnd
     : total * (vh() * CONFIG.MASTER_SCROLL_DENSITY);

   ScrollTrigger.create({
     id: 'reel',
     animation: reel,
     trigger: main,
     start: 'top top',
     end: `+=${scrollDistance}`,
     scrub: 0.9,
     pin: true,
     anticipatePin: 1,
     markers: true, // DEBUG: show start/end & progress

     // DEBUG: do NOT touch body overflow while scroller is the documentElement
     // onEnter: () => { document.body.style.overflow = 'hidden'; },
     // onLeave: () => { document.body.style.overflow = 'auto'; },
     // onLeaveBack: () => { document.body.style.overflow = 'auto'; },

     onUpdate: (self) => {
       const p = self.progress;
       let mood = (p > 0.18 && p < 0.42) ? 'chrome'
               : (p >= 0.42 && p < 0.65) ? 'fabric'
               : (p >= 0.65 && p < 0.88) ? 'glass'
               : 'chrome';
       Light.update(p, mood);
       Parallax.update(p);
     }
   });

   console.log('[BlakeReel] totalDuration:', reel.totalDuration(), 'scrollDistance:', scrollDistance);


    setTimeout(() => ScrollTrigger.refresh(), 80);
  }

  /* ----------------------------------------------------------
     MICRO INTERACTIONS
  ---------------------------------------------------------- */
  function initInteractions() {
    const interactiveElements = $$('.btn, [data-interactive]');

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(el, {
          y: -4,
          scale: 1.05,
          rotation: rand(-1, 1),
          duration: BEAT * 0.6,
          ease: 'back.out(2)',
          overwrite: true,
          filter: 'brightness(1.12) drop-shadow(0 10px 24px rgba(212,175,55,0.32))'
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          y: 0,
          scale: 1,
          rotation: 0,
          duration: BEAT * 0.8,
          ease: 'elastic.out(1, 0.6)',
          overwrite: true,
          filter: 'brightness(1) drop-shadow(0 4px 12px rgba(0,0,0,0.22))'
        });
      });

      el.addEventListener('click', (e) => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.35;

        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transform: scale(0);
          mix-blend-mode: screen;
          opacity: 0.95;
          width: ${size}px;
          height: ${size}px;
          left: ${e.clientX - rect.left - size / 2}px;
          top: ${e.clientY - rect.top - size / 2}px;
          background: radial-gradient(circle,
            rgba(255,255,255,0.96) 0%,
            rgba(212,175,55,0.42) 26%,
            transparent 70%);
        `;

        const cs = getComputedStyle(el);
        if (cs.position === 'static') el.style.position = 'relative';

        el.appendChild(ripple);

        gsap.to(ripple, {
          scale: 2.4,
          opacity: 0,
          duration: BEAT * 1.6,
          ease: 'power3.out',
          onComplete: () => ripple.remove()
        });

        Audio.chromePing();
      });
    });

    const nav = $('.nav');
    if (nav) {
      window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY || 0) > 40;
        gsap.to(nav, {
          background: scrolled
            ? 'rgba(8,8,8,0.96)'
            : 'rgba(8,8,8,0.76)',
          padding: scrolled
            ? '0.9rem 1.7rem'
            : '1.2rem 1.7rem',
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true
        });
      }, { passive: true });
    }
  }

  /* ----------------------------------------------------------
     PERFORMANCE & SAFETY
  ---------------------------------------------------------- */
  function initPerformance() {
    window.addEventListener('beforeunload', () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      if (lenis) lenis.destroy();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        gsap.globalTimeline.pause();
      } else {
        gsap.globalTimeline.resume();
        AudioCtx.resume();
      }
    });

    window.addEventListener('error', (e) => {
      console.error('[BlakeReel] Runtime error:', e.message || e.error || e);
    });
  }

  /* ----------------------------------------------------------
     VARIANT FLAG
  ---------------------------------------------------------- */
  (function applyVariant() {
    if (CONFIG.VARIANT === 'lite') {
      document.documentElement.classList.add('blake-lite');
    } else {
      document.documentElement.classList.remove('blake-lite');
    }
  })();

  /* ----------------------------------------------------------
     RUN
  ---------------------------------------------------------- */
  await start();
  initInteractions();
  initPerformance();

  console.log('🎬 Blake — Ultra Cinematic Scroll Film Initialized (All scenes wired)');
});
