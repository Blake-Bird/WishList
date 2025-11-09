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
  const isReduced = false; // force full experience
  const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
  const SCROLL_SMOOTH = 0.14;
  const SCROLL_PIXELS_PER_SEC = 520;

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
     LENIS (smooth scroll on window)
  --------------------------------*/
  let lenis;

  function initLenis() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not found, using native scroll');
      ScrollTrigger.defaults({ scroller: window });
      return;
    }

    lenis = new Lenis({
      lerp: SCROLL_SMOOTH,
      wheelMultiplier: 1.05,
      normalizeWheel: true,
      smoothTouch: true
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    ScrollTrigger.defaults({ scroller: window });
  }

  initLenis();

  /* -----------------------------
     AUDIO ENGINE
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

    function tone({
      freq = 440,
      dur = 0.18,
      type = 'sine',
      attack = 0.01,
      release = 0.18,
      gain = 0.18
    }) {
      ensure();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain, now + attack);
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        now + attack + dur + release
      );
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
     PRELOAD
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
     BRIDGE LAYER (ties everything)
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
      layer.style.opacity = String(clamp(0.12 + progress * 0.2, 0, 0.32));
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
     SCENE TIMELINES
  --------------------------------*/

  function heroScene() {
    const sec = $('section[data-scene="hero"]');
    if (!sec) return gsap.timeline();

    const line = $('.hero-line', sec);
    const h1 = $('.hero-copy h1', sec);
    const p = $('.hero-copy p', sec);

    const tl = gsap.timeline();
    tl.fromTo(line, { width: 0 }, { width: 240, duration: 0.9, ease: 'power3.out' })
      .from(h1, { y: 26, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.05)
      .from(p, { y: 18, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.14)
      .call(() => {
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
      tl.set(frames, { opacity: 0, scale: 1, zIndex: 1 });
      tl.set(frames[0], { opacity: 1, zIndex: 3 });

      tl.to(frames[0], { opacity: 0, scale: 0.98, duration: 0.45 }, 0.1)
        .to(frames[1], { opacity: 1, duration: 0.45 }, 0.1)
        .to(frames[1], { opacity: 0, y: -14, duration: 0.45 }, 0.7)
        .to(frames[2], { opacity: 1, y: 0, duration: 0.6 }, 0.7);
    }

    tl.from(chips, {
      y: 18,
      opacity: 0,
      stagger: 0.06,
      duration: 0.35,
      ease: 'power2.out'
    }, 0.3);

    tl.fromTo(
      rim,
      { scale: 0.22, rotation: -200, opacity: 0 },
      { scale: 1, rotation: 360, opacity: 1, duration: 0.5, ease: 'expo.out' },
      0.25
    ).to(
      rim,
      { scale: 0.01, opacity: 0, duration: 0.4, ease: 'power2.in' },
      0.95
    );

    tl.to(sweep, { opacity: 1, duration: 0.2 }, 0.18)
      .to(sweep, {
        backgroundPosition: '220% 0',
        duration: 0.95,
        ease: 'power2.inOut'
      }, 0.18)
      .to(sweep, { opacity: 0, duration: 0.25 }, 1.1);

    tl.call(() => {
      bridge.flash(0.9);
      AudioEngine.whoosh();
      AudioEngine.chimeHi();
    }, null, 0.2);

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
      { scale: 1.06, filter: 'contrast(1.08) saturate(1.02) blur(1.5px)' },
      { scale: 1, filter: 'none', duration: 0.9, ease: 'power2.out' }
    );

    const trail = document.createElement('canvas');
    trail.width = trail.height = 1024;
    trail.style.cssText =
      'position:absolute;inset:0;margin:auto;pointer-events:none;border-radius:18px;';
    el.style.position = 'relative';
    el.appendChild(trail);
    const ctx = trail.getContext('2d');

    let last = 0;
    el.addEventListener('mousemove', (e) => {
      const r = trail.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * trail.width;
      const y = ((e.clientY - r.top) / r.height) * trail.height;
      const now = performance.now();
      if (now - last < 18) return;
      last = now;

      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();
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
      .to(stitch, { opacity: 1, duration: 0.25, ease: 'power1.out' }, 0.18)
      .to(stitch, {
        backgroundPosition: '220% 0',
        duration: 0.9,
        ease: 'power2.inOut'
      }, 0.2)
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
      .from(lens, {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        ease: 'power2.out'
      }, 0.1)
      .to(lens, {
        backgroundPosition: '200% 0',
        duration: 1.2,
        ease: 'sine.inOut'
      }, 0.18)
      .call(AudioEngine.chimeHi, null, 0.3);

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
      frame.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg)';
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
      .call(() => { active = false; }, null, '+=1.4');

    return tl;
  }

  function creamBlazerScene() {
    const el = $('section[data-scene="creamBlazer"]');
    if (!el) return gsap.timeline();
    const path = $('svg.stitch path', el);
    const img = $('.blueprint img', el);
    if (!path || !img) return gsap.timeline();

    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

    const tl = gsap.timeline();
    tl.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' })
      .from(img, {
        scale: 0.96,
        opacity: 0.8,
        duration: 0.8,
        ease: 'power2.out'
      }, 0)
      .call(AudioEngine.chimeHi, null, 0.6);

    return tl;
  }

  function goldenGooseScene() {
    const el = $('section[data-scene="gg"]');
    if (!el) return gsap.timeline();
    const shoe = $('.gg-shoe', el);
    const ped = $('.gallery-pedestal', el);
    if (!shoe || !ped) return gsap.timeline();

    const tl = gsap.timeline();
    tl.fromTo(
      shoe,
      { rotate: -8, y: 20, filter: 'saturate(1.15) contrast(1.1)' },
      { rotate: 0, y: -6, duration: 0.7, ease: 'expo.out' }
    )
      .fromTo(
        ped,
        { scaleX: 0.2, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' },
        0.2
      )
      .to(shoe, { y: -2, duration: 0.6, ease: 'sine.inOut' })
      .to(shoe, { y: 0, duration: 0.6, ease: 'sine.inOut' });

    return tl;
  }

  function joggersScene() {
    const el = $('section[data-scene="joggers"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.fromTo(
      img,
      { x: -1200, filter: 'blur(8px)' },
      { x: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }
    ).to(img, {
      y: 10,
      duration: 1.1,
      ease: 'elastic.out(1,0.6)'
    }, 0.6)
      .call(AudioEngine.whoosh, null, 0.1);

    return tl;
  }

  function cardiganScene() {
    const el = $('section[data-scene="cardigans"]');
    if (!el) return gsap.timeline();
    const imgs = $$('.zip-gallery img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      y: 30,
      opacity: 0,
      stagger: 0.12,
      duration: 0.45,
      ease: 'power2.out'
    }).to(imgs, {
      scale: 1.02,
      duration: 1.0,
      ease: 'sine.inOut'
    });

    return tl;
  }

  function blazersScene() {
    const el = $('section[data-scene="blazers"]');
    if (!el) return gsap.timeline();
    const mans = $$('.mannequins img', el);
    if (!mans.length) return gsap.timeline();

    const tl = gsap.timeline();
    mans.forEach((m, i) => {
      tl.from(m, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, i * 0.1)
        .to(m, {
          rotationY: (i % 2 ? 1 : -1) * 18,
          transformOrigin: '50% 50% -300px',
          duration: 1.2,
          ease: 'sine.inOut'
        }, 0.4 + i * 0.05);
    });

    return tl;
  }

  function vnecksScene() {
    const el = $('section[data-scene="vnecks"]');
    if (!el) return gsap.timeline();
    const imgs = $$('.vneck-row img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.4,
      ease: 'power2.out'
    }).to(imgs, {
      y: -4,
      yoyo: true,
      repeat: 1,
      duration: 1.0,
      ease: 'sine.inOut'
    }, 0.5);

    return tl;
  }

  function velvetScene() {
    const el = $('section[data-scene="velvet"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const sheen = document.createElement('div');
    sheen.style.cssText =
      'position:absolute;inset:0;border-radius:18px;mix-blend-mode:soft-light;' +
      'background:linear-gradient(120deg, rgba(255,255,255,.18), transparent 40%, rgba(0,0,0,.18)); opacity:0';
    el.appendChild(sheen);

    const tl = gsap.timeline();
    tl.from(img, {
      scale: 1.02,
      opacity: 0.8,
      duration: 0.6,
      ease: 'power2.out'
    })
      .to(sheen, {
        opacity: 1,
        backgroundPosition: '200% 0',
        duration: 1.2,
        ease: 'sine.inOut'
      }, 0.1)
      .to(sheen, { opacity: 0.4, duration: 0.5 }, 1.0);

    return tl;
  }

  function chainsScene() {
    const el = $('section[data-scene="chains"]');
    if (!el) return gsap.timeline();
    const imgs = $$('.chains-row img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      opacity: 0,
      y: 26,
      stagger: 0.08,
      duration: 0.4,
      ease: 'power2.out'
    });

    return tl;
  }

  function suitsScene() {
    const el = $('section[data-scene="suits"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(img, {
      clipPath: 'inset(50% 50% 50% 50%)',
      duration: 1.2,
      ease: 'expo.out'
    }).to(img, {
      scale: 1.02,
      duration: 1.0,
      ease: 'sine.inOut'
    });

    return tl;
  }

  function purpleScene() {
    const el = $('section[data-scene="purple"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const line = document.createElement('div');
    line.style.cssText =
      'position:absolute;height:2px;width:24px;background:#C9B37E;left:40%;top:40%;opacity:0;border-radius:999px';
    el.appendChild(line);

    const tl = gsap.timeline();
    tl.from(img, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power2.out'
    })
      .to(line, {
        opacity: 1,
        x: 120,
        duration: 0.6,
        ease: 'sine.inOut'
      }, 0.2)
      .to(line, {
        opacity: 0,
        duration: 0.2
      }, 0.9);

    return tl;
  }

  function chinosScene() {
    const el = $('section[data-scene="chinos"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (imgs.length < 2) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs[0], {
      x: -80,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }).from(imgs[1], {
      x: 80,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, 0.1);

    return tl;
  }

  function gamesScene() {
    const el = $('section[data-scene="games"]');
    if (!el) return gsap.timeline();
    const covers = $$('.covers img', el);
    if (!covers.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(covers, {
      y: 40,
      opacity: 0,
      stagger: 0.08,
      duration: 0.35,
      ease: 'power2.out'
    }).to(covers, {
      y: -4,
      yoyo: true,
      repeat: 1,
      duration: 1.0,
      ease: 'sine.inOut'
    }, 0.5)
      .call(AudioEngine.chimeHi, null, 0.4);

    return tl;
  }

  function ultimaScene() {
    const el = $('section[data-scene="ultima"]');
    if (!el) return gsap.timeline();
    const photo = $('.ultima-photo', el);
    const rail = $$('.year-rail span', el);
    const cvs = $('.ultima-blueprint', el);
    if (!photo || !rail.length || !cvs) return gsap.timeline();

    const ctx = cvs.getContext('2d');
    function resize() {
      const r = el.getBoundingClientRect();
      cvs.width = r.width * PIXEL_RATIO;
      cvs.height = r.height * 0.6 * PIXEL_RATIO;
    }
    resize();
    window.addEventListener('resize', resize);

    let prog = 0;
    let active = false;
    function render() {
      if (!active) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.strokeStyle = 'rgba(80,60,140,.9)';
      ctx.lineWidth = 2 * PIXEL_RATIO;
      ctx.setLineDash([12 * PIXEL_RATIO, 12 * PIXEL_RATIO]);
      const w = cvs.width, h = cvs.height;
      ctx.beginPath();
      ctx.moveTo(w * .05, h * .65);
      ctx.quadraticCurveTo(w * .35, h * .20, w * .75, h * .25);
      ctx.quadraticCurveTo(w * .92, h * .28, w * .95, h * .62);
      ctx.quadraticCurveTo(w * .70, h * .68, w * .40, h * .70);
      ctx.quadraticCurveTo(w * .18, h * .70, w * .05, h * .65);
      ctx.stroke();
      const step = 28 * PIXEL_RATIO;
      ctx.globalAlpha = .18;
      for (let x = -h; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + prog * 18, 0);
        ctx.lineTo(x + h + prog * 18, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      prog += 0.0025;
      requestAnimationFrame(render);
    }

    const tl = gsap.timeline();
    tl.from(photo, {
      opacity: 0,
      scale: .96,
      duration: .9,
      ease: 'expo.out'
    }, 0.2)
      .from(rail, {
        opacity: 0,
        x: 20,
        stagger: .15,
        duration: .35,
        ease: 'power2.out'
      }, 0.1)
      .call(() => {
        active = true;
        render();
        AudioEngine.whoosh();
        setTimeout(AudioEngine.chimeHi, 260);
      }, null, 0.4)
      .call(() => { active = false; }, null, '+=1.6');

    return tl;
  }

  function exoticsScene() {
    const el = $('section[data-scene="exotics"]');
    if (!el) return gsap.timeline();
    const ribbon = $('.speed-ribbon', el);
    const cars = $$('.fleet img', el);
    if (!ribbon || !cars.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.to(ribbon, {
      xPercent: 100,
      repeat: 1,
      yoyo: true,
      duration: 1.4,
      ease: 'sine.inOut'
    }, 0)
      .from(cars, {
        y: 60,
        opacity: 0,
        stagger: 0.12,
        duration: 0.45,
        ease: 'power2.out'
      }, 0.2)
      .call(AudioEngine.whoosh, null, 0.3);

    return tl;
  }

  function deskScene() {
    const el = $('section[data-scene="desk"]');
    if (!el) return gsap.timeline();
    const items = $$('img', el);
    if (!items.length) return gsap.timeline();

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    items.forEach((it, i) => {
      tl.from(it, {
        opacity: 0,
        scale: .6,
        x: (i - 1) * 180,
        y: (i % 2 ? -60 : 60),
        duration: .6
      }, i * 0.08);
    });
    tl.call(AudioEngine.chimeHi, null, 0.4);

    return tl;
  }

  function dubaiScene() {
    const el = $('section[data-scene="dubai"]');
    if (!el) return gsap.timeline();
    const haze = $('.heat-haze', el);
    const img = $('img', el);
    if (!img || !haze) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(img, {
      opacity: 0,
      y: 20,
      duration: .6,
      ease: 'power2.out'
    })
      .to(haze, {
        opacity: .9,
        duration: 1.2,
        ease: 'sine.inOut'
      }, 0.2)
      .to(haze, {
        opacity: .4,
        duration: 1.0,
        ease: 'sine.inOut'
      });

    return tl;
  }

  function sweatersBagPenScene() {
    const el = $('section[data-scene="sweatersbagpen"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      opacity: 0,
      y: 30,
      stagger: .09,
      duration: .4,
      ease: 'power2.out'
    }).to(imgs, {
      y: -3,
      yoyo: true,
      repeat: 1,
      duration: 1.0,
      ease: 'sine.inOut'
    }, 0.6);

    return tl;
  }

  function fragsScene() {
    const el = $('section[data-scene="frags"]');
    if (!el) return gsap.timeline();
    const cvs = $('.constellation', el);
    const ctx = cvs ? cvs.getContext('2d') : null;
    const thumbs = $$('.frag-grid img', el);
    if (!cvs || !ctx) return gsap.timeline();

    function resize() {
      const r = el.getBoundingClientRect();
      cvs.width = r.width * PIXEL_RATIO;
      cvs.height = (r.height * .7) * PIXEL_RATIO;
    }
    resize();
    window.addEventListener('resize', resize);

    const dots = new Array(80).fill(0).map(() => ({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: Math.random() * 2 + 1,
      s: Math.random() * 0.6 + 0.4,
      hue: Math.random() * 360
    }));

    let active = false;
    function step() {
      if (!active) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (const d of dots) {
        d.x += (Math.random() - .5) * d.s;
        d.y += (Math.random() - .5) * d.s;
        d.x = clamp(d.x, 0, cvs.width);
        d.y = clamp(d.y, 0, cvs.height);
        ctx.fillStyle = `hsla(${d.hue},70%,60%,0.7)`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(step);
    }

    const tl = gsap.timeline();
    tl.from(thumbs, {
      opacity: 0,
      y: 20,
      stagger: 0.08,
      duration: 0.4,
      ease: 'power2.out'
    })
      .call(() => {
        active = true;
        step();
        AudioEngine.chimeLo();
      }, null, 0.2)
      .call(() => { active = false; }, null, '+=1.6');

    return tl;
  }

  function underglowScene() {
    const el = $('section[data-scene="underglow"]');
    if (!el) return gsap.timeline();
    const road = $('.road', el);
    const img = $('img', el);
    if (!road || !img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.fromTo(road,
      { xPercent: -50, opacity: 0 },
      { xPercent: 50, opacity: 1, duration: 1.2, ease: 'sine.inOut' }
    )
      .from(img, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out'
      }, 0.1);

    return tl;
  }

  function djiScene() {
    const el = $('section[data-scene="dji"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    const hud = $$('.hud span', el);
    if (!img || !hud.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(img, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power2.out'
    })
      .from(hud, {
        y: 20,
        opacity: 0,
        stagger: .12,
        duration: .35,
        ease: 'power2.out'
      }, 0.2);

    return tl;
  }

  function embodyScene() {
    const el = $('section[data-scene="embody"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(img, {
      scale: 1.02,
      opacity: 0.85,
      duration: .5,
      ease: 'power2.out'
    })
      .to(img, {
        transform: 'perspective(900px) rotateX(8deg) rotateY(-6deg)',
        duration: .6,
        ease: 'sine.inOut'
      })
      .to(img, {
        transform: 'perspective(900px) rotateX(18deg) rotateY(0deg) translateY(6px)',
        duration: .9,
        ease: 'sine.inOut'
      });

    return tl;
  }

  function poloScene() {
    const el = $('section[data-scene="poloTrousers"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      opacity: 0,
      rotateY: -15,
      transformOrigin: '0% 50%',
      stagger: .1,
      duration: .45,
      ease: 'power2.out'
    }).to(imgs, {
      rotateY: 0,
      duration: .8,
      ease: 'sine.inOut'
    });

    return tl;
  }

  function fingearsScene() {
    const el = $('section[data-scene="fingears"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(img, {
      y: 30,
      opacity: 0,
      duration: .45,
      ease: 'power2.out'
    })
      .to(img, {
        rotation: 360,
        repeat: 1,
        yoyo: true,
        duration: 1.2,
        ease: 'sine.inOut'
      }, 0.4)
      .call(AudioEngine.chimeHi, null, 0.4);

    return tl;
  }

  function pwatchScene() {
    const el = $('section[data-scene="pwatch"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      y: 40,
      opacity: 0,
      stagger: .12,
      duration: .45,
      ease: 'power2.out'
    })
      .to(imgs, {
        rotation: (i) => (i % 2 ? -2 : 2),
        yoyo: true,
        repeat: 1,
        transformOrigin: '50% 0%',
        duration: 1.2,
        ease: 'sine.inOut'
      }, 0.5);

    return tl;
  }

  function audioSoftScene() {
    const el = $('section[data-scene="audioSoft"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (!imgs.length) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs, {
      opacity: 0,
      y: 30,
      stagger: .1,
      duration: .4,
      ease: 'power2.out'
    })
      .to(imgs, {
        y: -3,
        yoyo: true,
        repeat: 2,
        duration: .6,
        ease: 'sine.inOut'
      }, 0.6);

    return tl;
  }

  function geminiScene() {
    const el = $('section[data-scene="gemini"]');
    if (!el) return gsap.timeline();
    const img = $('img', el);
    if (!img) return gsap.timeline();

    const ring = document.createElement('div');
    ring.style.cssText =
      'position:absolute; inset:auto 0 14% 0; margin:auto; width:18vw; height:18vw; ' +
      'max-width:220px; max-height:220px; border:2px solid rgba(40,10,80,.25); ' +
      'border-radius:50%; opacity:0;';
    el.appendChild(ring);

    const tl = gsap.timeline();
    tl.from(img, {
      opacity: 0,
      y: 20,
      duration: .5,
      ease: 'power2.out'
    })
      .to(ring, {
        opacity: 1,
        scale: 1.6,
        borderColor: 'rgba(40,10,80,.05)',
        duration: 1.2,
        ease: 'sine.out'
      }, 0.3)
      .to(ring, {
        opacity: 0,
        duration: .4
      }, 1.2)
      .call(AudioEngine.whoosh, null, 0.4);

    return tl;
  }

  function bonsaiScene() {
    const el = $('section[data-scene="bonsai"]');
    if (!el) return gsap.timeline();
    const imgs = $$('img', el);
    if (imgs.length < 2) return gsap.timeline();

    const tl = gsap.timeline();
    tl.from(imgs[0], {
      rotation: -1.2,
      transformOrigin: '50% 100%',
      duration: 1.2,
      ease: 'sine.inOut'
    })
      .from(imgs[1], {
        opacity: 0,
        y: 24,
        duration: .5,
        ease: 'power2.out'
      }, 0.2)
      .to(imgs[1], {
        filter: 'brightness(1.1) saturate(1.05)',
        duration: 1.1,
        ease: 'sine.inOut'
      }, 0.6);

    return tl;
  }

  function closerScene() {
    const el = document.querySelector('section.closer');
    if (!el) return gsap.timeline();
    const h = el.querySelector('h2');
    const btns = el.querySelectorAll('.actions .btn');

    const tl = gsap.timeline();
    tl.from(el, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
      .from(h, {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, 0.1)
      .from(btns, {
        y: 12,
        opacity: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: 'power2.out'
      }, 0.3);

    return tl;
  }

  /* -----------------------------
     MASTER REEL (one continuous motion)
  --------------------------------*/
  const reel = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.out' }
  });

  function addScene(label, tl) {
    if (!tl || typeof tl.totalDuration !== 'function') return;
    const d = tl.totalDuration();
    if (!d || d <= 0) return;
    reel.addLabel(label, reel.duration());
    reel.add(tl, '>');
  }

  // order must mirror your HTML sequence
  addScene('hero', heroScene());
  addScene('s63', s63Scene());
  addScene('drivers', driversScene());
  addScene('hoodie', hoodieScene());
  addScene('watch', watchScene());
  addScene('linen', linenScene());
  addScene('clubmaster', clubmasterScene());
  addScene('herod', herodScene());
  addScene('creamBlazer', creamBlazerScene());
  addScene('gg', goldenGooseScene());
  addScene('joggers', joggersScene());
  addScene('cardigans', cardiganScene());
  addScene('blazers', blazersScene());
  addScene('vnecks', vnecksScene());
  addScene('velvet', velvetScene());
  addScene('chains', chainsScene());
  addScene('suits', suitsScene());
  addScene('purple', purpleScene());
  addScene('chinos', chinosScene());
  addScene('games', gamesScene());
  addScene('ultima', ultimaScene());
  addScene('exotics', exoticsScene());
  addScene('desk', deskScene());
  addScene('dubai', dubaiScene());
  addScene('sweatersbagpen', sweatersBagPenScene());
  addScene('frags', fragsScene());
  addScene('underglow', underglowScene());
  addScene('dji', djiScene());
  addScene('embody', embodyScene());
  addScene('poloTrousers', poloScene());
  addScene('fingears', fingearsScene());
  addScene('pwatch', pwatchScene());
  addScene('audioSoft', audioSoftScene());
  addScene('gemini', geminiScene());
  addScene('bonsai', bonsaiScene());
  addScene('closer', closerScene());

  /* -----------------------------
     START AFTER ASSETS READY
  --------------------------------*/
  async function start() {
    try {
      await Promise.race([
        preloadImages(preloadList),
        new Promise(res => setTimeout(res, 1600))
      ]);
    } catch (e) {
      console.warn('Image preload issue, continuing.', e);
    }

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch(e) {}
    }

    const total = reel.totalDuration() || 10;

    ScrollTrigger.create({
      animation: reel,
      trigger: main,
      start: 'top top',
      end: () => '+=' + total * SCROLL_PIXELS_PER_SEC,
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
      snap: {
        snapTo: 'labels',
        duration: 0.5,
        ease: 'power1.inOut'
      },
      onUpdate: (self) => {
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
  (function cursorMagnets() {
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
  })();
});
