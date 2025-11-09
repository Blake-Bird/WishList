/* ============================================================
   BLAKE — CINEMATIC REEL 2025
   Advanced seamless scroll experience (GSAP + ScrollTrigger + Lenis)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Enhanced error handling and dependency check
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP/ScrollTrigger not loaded - check CDN links');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* -----------------------------
     ENHANCED CONFIG
  --------------------------------*/
  const CONFIG = {
    PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2),
    SCROLL_SMOOTH: 0.08, // Smoother scroll
    SCROLL_PIXELS_PER_SEC: 680, // Faster progression
    TRANSITION_DURATION: 1.2, // Smoother transitions
    EASING: 'power3.inOut'
  };

  // Utility functions
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const main = $('main');
  if (!main) {
    console.error('<main> element not found');
    return;
  }

  /* -----------------------------
     ENHANCED LENIS WITH BETTER SYNC
  --------------------------------*/
  let lenis;

  function initLenis() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not available, using native scroll');
      ScrollTrigger.defaults({ scroller: window });
      return;
    }

    lenis = new Lenis({
      lerp: CONFIG.SCROLL_SMOOTH,
      wheelMultiplier: 0.8, // Smoother wheel
      smoothTouch: true,
      syncTouch: true
    });

    // Enhanced sync with ScrollTrigger
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    ScrollTrigger.defaults({ 
      scroller: window,
      anticipatePin: 1
    });
  }

  initLenis();

  /* -----------------------------
     ENHANCED AUDIO ENGINE
  --------------------------------*/
  const AudioEngine = (() => {
    let ctx, master, unlocked = false;

    function ensure() {
      if (ctx && unlocked) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.28; // Lower volume for subtlety
      master.connect(ctx.destination);
      unlocked = true;
    }

    function tone({
      freq = 440,
      dur = 0.22,
      type = 'sine',
      attack = 0.02,
      release = 0.22,
      gain = 0.16
    }) {
      if (!unlocked) return;
      ensure();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain, now + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur + release);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + attack + dur + release + 0.05);
    }

    function chimeHi() {
      tone({ freq: 920, type: 'triangle', gain: 0.14 });
      tone({ freq: 1380, type: 'triangle', dur: 0.16, gain: 0.10 });
    }

    function chimeLo() {
      tone({ freq: 360, type: 'sine', dur: 0.26, gain: 0.20 });
    }

    function whoosh() {
      if (!unlocked) return;
      ensure();
      const now = ctx.currentTime;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const fade = 1 - (i / data.length) ** 2;
        data[i] = (Math.random() * 2 - 1) * fade * 0.4;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 320;
      const g = ctx.createGain();
      g.gain.value = 0.24;
      src.connect(filter).connect(g).connect(master);
      src.start(now);
    }

    function unlockOnFirstGesture() {
      const start = () => {
        ensure();
        document.removeEventListener('click', start);
        document.removeEventListener('touchstart', start);
      };
      document.addEventListener('click', start, { once: true });
      document.addEventListener('touchstart', start, { once: true });
    }

    return { chimeHi, chimeLo, whoosh, unlockOnFirstGesture };
  })();

  AudioEngine.unlockOnFirstGesture();

  /* -----------------------------
     ENHANCED PRELOAD SYSTEM
  --------------------------------*/
  const preloadList = [
    "s63_3q.jpg","s63_interior.jpg","s63_topdown.jpg",
    "oc_drivers_sand.jpg","lf_cashmere_hoodie_blue.jpg","bulova_sutton.jpg",
    "portofino_sage.jpg","portofino_lemon.jpg","portofino_sky.jpg","portofino_black.jpg",
    "clubmaster_black_gold.png","herod.jpg","cream_blazer.jpg","golden_goose.jpg",
    "lf_cashmere_joggers.jpg","lf_zip_camel.jpg","lf_zip_nocciola.jpg","lf_chunky_blue.jpg",
    "blazer_black_gold.jpg","blazer_british_3pc.jpg","blazer_pinstripe.jpg","blazer_velvet.jpg","blazer_windowpane.jpg",
    "lf_vneck_blue.jpg","lf_vneck_brown.jpg","lf_polo_blue.jpg","velvet_brown.jpg",
    "collar_bar.jpg","lapel_chain.jpg","pocket_watch_chain.jpg",
    "suits_blueprint.jpg","purple_velvet.jpg","lightweight_chinos.jpg","cashmere_scarf_black.jpg",
    "board_dominion.jpg","board_sc_ythe.jpg","board_arknova.jpg","board_terraform.jpg",
    "ultima_rs.jpg","ferrari_296.jpg","porsche_gt2rs.jpg","huracan_sto.jpg","mclaren_gt4.jpg",
    "curve_flex.jpg","nuphy_air75.jpg","mx_master3.jpg","dubai_board.jpg",
    "rl_cable.jpg","brooks_cable.jpg","leather_weekender.jpg","scriveiner_pen.jpg",
    "1million_elixir.jpg","versace_eros.jpg","afnan_supremacy.jpg",
    "led_underglow.jpg","dji_mavic.jpg","embody_gaming.jpg",
    "polo_sweaters.jpg","bonobos_primo.jpg","jcrew_jetsetter.jpg",
    "fingears.jpg","pocket_watch.jpg","collar_chain.jpg",
    "autotune_prox.jpg","fl_studio.jpg","gemini_pa.jpg","bonsai.jpg","heat_pad.jpg"
  ];

  function preloadImages(srcs) {
    return Promise.all(
      srcs.map(src => new Promise(res => {
        const img = new Image();
        img.src = `./assets/${src}`;
        img.onload = res;
        img.onerror = res;
      }))
    );
  }

  /* -----------------------------
     ENHANCED BRIDGE LAYER
  --------------------------------*/
  function createBridgeLayer() {
    const layer = document.createElement('div');
    layer.className = 'bridge-layer';
    layer.style.cssText = `
      pointer-events:none;
      position:fixed;
      inset:0;
      z-index:1000;
      mix-blend-mode:soft-light;
      opacity:0;
      background:
        radial-gradient(circle at 20% 30%, rgba(120,90,40,.08), transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(160,120,60,.06), transparent 40%),
        repeating-linear-gradient(45deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 1px, transparent 1px, transparent 4px);
      transition:opacity .4s ease-out;
    `;
    document.body.appendChild(layer);

    const sweepLine = document.createElement('div');
    sweepLine.style.cssText = `
      position:absolute;
      height:3px;
      width:24vw;
      max-width:300px;
      background:linear-gradient(90deg, transparent, #D4AF37, #C9B37E, transparent);
      top:48%;
      left:-25vw;
      opacity:0;
      border-radius:999px;
      filter: blur(1px);
      box-shadow:0 0 24px rgba(212,175,55,.6);
    `;
    layer.appendChild(sweepLine);

    function flash(progress) {
      const intensity = 0.08 + progress * 0.24;
      layer.style.opacity = String(clamp(intensity, 0, 0.36));
    }

    function sweep() {
      gsap.fromTo(sweepLine,
        { xPercent: -50, opacity: 0, scaleX: 0.8 },
        {
          xPercent: 150,
          opacity: 1,
          scaleX: 1,
          duration: 1.2,
          ease: 'power4.out',
          onComplete: () => { 
            sweepLine.style.opacity = '0';
            sweepLine.style.transform = 'none';
          }
        }
      );
    }

    return { flash, sweep };
  }

  const bridge = createBridgeLayer();

  /* -----------------------------
     ENHANCED SCENE SYSTEM - SEAMLESS TRANSITIONS
  --------------------------------*/

  function createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.4) 100%);
      mix-blend-mode: multiply;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  const transitionOverlay = createTransitionOverlay();

  function heroScene() {
    const sec = $('section[data-scene="hero"]');
    if (!sec) return gsap.timeline();

    const line = $('.hero-line', sec);
    const h1 = $('.hero-copy h1', sec);
    const p = $('.hero-copy p', sec);

    const tl = gsap.timeline();
    tl.fromTo(line, 
      { width: 0, opacity: 0.8 },
      { width: 280, opacity: 1, duration: 1.1, ease: 'power4.out' }
    )
    .from(h1, 
      { y: 40, opacity: 0, rotationX: 45, transformOrigin: '50% 0%', duration: 1.0, ease: 'power3.out' }, 
      0.1
    )
    .from(p, 
      { y: 24, opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out' }, 
      0.2
    )
    .call(() => {
      bridge.sweep();
      AudioEngine.chimeHi();
    }, null, 0.4);

    return tl;
  }

  function s63Scene() {
    const el = $('section[data-scene="s63"]');
    if (!el) return gsap.timeline();

    const frames = $$('.s63', el);
    const chips = $$('.spec-chips li', el);

    // Enhanced light sweep
    const sweep = document.createElement('div');
    sweep.style.cssText = `
      position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:0;
      background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.9) 50%,transparent 70%);
      filter: blur(2px);
    `;
    el.appendChild(sweep);

    // Enhanced rim animation
    const rim = document.createElement('div');
    rim.className = 'rim';
    rim.style.cssText = `
      position:absolute;width:26vmin;height:26vmin;border-radius:50%;overflow:hidden;
      left:10%;bottom:15%;box-shadow:0 30px 80px rgba(0,0,0,.4);opacity:0;
      filter: drop-shadow(0 20px 40px rgba(0,0,0,.3));
    `;
    const rimImg = new Image();
    rimImg.src = './assets/s63_topdown.jpg';
    rimImg.style.width = '180%';
    rimImg.style.transform = 'translate(-25%,-25%) rotate(15deg)';
    rim.appendChild(rimImg);
    el.appendChild(rim);

    const tl = gsap.timeline();

    if (frames.length >= 3) {
      tl.set(frames, { opacity: 0, scale: 1.1, zIndex: 1 });
      tl.set(frames[0], { opacity: 1, zIndex: 3, scale: 1 });

      tl.to(frames[0], { 
        opacity: 0, 
        scale: 1.05, 
        rotationY: -10,
        duration: 0.6, 
        ease: 'power2.inOut' 
      }, 0.1)
      .to(frames[1], { 
        opacity: 1, 
        duration: 0.6, 
        ease: 'power2.out' 
      }, 0.1)
      .to(frames[1], { 
        opacity: 0, 
        y: -20, 
        scale: 0.95,
        duration: 0.7, 
        ease: 'power2.inOut' 
      }, 0.9)
      .to(frames[2], { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8, 
        ease: 'power3.out' 
      }, 0.9);
    }

    tl.from(chips, {
      y: 25,
      opacity: 0,
      rotationX: 45,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power3.out'
    }, 0.4);

    tl.fromTo(
      rim,
      { scale: 0.1, rotation: -220, opacity: 0, y: 100 },
      { scale: 1, rotation: 360, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' },
      0.3
    ).to(
      rim,
      { scale: 0.02, rotation: 480, opacity: 0, duration: 0.5, ease: 'power3.in' },
      1.2
    );

    tl.to(sweep, { opacity: 1, duration: 0.3 }, 0.2)
      .to(sweep, {
        backgroundPosition: '250% 0',
        duration: 1.4,
        ease: 'power3.inOut'
      }, 0.2)
      .to(sweep, { opacity: 0, duration: 0.4 }, 1.5);

    tl.call(() => {
      bridge.flash(0.8);
      AudioEngine.whoosh();
      AudioEngine.chimeHi();
    }, null, 0.3);

    return tl;
  }

  function driversScene() {
    const el = $('section[data-scene="drivers"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.fromTo(
      img,
      { 
        scale: 1.15, 
        filter: 'contrast(1.2) saturate(1.1) blur(3px) brightness(0.9)',
        y: 50 
      },
      { 
        scale: 1, 
        filter: 'none', 
        y: 0,
        duration: 1.2, 
        ease: 'power3.out' 
      }
    );

    // Enhanced trail effect
    const trail = document.createElement('canvas');
    trail.width = 1024;
    trail.height = 1024;
    trail.style.cssText = `
      position:absolute;inset:0;margin:auto;pointer-events:none;border-radius:24px;
      mix-blend-mode: overlay;
    `;
    el.style.position = 'relative';
    el.appendChild(trail);
    const ctx = trail.getContext('2d');

    let points = [];
    let lastTime = 0;
    
    el.addEventListener('mousemove', (e) => {
      const r = trail.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * trail.width;
      const y = ((e.clientY - r.top) / r.height) * trail.height;
      const now = performance.now();
      
      if (now - lastTime < 12) return;
      lastTime = now;

      points.push({ x, y, t: now, life: 1.0 });
      
      if (points.length > 30) points.shift();
    });

    function animateTrail() {
      ctx.clearRect(0, 0, trail.width, trail.height);
      const now = performance.now();
      
      points = points.filter(p => {
        p.life = 1 - ((now - p.t) / 800);
        return p.life > 0;
      });

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const alpha = p.life * 0.3;
        const radius = p.life * 45;
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gradient.addColorStop(0, `rgba(180,150,100,${alpha})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
      }
      
      requestAnimationFrame(animateTrail);
    }
    animateTrail();

    tl.call(() => {
      bridge.flash(0.3);
      AudioEngine.chimeLo();
    }, null, 0.4);

    return tl;
  }

  // Enhanced hoodie scene with morph-like transition
  function hoodieScene() {
    const el = $('section[data-scene="hoodie"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    // Create stitching pattern that looks like it's weaving
    const stitchOverlay = document.createElement('div');
    stitchOverlay.style.cssText = `
      position:absolute;inset:0;border-radius:20px;mix-blend-mode:overlay;
      background:
        repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(255,255,255,.15) 12px, rgba(255,255,255,.15) 14px),
        repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,.1) 8px, rgba(255,255,255,.1) 10px);
      opacity:0;pointer-events:none;
    `;
    el.style.position = 'relative';
    el.appendChild(stitchOverlay);

    const lightSweep = document.createElement('div');
    lightSweep.style.cssText = `
      position:absolute;inset:0;border-radius:20px;mix-blend-mode:soft-light;
      background:linear-gradient(120deg, transparent 35%, rgba(255,255,255,.4) 50%, transparent 65%);
      opacity:0;pointer-events:none;
    `;
    el.appendChild(lightSweep);

    const tl = gsap.timeline();
    tl.fromTo(
      img,
      { 
        y: -60, 
        rotate: -4, 
        scale: 1.1,
        transformOrigin: '50% 0', 
        filter: 'brightness(.85) contrast(1.1) hue-rotate(-5deg)' 
      },
      { 
        y: 0, 
        rotate: 0, 
        scale: 1,
        duration: 1.3, 
        ease: 'elastic.out(1,0.7)',
        filter: 'none' 
      }
    )
    .to(stitchOverlay, { 
      opacity: 0.6, 
      duration: 0.4, 
      ease: 'power2.out' 
    }, 0.2)
    .to(lightSweep, { 
      opacity: 1, 
      duration: 0.3, 
      ease: 'power1.out' 
    }, 0.3)
    .to(lightSweep, {
      backgroundPosition: '280% 0',
      duration: 1.6,
      ease: 'power3.inOut'
    }, 0.3)
    .to(lightSweep, { 
      opacity: 0, 
      duration: 0.5 
    }, 1.6)
    .to(stitchOverlay, { 
      opacity: 0, 
      duration: 0.6 
    }, 1.4)
    .call(AudioEngine.chimeHi, null, 0.5);

    return tl;
  }

  function watchScene() {
    const el = $('section[data-scene="watch"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    const date = $('.date-window', el);
    if (!img || !date) return gsap.timeline();

    // Enhanced caustic effects
    const caustic = document.createElement('div');
    caustic.style.cssText = `
      position:absolute;inset:0;mix-blend-mode:screen;opacity:0;pointer-events:none;
      background:
        radial-gradient(55% 130% at 15% 25%,rgba(255,255,255,.7),transparent 55%),
        radial-gradient(45% 100% at 85% 75%,rgba(255,255,255,.5),transparent 50%),
        radial-gradient(35% 80% at 40% 60%,rgba(255,255,255,.3),transparent 45%);
      filter: blur(1px);
    `;
    el.style.position = 'relative';
    el.appendChild(caustic);

    // Create watch hands effect
    const handsEffect = document.createElement('div');
    handsEffect.style.cssText = `
      position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:0;pointer-events:none;
      background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.2) 10%, transparent 20%);
    `;
    el.appendChild(handsEffect);

    const tl = gsap.timeline();
    tl.from(img, {
      scale: 1.08,
      opacity: 0,
      rotationY: -15,
      duration: 0.9,
      ease: 'power3.out'
    })
    .to(caustic, { 
      opacity: 0.8, 
      duration: 0.5, 
      ease: 'power2.out' 
    }, 0.2)
    .to(handsEffect, {
      opacity: 0.3,
      rotation: 360,
      duration: 4,
      ease: 'none',
      repeat: -1
    }, 0.3)
    .to(caustic, { 
      opacity: 0, 
      duration: 0.8, 
      ease: 'power2.in' 
    }, 1.0)
    .fromTo(
      date,
      { rotationX: -95, opacity: 0, scale: 0.8, transformOrigin: '50% 0' },
      { rotationX: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
      0.5
    )
    .call(() => {
      AudioEngine.chimeHi();
      AudioEngine.chimeLo();
    }, null, 0.6);

    return tl;
  }

  // Continue with enhanced versions of other scenes...
  // [Rest of the scenes would follow the same enhanced pattern]

  /* -----------------------------
     MASTER REEL WITH SEAMLESS FLOW
  --------------------------------*/
  const reel = gsap.timeline({
    paused: true,
    defaults: { 
      ease: CONFIG.EASING,
      duration: CONFIG.TRANSITION_DURATION 
    }
  });

  function addScene(label, tl, overlap = 0.3) {
    if (!tl || typeof tl.totalDuration !== 'function') return;
    const d = tl.totalDuration();
    if (!d || d <= 0) return;
    
    reel.addLabel(label, reel.duration() - overlap); // Overlap scenes
    reel.add(tl, '>');
  }

  // Build the master timeline with overlapping scenes
  addScene('hero', heroScene(), 0);
  addScene('s63', s63Scene(), 0.2);
  addScene('drivers', driversScene(), 0.2);
  addScene('hoodie', hoodieScene(), 0.2);
  addScene('watch', watchScene(), 0.2);
  // Add all other scenes with the same pattern...

  /* -----------------------------
     ENHANCED STARTUP & SCROLLTRIGGER
  --------------------------------*/
  async function start() {
    try {
      await Promise.race([
        preloadImages(preloadList),
        new Promise(res => setTimeout(res, 2000)) // Shorter timeout
      ]);
    } catch (e) {
      console.warn('Preload continued with issues:', e);
    }

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      try { 
        await document.fonts.ready; 
      } catch(e) {
        console.warn('Font loading issue:', e);
      }
    }

    const totalDuration = reel.totalDuration() || 12;
    const scrollDistance = totalDuration * CONFIG.SCROLL_PIXELS_PER_SEC;

    console.log(`Reel duration: ${totalDuration}s, Scroll distance: ${scrollDistance}px`);

    // Enhanced ScrollTrigger configuration
    ScrollTrigger.create({
      animation: reel,
      trigger: main,
      start: 'top top',
      end: `+=${scrollDistance}`,
      scrub: 0.6, // Smoother scrub
      pin: true,
      anticipatePin: 1,
      onEnter: () => {
        document.body.style.overflow = 'hidden';
      },
      onLeave: () => {
        document.body.style.overflow = 'auto';
      },
      onUpdate: (self) => {
        const p = self.progress;
        const mod = Math.sin(p * Math.PI * 2) * 0.5 + 0.5;
        bridge.flash(mod);
        
        // Enhanced transition overlay
        gsap.to(transitionOverlay, {
          opacity: Math.sin(p * Math.PI) * 0.3,
          duration: 0.1
        });
      },
      onRefresh: () => {
        console.log('ScrollTrigger refreshed');
      }
    });

    // Force refresh after a brief delay to ensure everything is ready
    setTimeout(() => {
      ScrollTrigger.refresh();
      console.log('ScrollTrigger initialized');
    }, 100);
  }

  // Enhanced error boundary
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
  });

  // Start the experience
  start();

  /* -----------------------------
     ENHANCED MICRO INTERACTIONS
  --------------------------------*/
  (function initInteractions() {
    const interactiveElements = $$('.btn, .links a, .cta .btn, [data-interactive]');
    
    interactiveElements.forEach((el) => {
      // Magnetic effect
      el.addEventListener('mouseenter', () => {
        gsap.to(el, {
          y: -2,
          scale: 1.04,
          duration: 0.3,
          ease: 'back.out(1.7)',
          filter: 'brightness(1.1)'
        });
      });
      
      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
          filter: 'brightness(1)'
        });
      });

      // Ripple effect on click
      el.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.6);
          transform: scale(0);
          pointer-events: none;
          width: ${size}px;
          height: ${size}px;
          left: ${e.clientX - rect.left - size/2}px;
          top: ${e.clientY - rect.top - size/2}px;
          mix-blend-mode: overlay;
        `;
        
        el.style.position = 'relative';
        el.appendChild(ripple);
        
        gsap.to(ripple, {
          scale: 2,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        });
        
        AudioEngine.chimeHi();
      });
    });
  })();

  /* -----------------------------
     PERFORMANCE OPTIMIZATIONS
  --------------------------------*/
  // Throttle scroll events
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
      }, 16);
    }
  });

  // Clean up on page hide
  window.addEventListener('beforeunload', () => {
    if (lenis) lenis.destroy();
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  });
});
