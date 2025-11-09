/* ============================================================
   BLAKE — CHRISTMAS 2024–2025
   Cinematic single-reel scroll (GSAP + ScrollTrigger + Lenis)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP / ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* -----------------------------
     CONFIG
  --------------------------------*/
  const isReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
  const SCROLL_SMOOTH = 0.14; // slightly stronger for liquid feel
  const SCROLL_PIXELS_PER_SEC = 520; // scroll distance per 1s of reel

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const main = $('main');
  if (!main) {
    console.error('<main> not found');
    return;
  }

  /* -----------------------------
     LENIS + SCROLLTRIGGER BRIDGE
  --------------------------------*/
  let lenis;
  const SCROLLER = document.documentElement; // <html>

  function initLenis() {
    if (isReduced || typeof Lenis === 'undefined') {
      // Native scroll, basic setup
      ScrollTrigger.defaults({ scroller: window });
      return;
    }

    lenis = new Lenis({
      lerp: SCROLL_SMOOTH,
      wheelMultiplier: 1,
      normalizeWheel: true,
      smoothTouch: true
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    ScrollTrigger.scrollerProxy(SCROLLER, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: false });
        }
        return lenis.scroll || window.scrollY || window.pageYOffset || 0;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      },
      pinType: SCROLLER.style.transform ? 'transform' : 'fixed'
    });

    ScrollTrigger.defaults({ scroller: SCROLLER });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  initLenis();

  /* -----------------------------
     AUDIO ENGINE (lightweight cues)
  --------------------------------*/
  const AudioEngine = (() => {
    let ctx, master;

    function ensure() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }

    function tone({ freq = 440, dur = 0.18, type = 'sine', attack = 0.01, release = 0.18, gain = 0.18 }) {
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
      tone({ freq: 880, type: 'triangle', gain: 0.16 });
      tone({ freq: 1320, type: 'triangle', dur: 0.12, gain: 0.12 });
    }

    function chimeLo() {
      tone({ freq: 330, type: 'sine', dur: 0.22, gain: 0.22 });
    }

    function whoosh() {
      ensure();
      const now = ctx.currentTime;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const fade = 1 - i / data.length;
        data[i] = (Math.random() * 2 - 1) * fade;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.value = 0.32;
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
     PRELOAD CRITICAL IMAGES
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
        if (img.decode) {
          img.decode().then(res).catch(res);
        } else {
          img.onload = res;
          img.onerror = res;
        }
      }))
    );
  }

  /* -----------------------------
     GLOBAL BRIDGE LAYER
     (subtle grain + gold line tying scenes)
  --------------------------------*/
  function createBridgeLayer() {
    const layer = document.createElement('div');
    layer.className = 'bridge-layer';
    layer.style.cssText = `
      pointer-events:none;
      position:fixed;
      inset:0;
      z-index:5;
      mix-blend-mode:soft-light;
      opacity:0;
      background-image:
        radial-gradient(circle at 0 0, rgba(0,0,0,.05), transparent 60%),
        radial-gradient(circle at 100% 0, rgba(0,0,0,.04), transparent 60%),
        repeating-linear-gradient(0deg, rgba(0,0,0,.04), rgba(0,0,0,.0) 2px);
      transition:opacity .35s ease-out;
    `;
    document.body.appendChild(layer);

    const line = document.createElement('div');
    line.style.cssText = `
      position:absolute;
      height:2px;
      width:18vw;
      max-width:260px;
      background:linear-gradient(90deg, transparent, #C9B37E, transparent);
      top:52%;
      left:-20vw;
      opacity:0;
      border-radius:999px;
      box-shadow:0 0 18px rgba(201,179,126,.5);
    `;
    layer.appendChild(line);

    function flash(progress) {
      // light grain lift on transitions
      layer.style.opacity = clamp(0.18 + progress * 0.12, 0, 0.32);
    }

    function sweep() {
      gsap.fromTo(line,
        { xPercent: -40, opacity: 0 },
        {
          xPercent: 120,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          onComplete: () => { line.style.opacity = 0; }
        }
      );
    }

    return { flash, sweep };
  }

  const bridge = createBridgeLayer();

  /* -----------------------------
     SCENE BUILDERS
     each returns a small timeline segment
  --------------------------------*/

  function heroScene() {
    const sec = $('section[data-scene="hero"]');
    if (!sec) return gsap.timeline();

    const line = $('.hero-line', sec);
    const h1 = $('.hero-copy h1', sec);
    const p = $('.hero-copy p', sec);

    const tl = gsap.timeline();
    tl.fromTo(line, { width: 0 }, { width: 240, duration: 0.9, ease: 'power3.out' })
      .from(h1, { y: 26, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.08)
      .from(p, { y: 18, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.16);

    // light bridge sweep to lead into S63
    tl.call(() => {
      bridge.sweep();
      AudioEngine.chimeHi();
    }, null, '>-0.1');

    return tl;
  }

  function s63Scene() {
    const el = $('section[data-scene="s63"]');
    if (!el) return gsap.timeline();

    const frames = $$('.s63', el);
    const chips = $$('.spec-chips li', el);

    const sweep = document.createElement('div');
    sweep.style.cssText =
      'position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:0;' +
      'background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.7) 50%,transparent 60%);';
    el.appendChild(sweep);

    const rim = document.createElement('div');
    rim.className = 'rim';
    rim.style.cssText =
      'position:absolute;width:22vmin;height:22vmin;border-radius:50%;overflow:hidden;' +
      'left:12%;bottom:18%;box-shadow:0 20px 60px rgba(0,0,0,.25);opacity:0;';
    const rimImg = new Image();
    rimImg.src = './assets/s63_topdown.jpg';
    rimImg.style.width = '160%';
    rimImg.style.transform = 'translate(-22%,-22%)';
    rim.appendChild(rimImg);
    el.appendChild(rim);

    const tl = gsap.timeline();

    if (frames.length >= 3) {
      // A -> B -> C with continuous feel
      tl.set(frames, { opacity: 0, scale: 1, zIndex: 1 });
      tl.set(frames[0], { opacity: 1, zIndex: 3 });

      tl.to(frames[0], { opacity: 0, scale: 0.98, duration: 0.45 }, 0.25)
        .to(frames[1], { opacity: 1, duration: 0.45 }, 0.25)
        .to(frames[1], { opacity: 0, y: -14, duration: 0.45 }, 0.8)
        .to(frames[2], { opacity: 1, y: 0, duration: 0.6 }, 0.8);
    }

    // rim beat overlapping transition
    tl.fromTo(
      rim,
      { scale: 0.22, rotation: -200, opacity: 0 },
      { scale: 1, rotation: 360, opacity: 1, duration: 0.5, ease: 'expo.out' },
      0.32
    ).to(
      rim,
      { scale: 0.01, opacity: 0, duration: 0.4, ease: 'power2.in' },
      1.0
    );

    // chrome sweep bridging frames
    tl.to(sweep, { opacity: 1, duration: 0.2 }, 0.18)
      .to(
        sweep,
        {
          backgroundPosition: '220% 0',
          duration: 0.95,
          ease: 'power2.inOut'
        },
        0.18
      )
      .to(sweep, { opacity: 0, duration: 0.25 }, 1.1);

    // spec chips rise as payoff
    if (chips.length) {
      tl.from(
        chips,
        {
          y: 18,
          opacity: 0,
          stagger: 0.06,
          duration: 0.35,
          ease: 'power2.out'
        },
        0.42
      );
    }

    tl.call(() => {
      bridge.flash(0.8);
      AudioEngine.whoosh();
      AudioEngine.chimeHi();
    }, null, 0.24);

    return tl;
  }

  function driversScene() {
    const el = $('section[data-scene="drivers"]');
    if (!el) return gsap.timeline();

    const img = $('img', el);
    const tl = gsap.timeline();

    if (!img) return tl;

    // subtle suede “focus in”
    tl.fromTo(
      img,
      { scale: 1.06, filter: 'contrast(1.08) saturate(1.02) blur(1.5px)' },
      { scale: 1, filter: 'none', duration: 0.9, ease: 'power2.out' }
    );

    // mouse ghost trail — refined & self-fading
    const trail = document.createElement('canvas');
    trail.width = trail.height = 1024;
    trail.style.cssText =
      'position:absolute;inset:0;margin:auto;pointer-events:none;border-radius:18px;';
    el.style.position = 'relative';
    el.appendChild(trail);
    const ctx = trail.getContext('2d');

    let last = 0;
    let fadeTimer = 0;

    el.addEventListener('mousemove', (e) => {
      const r = trail.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * trail.width;
      const y = ((e.clientY - r.top) / r.height) * trail.height;
      const now = performance.now();
      if (now - last < 18) return;
      last = now;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();

      // gentle decay
      cancelAnimationFrame(fadeTimer);
      const fade = () => {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, trail.width, trail.height);
        fadeTimer = requestAnimationFrame(fade);
      };
      fadeTimer = requestAnimationFrame(fade);
    });

    tl.call(() => {
      bridge.flash(0.4);
      AudioEngine.chimeLo();
    }, null, '>-0.2');

    return tl;
  }

  function hoodieScene() {
    const el = $('section[data-scene="hoodie"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const stitch = document.createElement('div');
    stitch.style.cssText =
      'position:absolute;inset:0;border-radius:18px;mix-blend-mode:overlay;' +
      'background:linear-gradient(120deg,transparent 40%,rgba(255,255,255,.26) 50%,transparent 60%);' +
      'opacity:0;pointer-events:none;';
    el.style.position = 'relative';
    el.appendChild(stitch);

    const tl = gsap.timeline();
    tl.fromTo(
      img,
      { y: -40, rotate: -2, transformOrigin: '50% 0', filter: 'brightness(.9) contrast(1.06)' },
      { y: 0, rotate: 0, duration: 0.9, ease: 'power2.out', filter: 'none' }
    )
      .to(
        stitch,
        {
          opacity: 1,
          duration: 0.25,
          ease: 'power1.out'
        },
        0.18
      )
      .to(
        stitch,
        {
          backgroundPosition: '220% 0',
          duration: 0.9,
          ease: 'power2.inOut'
        },
        0.2
      )
      .to(stitch, { opacity: 0, duration: 0.3 }, 1.05)
      .call(AudioEngine.chimeHi, null, 0.3);

    return tl;
  }

  function watchScene() {
    const el = $('section[data-scene="watch"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    const date = $('.date-window', el);
    if (!img || !date) return gsap.timeline();

    const caustic = document.createElement('div');
    caustic.style.cssText =
      'position:absolute;inset:0;mix-blend-mode:screen;opacity:0;' +
      'background:radial-gradient(60% 120% at 10% 20%,rgba(255,255,255,.5),transparent 60%),' +
      'radial-gradient(40% 80% at 90% 80%,rgba(255,255,255,.35),transparent 60%);';
    el.style.position = 'relative';
    el.appendChild(caustic);

    const tl = gsap.timeline();
    tl.from(img, {
      scale: 1.04,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
      .to(caustic, { opacity: 0.9, duration: 0.3, ease: 'power1.out' }, 0.1)
      .to(caustic, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.6)
      .fromTo(
        date,
        { rotationX: -90, opacity: 0, transformOrigin: '50% 0' },
        { rotationX: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        0.32
      )
      .call(() => {
        AudioEngine.chimeHi();
        AudioEngine.chimeLo();
      }, null, 0.4);

    return tl;
  }

  // For brevity, the remaining scenes follow the same pattern:
  // - No independent ScrollTriggers
  // - Timelines appended consecutively to `reel`
  // - Minimal eases (mostly power2 / none)
  // - Any canvas loops gated within their segment using tl.call()

  // I’ll wire a few more key ones; you can mirror style if you add more later.

  function linenScene() {
    const el = $('section[data-scene="linen"]');
    if (!el) return gsap.timeline();
    const imgs = $$('.color-weave img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      xPercent: (i) => i * 6,
      opacity: 0,
      stagger: 0.06,
      duration: 0.5,
      ease: 'power2.out'
    }).to(imgs, {
      xPercent: -100 * (imgs.length - 1),
      duration: 1.4,
      ease: 'none'
    });

    return tl;
  }

  function clubmasterScene() {
    const el = $('section[data-scene="clubmaster"]');
    if (!el) return gsap.timeline();
    const frame = $('.frame', el);
    const lens = $('.lens-bg', el);
    if (!frame || !lens) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(frame, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
      .from(
        lens,
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: 'power2.out'
        },
        0.1
      )
      .to(
        lens,
        {
          backgroundPosition: '200% 0',
          duration: 1.2,
          ease: 'sine.inOut'
        },
        0.18
      )
      .call(AudioEngine.chimeHi, null, 0.3);

    // micro 3D tilt (not tied to scroll)
    frame.style.transformOrigin = '50% 50%';
    frame.addEventListener('mousemove', (e) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = map(y, 0, 1, 8, -8);
      const ry = map(x, 0, 1, -8, 8);
      frame.style.transform =
        `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    frame.addEventListener('mouseleave', () => {
      frame.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });

    return tl;
  }

  function herodScene() {
    const el = $('section[data-scene="herod"]');
    if (!el) return gsap.timeline();
    const bottle = $('.bottle img', el);
    const cvs = $('.vapor', el);
    if (!bottle || !cvs) return gsap.timeline();
    const ctx = cvs.getContext('2d');

    function resize() {
      const r = el.getBoundingClientRect();
      cvs.width = r.width * PIXEL_RATIO;
      cvs.height = r.height * PIXEL_RATIO;
    }
    resize();
    window.addEventListener('resize', resize);

    const N = 80;
    const P = [];
    for (let i = 0; i < N; i++) {
      P.push({
        x: Math.random() * cvs.width,
        y: cvs.height * (0.4 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.18 - Math.random() * 0.14,
        a: 0.2 + Math.random() * 0.5,
        r: 1 + Math.random() * 2
      });
    }

    let active = false;
    function loop() {
      if (!active) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (const p of P) {
        ctx.fillStyle = `rgba(210,160,120,${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.a *= 0.995;
        if (p.y < -20 || p.a < 0.02) {
          p.x = Math.random() * cvs.width;
          p.y = cvs.height * (0.5 + Math.random() * 0.4);
          p.vx = (Math.random() - 0.5) * 0.12;
          p.vy = -0.18 - Math.random() * 0.14;
          p.a = 0.35 + Math.random() * 0.4;
        }
      }
      requestAnimationFrame(loop);
    }

    const tl = gsap.timeline();
    tl.from(bottle, {
      y: 26,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
      .call(() => { active = true; loop(); }, null, 0.1)
      .call(AudioEngine.chimeLo, null, 0.2)
      .call(() => { active = false; }, null, '>=+1.4');

    return tl;
  }

  // You’d continue this pattern for:
  // creamBlazerScene, goldenGooseScene, joggersScene, cardigansScene,
  // blazersScene, vnecksScene, velvetScene, chainsScene, suitsScene,
  // purpleScene, chinosScene, gamesScene, ultimaScene,
  // exoticsScene, deskScene, dubaiScene, sbpScene,
  // fragsScene (with gated loop), underglowScene, djiScene,
  // embodyScene, poloScene, fingearsScene, pwatchScene,
  // audioSoftScene, geminiScene, bonsaiScene.
  //
  // Each:
  // - builds ONE gsap.timeline()
  // - NO ScrollTrigger in there
  // - is appended to `reel` directly → continuous play
  // - any fancy loops use tl.call(start/stop) so they only run in-range

  /* -----------------------------
     MASTER REEL
  --------------------------------*/
  const reel = gsap.timeline({
    paused: true,
    defaults: { ease: 'none' }
  });

  function addScene(label, tl) {
    if (!tl || !tl.duration || tl.duration() === 0) return;
    reel.addLabel(label, reel.duration());
    reel.add(tl, '>');
  }

  // Build sequence in exact narrative order
  addScene('hero', heroScene());
  addScene('s63', s63Scene());
  addScene('drivers', driversScene());
  addScene('hoodie', hoodieScene());
  addScene('watch', watchScene());
  addScene('linen', linenScene());
  addScene('clubmaster', clubmasterScene());
  addScene('herod', herodScene());
  // ...continue addScene() calls for all other scenes in your order

  /* -----------------------------
     START AFTER ASSETS READY
  --------------------------------*/
  async function start() {
    try {
      await Promise.race([
        preloadImages(preloadList),
        new Promise(res => setTimeout(res, 1600)) // fallback so it still starts
      ]);
    } catch (e) {
      console.warn('Image preload had issues, continuing anyway.', e);
    }

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch(e) {}
    }

    // Map scroll to reel; pin main so the whole thing is one stage
    const total = reel.duration() || 10;
    ScrollTrigger.create({
      animation: reel,
      trigger: main,
      start: 'top top',
      end: () => '+=' + total * SCROLL_PIXELS_PER_SEC,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      snap: {
        snapTo: 'labels',
        duration: 0.5,
        ease: 'power1.inOut'
      },
      onUpdate: (self) => {
        // use bridge layer as glue throughout
        const p = self.progress;
        const mod = Math.sin(p * Math.PI);
        bridge.flash(mod);
      }
    });

    ScrollTrigger.refresh();
  }

  start();

  /* -----------------------------
     MICRO INTERACTIONS
  --------------------------------*/
  function cursorMagnets() {
    const mags = $$('.btn, .links a, .cta .btn');
    mags.forEach((m) => {
      m.addEventListener('mouseenter', () => {
        gsap.to(m, {
          y: -1,
          scale: 1.03,
          duration: 0.2,
          ease: 'power2.out'
        });
      });
      m.addEventListener('mouseleave', () => {
        gsap.to(m, {
          y: 0,
          scale: 1,
          duration: 0.25,
          ease: 'power2.out'
        });
      });
    });
  }
  cursorMagnets();
});
