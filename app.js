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

  const main = document.querySelector('main');
  if (!main) {
    console.error('[BlakeReel] <main> not found');
    return;
  }

  /* ----------------------------------------------------------
     CONFIG — NO MAGIC NUMBERS
  ---------------------------------------------------------- */
  const vw = () => Math.max(window.innerWidth, 1);
  const vh = () => Math.max(window.innerHeight, 1);

  const CONFIG = {
    PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2),
    VARIANT: vw() >= 1280 ? 'full' : 'lite',        // full experience vs tuned-down
    BPM: 96,                                        // global musical grid
    BEATS_PER_BAR: 4,
    TIME_SCALE: 1,
    OVERLAP_BEATS: 1.5,                             // how much scenes overlap
    MASTER_SCROLL_DENSITY: 0.92,                    // scroll px per sec factor
    MASTER_GAIN: 0.09,
    MATERIAL: {
      chrome: { glint: 0.30 },
      glass:  { glint: 0.24 },
      fabric: { shear: 0.18 }
    }
  };

  const BEAT = 60 / CONFIG.BPM;                     // seconds per beat
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
     LENIS + SCROLLER PROXY (SMOOTH + PIN-SAFE)
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
     AUDIO ENGINE — SINGLE CONTEXT, BPM-LOCKED, MATERIAL TONES
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
    chromePing() { this.note(1400, 0.12, CONFIG.MASTER_GAIN * 1.1, 'sine'); },
    fabricSoft() { this.note(520, 0.18, CONFIG.MASTER_GAIN * 0.9, 'sine'); },
    glassTick() { this.note(980, 0.14, CONFIG.MASTER_GAIN, 'triangle'); },
    lowPulse()  { this.note(120, 0.25, CONFIG.MASTER_GAIN * 0.6, 'sine'); }
  };

  Audio.unlockOnce();

  /* ----------------------------------------------------------
     PROGRAMMATIC LIGHT — TRAVELING KEY LIGHT
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
      // p in [0,1]
      const warm = sceneMood === 'fabric';
      const cool = sceneMood === 'glass';
      const chrome = sceneMood === 'chrome';

      const baseWarm = warm ? 0.18 : chrome ? 0.13 : 0.08;
      const baseCool = cool ? 0.17 : chrome ? 0.11 : 0.07;

      const x1 = map(p, 0, 1, 8, 78);
      const y1 = map(Math.sin(p * Math.PI), -1, 1, 40, 60);
      const x2 = map(1 - p, 0, 1, 88, 18);
      const y2 = map(Math.cos(p * Math.PI), -1, 1, 32, 68);

      const o = 0.45;

      layer.style.opacity = o;
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
     PARALLAX MANAGER — DRIVEN BY REEL PROGRESS + VELOCITY
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
        const velocity = clamp(delta * 40, -2, 2); // tuned

        layers.forEach(({ el, depth }) => {
          const offset = velocity * depth * 18; // px
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
     MOTIFS — GLINTS / SHEENS / SHEAR (REUSABLE)
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
          rgba(255,255,255,${strength}) 45%,
          transparent 70%
        );
        transform: translateX(-130%);
      `;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(g);

      const tl = gsap.timeline();
      tl.to(g, {
        opacity: 1,
        xPercent: 240,
        duration: dur,
        ease: 'power3.inOut'
      }).to(g, {
        opacity: 0,
        duration: dur * 0.35,
        ease: 'power1.out'
      }, '-=0.22')
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
            rgba(255,255,255,${strength}) 10deg,
            transparent 26deg
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
        { skewY: 3.6, duration: dur * 0.4, ease: 'power2.in' }
      ).to(el, {
        skewY: 0,
        duration: dur * 0.6,
        ease: 'power3.out'
      });
      return tl;
    }
  };

  /* ----------------------------------------------------------
     SVG MASK UTIL — FOR WIPES
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

    return {
      id: maskId,
      rect: mask.firstChild
    };
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
     SCENES — EACH FULLY COMPOSED, NO DEAD AIR
  ---------------------------------------------------------- */

  // HERO
  function heroScene() {
    const sec = $('section[data-scene="hero"]');
    if (!sec) return gsap.timeline();
    const h1 = $('.hero-copy h1', sec);
    const p  = $('.hero-copy p', sec);
    const line = $('.hero-line', sec);

    const tl = gsap.timeline();

    tl.fromTo(sec, { opacity: 0 }, { opacity: 1, duration: BEAT * 0.5, ease: 'power2.out' }, 0);

    if (h1) {
      tl.fromTo(h1,
        {
          y: vh() * 0.14,
          opacity: 0,
          rotationX: 78,
          filter: 'blur(20px) brightness(1.8)',
          transformOrigin: '50% 0%'
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          filter: 'blur(0px) brightness(1)',
          duration: BAR * 0.9,
          ease: 'power4.out'
        },
        BEAT * 0.5
      );
      tl.add(Motif.glint(h1, CONFIG.MATERIAL.chrome.glint, BEAT * 1.3), BEAT * 1.2);
    }

    if (p) {
      tl.fromTo(p,
        {
          y: vh() * 0.06,
          opacity: 0,
          filter: 'blur(12px)'
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: BEAT * 2,
          ease: 'power3.out'
        },
        BEAT * 1.3
      );
    }

    if (line) {
      tl.fromTo(line,
        {
          scaleX: 0,
          transformOrigin: '0% 50%',
          opacity: 0
        },
        {
          scaleX: 1,
          opacity: 1,
          duration: BEAT * 1.4,
          ease: 'power3.out'
        },
        BEAT * 1.6
      );
    }

    tl.add(() => {
      Audio.chromePing();
      Audio.lowPulse();
    }, BEAT * 1.5);

    Parallax.add(sec, 0.35);
    return tl;
  }

  // S63 — CHROME / SPEED / GLINT CHOREOGRAPHY
  function s63Scene() {
    const sec = $('section[data-scene="s63"]');
    if (!sec) return gsap.timeline();
    const frames = $$('.s63', sec);
    const chips  = $$('.spec-chips li', sec);

    const tl = gsap.timeline();

    if (frames.length) {
      tl.set(frames, {
        opacity: 0,
        scale: 1.08,
        rotationY: -22,
        transformPerspective: 900,
        transformOrigin: '50% 50%'
      });

      // frame 1 in
      tl.to(frames[0], {
        opacity: 1,
        rotationY: 0,
        scale: 1,
        duration: BEAT * 1.4,
        ease: 'power3.out'
      }, 0);

      tl.add(Motif.glint(frames[0], CONFIG.MATERIAL.chrome.glint, BEAT * 0.9), BEAT * 0.4);

      // frame 1 -> frame 2
      const f1 = frames[0];
      const f2 = frames[1] || frames[0];
      tl.to(f1, {
        opacity: 0,
        rotationY: 18,
        scale: 1.04,
        duration: BEAT * 1.0,
        ease: 'power2.inOut'
      }, BEAT * 1.4);

      tl.to(f2, {
        opacity: 1,
        rotationY: 0,
        y: 0,
        duration: BEAT * 1.0,
        ease: 'power2.out'
      }, BEAT * 1.4);

      tl.add(Motif.glint(f2, CONFIG.MATERIAL.chrome.glint, BEAT * 0.8), BEAT * 2.0);

      // frame 2 -> frame 3
      const f3 = frames[2] || f2;
      tl.to(f2, {
        opacity: 0,
        y: -vh() * 0.03,
        scale: 0.96,
        rotationY: -10,
        duration: BEAT * 1.2,
        ease: 'power3.inOut'
      }, BEAT * 2.6);

      tl.to(f3, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        duration: BEAT * 1.3,
        ease: 'power4.out'
      }, BEAT * 2.6);

      tl.add(Motif.glint(f3, CONFIG.MATERIAL.chrome.glint, BEAT * 1.0), BEAT * 3.3);
    }

    if (chips.length) {
      tl.from(chips, {
        y: 26,
        opacity: 0,
        rotationX: 48,
        transformOrigin: '50% 0%',
        stagger: {
          each: BEAT * 0.12,
          from: 'center'
        },
        duration: BEAT * 0.8,
        ease: 'back.out(1.7)'
      }, BEAT * 1.8);
    }

    tl.add(() => {
      Audio.chromePing();
    }, BEAT * 0.8);

    Parallax.add(sec, 0.55);
    return tl;
  }

  // DRIVERS — SOFT FABRIC + SAND
  function driversScene() {
    const sec = $('section[data-scene="drivers"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();

    tl.fromTo(img,
      {
        scale: 1.16,
        y: vh() * 0.12,
        rotation: -4,
        filter: 'contrast(1.25) saturate(1.18) blur(8px) brightness(0.86)',
        transformOrigin: '50% 100%'
      },
      {
        scale: 1,
        y: 0,
        rotation: 0,
        filter: 'contrast(1) saturate(1) blur(0px) brightness(1)',
        duration: BAR * 0.9,
        ease: 'power4.out'
      },
      0
    );

    tl.add(Motif.fabricShear(img, BEAT), BEAT * 0.6);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.7);

    Parallax.add(sec, 0.4);
    return tl;
  }

  // HOODIE — CASHMERE UNFOLD
  function hoodieScene() {
    const sec = $('section[data-scene="hoodie"]');
    if (!sec) return gsap.timeline();
    const img = $('img', sec);
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
        duration: BAR * 0.75,
        ease: 'power3.out'
      },
      0
    );

    tl.add(Motif.fabricShear(img, BEAT * 0.9), BEAT * 0.35);
    tl.add(() => Audio.fabricSoft(), BEAT * 0.4);

    Parallax.add(sec, 0.38);
    return tl;
  }

  // WATCH — MECHANICAL PRECISION
  function watchScene() {
    const sec = $('section[data-scene="watch"]');
    if (!sec) return gsap.timeline();
    const img  = $('img', sec);
    const date = $('.date-window', sec);

    const tl = gsap.timeline();

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
        filter: 'blur(0px)',
        duration: BEAT * 1.2,
        ease: 'power3.out'
      },
      0
    );

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

  // LINEN — COLOR FIELD FLOW
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
      stagger: {
        each: BEAT * 0.16,
        from: 'center'
      },
      duration: BEAT * 0.9,
      ease: 'power3.out'
    }, 0);

    tl.to(imgs, {
      xPercent: -100 * (imgs.length - 1),
      duration: BAR * 2.1,
      ease: 'none',
      modifiers: {
        xPercent: gsap.utils.wrap(-100, 400)
      }
    }, BEAT * 0.7);

    tl.add(() => Audio.fabricSoft(), BEAT * 0.5);

    Parallax.add(sec, 0.32);
    return tl;
  }

  // CLUBMASTER — GLASS & GOLD
  function clubmasterScene() {
    const sec = $('section[data-scene="clubmaster"]');
    if (!sec) return gsap.timeline();
    const frame = $('.frame', sec);
    const lens  = $('.lens-bg', sec);

    const tl = gsap.timeline();

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
        duration: BEAT * 1.2,
        ease: 'power4.out'
      },
      0
    );

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
          duration: BEAT * 1.6,
          ease: 'power2.inOut'
        },
        BEAT * 0.25
      );
    }

    // interactive tilt with inertia-like feel
    if (frame) {
      const setRX = gsap.quickSetter(frame, 'rotationX', 'deg');
      const setRY = gsap.quickSetter(frame, 'rotationY', 'deg');
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

  // CHROME TO GLASS WIPE (S63 -> WATCH)
  function carToWatchWipe() {
    const s63  = $('section[data-scene="s63"]');
    const watch = $('section[data-scene="watch"]');
    if (!s63 || !watch) return gsap.timeline();

    const tl = gsap.timeline();

    const { rect, id } = ensureMask('car-watch');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '0');
    rect.setAttribute('height', String(vh() * 1.2));

    s63.style.clipPath   = `url(#${id})`;
    watch.style.clipPath = `url(#${id})`;

    tl.to(rect, {
      attr: { width: vw() * 1.4 },
      duration: BEAT * 1.2,
      ease: 'power3.inOut',
      onUpdate: () => {},
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
     BUILD MASTER REEL — ALL CONNECTED, NO GAPS
  ---------------------------------------------------------- */
  addScene('hero',       heroScene(),          0);
  addScene('s63',        s63Scene());
  addScene('drivers',    driversScene());
  addScene('hoodie',     hoodieScene());
  addScene('watch',      watchScene());
  addScene('linen',      linenScene());
  addScene('clubmaster', clubmasterScene());
  addScene('car→watch',  carToWatchWipe(),    CONFIG.OVERLAP_BEATS * 0.7);

  /* ----------------------------------------------------------
     PRELOAD (OPTIONAL: FILL WITH USED ASSETS)
  ---------------------------------------------------------- */
  const preloadList = []; // For perfection, include only actually-used image URLs

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
     START — SCROLLTRIGGER + LIGHT + PARALLAX SYNC
  ---------------------------------------------------------- */
  async function start() {
    try {
      await Promise.race([
        preloadImages(preloadList),
        new Promise(res => setTimeout(res, 1000))
      ]);
    } catch (e) {
      console.warn('[BlakeReel] Preload warning', e);
    }

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }

    const total = reel.totalDuration() || 12;
    const scrollDistance =
      total * (vh() * CONFIG.MASTER_SCROLL_DENSITY);

    ScrollTrigger.create({
      animation: reel,
      trigger: main,
      start: 'top top',
      end: `+=${scrollDistance}`,
      scrub: 0.9,
      pin: true,
      anticipatePin: 1,
      onEnter: () => { document.body.style.overflow = 'hidden'; },
      onLeave: () => { document.body.style.overflow = 'auto'; },
      onLeaveBack: () => { document.body.style.overflow = 'auto'; },
      onUpdate: (self) => {
        const p = self.progress;
        // Global light mood: blend based on position in reel
        let mood = 'chrome';
        if (p > 0.18 && p < 0.42) mood = 'chrome';
        else if (p >= 0.42 && p < 0.6) mood = 'fabric';
        else if (p >= 0.6 && p < 0.8) mood = 'glass';
        else mood = 'chrome';

        Light.update(p, mood);
        Parallax.update(p);
      },
      onRefresh: () => {
        // Keep layout/scroll mapping tight
      }
    });

    setTimeout(() => ScrollTrigger.refresh(), 80);
  }

  /* ----------------------------------------------------------
     MICRO INTERACTIONS — CONSISTENT SPRING FEEL
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

    // Nav morph on scroll
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
     ADAPTIVE VARIANT HOOK
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

  console.log('🎬 Blake — Ultra Cinematic Scroll Film Initialized');
});
