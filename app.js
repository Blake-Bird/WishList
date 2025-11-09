/* ============================================================
   BLAKE — CHRISTMAS 2024–2025 - FIXED
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    if (typeof gsap === 'undefined') {
        console.error('GSAP not loaded');
        return;
    }
    
    gsap.registerPlugin(ScrollTrigger);
    
    const isReduced = false;
    const SCROLL_EASE = 0.08;
    const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
    
    function initSmoothScroll() {
        if (typeof Lenis === 'undefined') {
            console.warn('Lenis not available, using native scroll');
            ScrollTrigger.defaults({ scroller: window });
            return;
        }

        const lenis = new Lenis({
            lerp: SCROLL_EASE,
            wheelMultiplier: 1.05,
            normalizeWheel: true,
            smoothTouch: true
        });

        lenis.on('scroll', ScrollTrigger.update);

        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                if (arguments.length) {
                    lenis.scrollTo(value, { immediate: true });
                }
                return lenis.scroll;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: document.body.style.transform ? "transform" : "fixed"
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        ScrollTrigger.defaults({ scroller: document.body });
    }

    initSmoothScroll();

    const preload = (names) => names.forEach(n => { const i = new Image(); i.src = `./assets/${n}`; });
    const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
    const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
    const $ = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

    function pin(tl, el, start="top top", dur="+=200%") {
        if (!el) return;
        return ScrollTrigger.create({ animation: tl, trigger: el, start, end: dur, scrub: true, pin: true, anticipatePin: 1 });
    }

    function onceInView(el, cb){
        if (!el) return;
        const st = ScrollTrigger.create({
            trigger: el, start: "top 75%", onEnter: () => { cb(); st.kill(); }
        });
    }

    function tilt3D(el, max=10){
        let rect = el.getBoundingClientRect();
        function onMove(e){
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = map(y, 0, 1, max, -max);
            const ry = map(x, 0, 1, -max, max);
            el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
        function onLeave(){ el.style.transform = `perspective(900px) rotateX(0) rotateY(0)`; }
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        window.addEventListener('resize', ()=>rect = el.getBoundingClientRect());
    }

    const AudioEngine = (() => {
        let ctx, master;
        const nodes = new Map();

        function ensure(){
            if (ctx) return;
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = 0.4;
            master.connect(ctx.destination);
        }

        function tone({freq=440, dur=0.2, type='sine', attack=0.01, release=0.2, gain=0.2}){
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

        function chimeHi(){ tone({freq: 880, dur: .08, type:'triangle', gain:.18}); tone({freq:1320, dur:.06, type:'triangle', gain:.12}); }
        function chimeLo(){ tone({freq: 330, dur: .14, type:'sine', gain:.2}); }
        function whoosh(){
            ensure();
            const now = ctx.currentTime;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (1 - i/data.length);
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 400;
            const g = ctx.createGain(); g.gain.value = .35;
            src.connect(filter).connect(g).connect(master);
            src.start(now);
        }

        function unlockOnFirstGesture(){
            const start = () => { ensure(); document.removeEventListener('click', start); document.removeEventListener('touchstart', start); };
            document.addEventListener('click', start, {once:true});
            document.addEventListener('touchstart', start, {once:true});
        }

        return { chimeHi, chimeLo, whoosh, unlockOnFirstGesture };
    })();
    AudioEngine.unlockOnFirstGesture();

    preload([
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
    ]);

    function hero(){
        const heroLine = $('.hero-line');
        const heroH1 = $('.hero-copy h1');
        const heroP = $('.hero-copy p');
        
        if (heroLine && heroH1 && heroP) {
            gsap.set(heroLine, { width: 1 });
            gsap.set([heroH1, heroP], { y: 0, opacity: 1 });
            
            const tl = gsap.timeline();
            tl.fromTo(heroLine, {width:1}, {width:240, duration:1.2, ease:'expo.out', delay:.25})
              .from(heroH1, {y:30, opacity:0, duration:1.0, ease:'power3.out'}, '-=1.0')
              .from(heroP, {y:20, opacity:0, duration:1.0, ease:'power2.out'}, '-=0.8');
        }
    }

    function s63Scene(){
        const el = $('section[data-scene="s63"]'); if(!el) return;
        const frames = $$('.s63', el);
        const chips = $$('.spec-chips li', el);

        const tl = gsap.timeline({ defaults:{ ease:'none'}});
        tl.set(frames[0], {opacity:1, scale:1, rotate:0})
          .to(frames[0], {duration:0.33, opacity:0, scale:0.96}, 0.32)
          .fromTo(frames[1], {opacity:0, scale:1.02},{opacity:1, duration:0.33}, 0.32)
          .to(frames[1], {duration:0.33, opacity:0, y:-10}, 0.65)
          .fromTo(frames[2], {opacity:0, y:20},{opacity:1, y:0, duration:0.45}, 0.66);

        tl.from(chips, {y:20, opacity:0, stagger:0.07, duration:0.3}, 0.1);

        const sweep = document.createElement('div');
        sweep.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 45%, rgba(255,255,255,.6) 50%, transparent 55%);mix-blend-mode:screen;opacity:.0';
        el.appendChild(sweep);
        tl.to(sweep, {opacity:.6, duration:.2}, 0.15)
          .to(sweep, {backgroundPosition:'200% 0', duration:.8, ease:'power1.inOut'}, 0.18)
          .to(sweep, {opacity:0, duration:.25}, 1.05);

        const rim = document.createElement('div');
        rim.className='rim';
        rim.style.cssText='position:absolute; width:22vmin; height:22vmin; border-radius:50%; overflow:hidden; left:12%; bottom:18%; box-shadow:0 20px 60px rgba(0,0,0,.25)';
        const rimImg = new Image(); rimImg.src='./assets/s63_topdown.jpg'; rimImg.style.width='160%'; rimImg.style.transform='translate(-22%,-22%)';
        rim.appendChild(rimImg); el.appendChild(rim);
        tl.fromTo(rim,{scale:.2, rotation:-200, opacity:0},{scale:1, rotation:360, opacity:1, duration:.45, ease:'expo.out'}, 0.22)
          .to(rim,{scale:0.01, opacity:0, duration:.3, ease:'power2.in'}, .9);

        onceInView(el, ()=> { AudioEngine.whoosh(); setTimeout(AudioEngine.chimeHi, 180); });

        if(!isReduced) pin(tl, el, "top top", "+=220%");
    }

    function driversScene(){
        const el = $('section[data-scene="drivers"]'); if(!el) return;
        const img = $('img', el);
        const mask = document.createElement('canvas'); mask.width = mask.height = 1024; mask.className='suede-mask';
        mask.style.cssText = 'position:absolute; inset:0; margin:auto; max-width:min(85vw,1000px); border-radius:18px; mix-blend-mode:multiply; opacity:.0';
        el.appendChild(mask);
        const ctx = mask.getContext('2d');

        function drawNoise(t=0){
            const w=mask.width, h=mask.height;
            const imgd = ctx.createImageData(w,h);
            for(let i=0;i<imgd.data.length;i+=4){
                const n = Math.floor(128 + 127*Math.sin((i+t*1207)%255 * .05));
                imgd.data[i]=imgd.data[i+1]=imgd.data[i+2]=n; imgd.data[i+3]=60;
            }
            ctx.putImageData(imgd,0,0);
        }

        if(!isReduced){
            const tl = gsap.timeline();
            tl.fromTo(img, {scale:1.08, filter:'contrast(1.1) saturate(1.1) blur(2px)'},{scale:1, filter:'none', duration:.8, ease:'expo.out'}, 0);
            tl.to(mask, {opacity:.8, duration:.5}, 0.15);
            pin(tl, el, "top top", "+=180%");
            gsap.ticker.add(()=> drawNoise(performance.now()/1000));
        }

        const trail = document.createElement('canvas'); trail.width = trail.height = 1024;
        trail.style.cssText='position:absolute; inset:0; margin:auto; pointer-events:none; border-radius:18px;';
        el.appendChild(trail);
        const tctx = trail.getContext('2d');
        let last=0;
        el.addEventListener('mousemove', (e)=>{
            const r = trail.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width * trail.width;
            const y = (e.clientY - r.top) / r.height * trail.height;
            const now = performance.now(); if(now-last<12) return; last=now;
            tctx.fillStyle = 'rgba(0,0,0,.03)';
            tctx.beginPath(); tctx.arc(x,y, 40, 0, Math.PI*2); tctx.fill();
        });

        onceInView(el, ()=> AudioEngine.chimeLo());
    }

    function hoodieScene(){
        const el = $('section[data-scene="hoodie"]'); if(!el) return;
        const img = $('img', el);
        const tl = gsap.timeline();
        if(!isReduced){
            tl.fromTo(img,{y:-60, rotation:-2, transformOrigin:'50% 0', filter:'brightness(.92) contrast(1.1)'},
                      {y:0, rotation:0, duration:.9, ease:'elastic.out(1,0.6)'} );
            const stitch = document.createElement('div');
            stitch.style.cssText='position:absolute; inset:0; border-radius:18px; mix-blend-mode:overlay; background:linear-gradient(120deg, transparent 45%, rgba(255,255,255,.25) 50%, transparent 55%); opacity:0';
            el.appendChild(stitch);
            tl.to(stitch,{opacity:1, duration:.2}, .2)
              .to(stitch,{backgroundPosition:'200% 0', duration:.9, ease:'power1.inOut'}, .22)
              .to(stitch,{opacity:0, duration:.25}, 1.05);
            pin(tl, el, "top top", "+=160%");
        }
        onceInView(el, ()=> AudioEngine.chimeHi());
    }

    function watchScene(){
        const el = $('section[data-scene="watch"]'); if(!el) return;
        const date = $('.date-window', el);
        const img = $('img', el);

        const tl = gsap.timeline();
        tl.from(img, {scale:1.05, filter:'brightness(.95) contrast(1.05)', duration:.6, ease:'power2.out'}, 0);

        const caustic = document.createElement('div');
        caustic.style.cssText='position:absolute; inset:0; background:radial-gradient(60% 120% at 10% 20%, rgba(255,255,255,.5), transparent 60%), radial-gradient(40% 80% at 90% 80%, rgba(255,255,255,.35), transparent 60%); mix-blend-mode:screen; opacity:0';
        el.appendChild(caustic);
        tl.to(caustic, {opacity:.8, duration:.3}, .1).to(caustic, {opacity:0, duration:.5}, .7);

        const ticks = 8;
        for(let i=0;i<ticks;i++){
            tl.addLabel(`tick${i}`, i*(0.08));
            tl.to(img, {y: i%2? 0: -0.6, duration:.06, ease:'power2.inOut'}, `tick${i}`);
        }

        tl.fromTo(date, {rotationX:-90, transformOrigin:'50% 0', opacity:0},{rotationX:0, opacity:1, duration:.35, ease:'expo.out'}, .35);

        pin(tl, el, "top top", "+=140%");
        onceInView(el, ()=> { AudioEngine.chimeHi(); setTimeout(AudioEngine.chimeLo, 180); });
    }

    function linenScene(){
        const el = $('section[data-scene="linen"]'); if(!el) return;
        
        const imgs = $$('.color-weave img', el);
        const track = $('.color-weave', el);
        const tl = gsap.timeline({defaults:{ease:'none'}});
        tl.to(imgs, {xPercent: -100*(imgs.length-1), duration:1});
        pin(tl, el, "top top", "+=200%");

        track.addEventListener('mousemove', (e)=>{
            const r = track.getBoundingClientRect();
            const p = (e.clientX - r.left) / r.width;
            track.style.filter = `contrast(1.02) saturate(1.02) brightness(${1 + (p-0.5)*0.08})`;
        });
    }

    function clubmasterScene(){
        const el = $('section[data-scene="clubmaster"]'); if(!el) return;
        const frame = $('.frame', el), lens = $('.lens-bg', el);

        if(!isReduced){
            tilt3D(frame, 8);
            const tl = gsap.timeline();
            tl.from(frame, {y:40, opacity:0, duration:.6, ease:'expo.out'}, 0)
              .from(lens, {opacity:0, scale:.9, duration:.6, ease:'power2.out'}, 0.1)
              .to(lens, {backgroundPosition: '200% 0', duration:1.2, ease:'sine.inOut'}, 0.2);
            pin(tl, el, "top top", "+=150%");
        }
        onceInView(el, ()=> AudioEngine.chimeHi());
    }

    function herodScene(){
        const el = $('section[data-scene="herod"]'); if(!el) return;
        const cvs = $('.vapor', el); const ctx = cvs.getContext('2d');
        function resize(){ const r = el.getBoundingClientRect(); cvs.width=r.width*PIXEL_RATIO; cvs.height=r.height*PIXEL_RATIO; }
        resize(); window.addEventListener('resize', resize, {passive:true});

        const N = 140, P = [];
        for(let i=0;i<N;i++){
            P.push({x:Math.random()*cvs.width, y:Math.random()*cvs.height*0.9, vx:(Math.random()-.5)*0.2, vy:-Math.random()*0.25-0.05, a:Math.random()*0.6+0.2, r:Math.random()*2+1});
        }
        function step(){
            ctx.clearRect(0,0,cvs.width,cvs.height);
            for(const p of P){
                ctx.fillStyle = `rgba(210,160,120,${p.a})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
                p.x += p.vx; p.y += p.vy; p.a *= 0.996;
                if(p.y < -10 || p.a < 0.02){
                    p.x = Math.random()*cvs.width; p.y = cvs.height + Math.random()*30; p.vx=(Math.random()-.5)*0.2; p.vy=-Math.random()*0.25-0.05; p.a = Math.random()*0.6+0.2;
                }
            }
            requestAnimationFrame(step);
        }
        if(!isReduced) step();
        onceInView(el, ()=> AudioEngine.chimeLo());
    }

    function creamBlazerScene(){
        const el = $('section[data-scene="creamBlazer"]'); if(!el) return;
        const path = $('svg.stitch path', el);
        if(isReduced) return;
        const len = path.getTotalLength();
        gsap.set(path, {strokeDasharray: len, strokeDashoffset: len});
        const tl = gsap.timeline();
        tl.to(path, {strokeDashoffset: 0, duration: .9, ease:'power2.out'})
          .from($('.blueprint img', el), {scale:.96, opacity:0.8, duration:.8, ease:'power2.out'}, 0);
        pin(tl, el, "top top", "+=150%");
        onceInView(el, ()=> AudioEngine.chimeHi());
    }

    function goldenGooseScene(){
        const el = $('section[data-scene="gg"]'); if(!el) return;
        
        const shoe = $('.gg-shoe', el), ped = $('.gallery-pedestal', el);
        const tl = gsap.timeline();
        tl.fromTo(shoe, {rotate:-8, y:20, filter:'saturate(1.15) contrast(1.1)'},
                       {rotate:0, y:-6, duration:.7, ease:'expo.out'})
          .fromTo(ped, {scaleX:.2, opacity:0},{scaleX:1, opacity:1, duration:.5, ease:'power2.out'}, .2)
          .to(shoe, {y:-2, duration:.6, ease:'sine.inOut'})
          .to(shoe, {y:0, duration:.6, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=140%");
    }

    function joggersScene(){
        const el = $('section[data-scene="joggers"]'); if(!el) return;
        const img = $('img', el);
        
        const tl = gsap.timeline();
        tl.fromTo(img, {x:-1200, filter:'blur(8px)'}, {x:0, filter:'blur(0px)', duration:.8, ease:'expo.out'})
          .to(img, {y:10, duration:1.1, ease:'elastic.out(1,0.6)'}, .6);
        pin(tl, el, "top top", "+=120%");
        onceInView(el, ()=> AudioEngine.whoosh());
    }

    function cardiganScene(){
        const el = $('section[data-scene="cardigans"]'); if(!el) return;
        
        const imgs = $$('.zip-gallery img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {y:30, opacity:0, stagger:.12, duration:.45, ease:'power2.out'})
          .to(imgs, {scale:1.02, duration:1.0, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=150%");
    }

    function blazersScene(){
        const el = $('section[data-scene="blazers"]'); if(!el) return;
        
        const mans = $$('.mannequins img', el);
        const tl = gsap.timeline();
        mans.forEach((m,i)=>{
            tl.from(m, {y:40, opacity:0, duration:.5, ease:'power2.out'}, i*0.1)
              .to(m, {rotationY: (i%2? 1:-1)*18, transformOrigin:'50% 50% -300px', duration:1.2, ease:'sine.inOut'}, .4+i*0.05);
        });
        pin(tl, el, "top top", "+=200%");
    }

    function vnecksScene(){
        const el = $('section[data-scene="vnecks"]'); if(!el) return;
        
        const imgs = $$('.vneck-row img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {opacity:0, y:30, stagger:.1, duration:.4, ease:'power2.out'})
          .to(imgs, {y: -4, yoyo:true, repeat:1, duration:1.0, ease:'sine.inOut'}, .5);
        pin(tl, el, "top top", "+=120%");
    }

    function velvetScene(){
        const el = $('section[data-scene="velvet"]'); if(!el) return;
        const img = $('img', el);
        
        const sheen = document.createElement('div');
        sheen.style.cssText='position:absolute;inset:0;border-radius:18px;mix-blend-mode:soft-light;background:linear-gradient(120deg, rgba(255,255,255,.18), transparent 40%, rgba(0,0,0,.18)); opacity:0';
        el.appendChild(sheen);

        const tl = gsap.timeline();
        tl.from(img, {scale:1.02, opacity:0.8, duration:.6, ease:'power2.out'})
          .to(sheen, {opacity:1, backgroundPosition:'200% 0', duration:1.2, ease:'sine.inOut'}, .1)
          .to(sheen, {opacity:0.4, duration:.5}, 1.0);
        pin(tl, el, "top top", "+=130%");
    }

    function chainsScene(){
        const el = $('section[data-scene="chains"]'); if(!el) return;
        
        const imgs = $$('.chains-row img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {opacity:0, y:26, stagger:.08, duration:.4, ease:'power2.out'});
        imgs.forEach((im,i)=>{
            const sp = document.createElement('div');
            sp.style.cssText='position:absolute;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle, #fff, rgba(255,255,255,0)); filter:blur(.5px); opacity:0;';
            el.appendChild(sp);
            tl.to(sp, {opacity:1, x: (i*22)+40, y: (i%2? 60:20)+Math.random()*60, duration:.2}, .35+i*0.07)
              .to(sp, {opacity:0, y:'+=-20', duration:.35}, .52+i*0.07);
        });
        pin(tl, el, "top top", "+=120%");
    }

    function suitsScene(){
        const el = $('section[data-scene="suits"]'); if(!el) return;
        const img = $('img', el);
       
        const tl = gsap.timeline();
        tl.from(img, {clipPath:'inset(50% 50% 50% 50%)', duration:1.2, ease:'expo.out'})
          .to(img, {scale:1.02, duration:1.0, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=150%");
    }

    function purpleScene(){
        const el = $('section[data-scene="purple"]'); if(!el) return;
        
        const img = $('img', el);
        const line = document.createElement('div');
        line.style.cssText='position:absolute;height:2px;width:24px;background:#C9B37E;left:40%;top:40%;opacity:0;border-radius:999px';
        el.appendChild(line);
        const tl = gsap.timeline();
        tl.from(img, {opacity:0, y:20, duration:.5, ease:'power2.out'})
          .to(line, {opacity:1, x:120, duration:.6, ease:'sine.inOut'}, .2)
          .to(line, {opacity:0, duration:.2}, .9);
        pin(tl, el, "top top", "+=120%");
    }

    function chinosScene(){
        const el = $('section[data-scene="chinos"]'); if(!el) return;
        
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs[0], {x:-80, opacity:0, duration:.5, ease:'power2.out'})
          .from(imgs[1], {x:80, opacity:0, duration:.5, ease:'power2.out'}, .1);
        pin(tl, el, "top top", "+=110%");
    }

    function gamesScene(){
        const el = $('section[data-scene="games"]'); if(!el) return;
        const covers = $$('.covers img', el);
       
        const tl = gsap.timeline();
        tl.from(covers, {y:40, opacity:0, stagger:.08, duration:.35, ease:'power2.out'})
          .to(covers, {y:-4, yoyo:true, repeat:1, duration:1.0, ease:'sine.inOut'}, .5);
        pin(tl, el, "top top", "+=140%");

        covers.forEach((c,i)=> c.addEventListener('click', ()=>{
            AudioEngine.chimeHi();
            gsap.to(c, {scale:1.06, rotate:(i%2?-1:1)*1.2, yoyo:true, repeat:1, duration:.3});
        }));
    }

    function ultimaScene(){
        const el = $('section[data-scene="ultima"]'); if(!el) return;
        const photo = $('.ultima-photo', el);
        const rail = $$('.year-rail span', el);
        const cvs = $('.ultima-blueprint', el);
        
        const ctx = cvs.getContext('2d');
        function resize(){ const r = el.getBoundingClientRect(); cvs.width=r.width*PIXEL_RATIO; cvs.height=r.height*0.6*PIXEL_RATIO; }
        resize(); window.addEventListener('resize', resize, {passive:true});

        let prog = 0;
        function render(){
            ctx.clearRect(0,0,cvs.width,cvs.height);
            ctx.strokeStyle = 'rgba(80,60,140,.9)';
            ctx.lineWidth = 2*PIXEL_RATIO; ctx.setLineDash([12*PIXEL_RATIO, 12*PIXEL_RATIO]);
            const w = cvs.width, h = cvs.height;
            ctx.beginPath();
            ctx.moveTo(w*.05, h*.65);
            ctx.quadraticCurveTo(w*.35, h*.20, w*.75, h*.25);
            ctx.quadraticCurveTo(w*.92, h*.28, w*.95, h*.62);
            ctx.quadraticCurveTo(w*.70, h*.68, w*.40, h*.70);
            ctx.quadraticCurveTo(w*.18, h*.70, w*.05, h*.65);
            ctx.stroke();
            const step = 28*PIXEL_RATIO;
            ctx.globalAlpha = .18;
            for(let x=-h; x<w; x+=step){
                ctx.beginPath(); ctx.moveTo(x+prog*18, 0); ctx.lineTo(x+h+prog*18, h); ctx.stroke();
            }
            ctx.globalAlpha = 1;
            prog += 0.0025;
            requestAnimationFrame(render);
        }
        render();

        const tl = gsap.timeline();
        tl.from(photo, {opacity:0, scale:.96, duration:.9, ease:'expo.out'}, .4)
          .from(rail, {opacity:0, x:20, stagger:.15, duration:.35, ease:'power2.out'}, .2);
        pin(tl, el, "top top", "+=220%");
        onceInView(el, ()=> { AudioEngine.whoosh(); setTimeout(AudioEngine.chimeHi, 260); });
    }

    function exoticsScene(){
        const el = $('section[data-scene="exotics"]'); if(!el) return;
        
        const ribbon = $('.speed-ribbon', el);
        const cars = $$('.fleet img', el);
        const tl = gsap.timeline();
        tl.to(ribbon, {xPercent:100, repeat:1, yoyo:true, duration:1.4, ease:'sine.inOut'}, 0)
          .from(cars, {y:60, opacity:0, stagger:.12, duration:.45, ease:'power2.out'}, .2)
          .to(cars, {y:0, duration:1.0, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=180%");
        onceInView(el, ()=> AudioEngine.whoosh());
    }

    function deskScene(){
        const el = $('section[data-scene="desk"]'); if(!el) return;
        
        const items = $$('img', el);
        const tl = gsap.timeline({defaults:{ease:'power2.out'}});
        items.forEach((it,i)=> tl.from(it, {opacity:0, scale:.6, x:(i-1)*180, y:(i%2?-60:60), duration:.6}, i*0.08));
        pin(tl, el, "top top", "+=140%");
        onceInView(el, ()=> AudioEngine.chimeHi());
    }

    function dubaiScene(){
        const el = $('section[data-scene="dubai"]'); if(!el) return;
        
        const haze = $('.heat-haze', el);
        const tl = gsap.timeline();
        tl.from($('.s-dubai img', el), {opacity:0, y:20, duration:.6, ease:'power2.out'})
          .to(haze, {opacity:.9, duration:1.2, ease:'sine.inOut'}, .2)
          .to(haze, {opacity:.4, duration:1.0, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=150%");
    }

    function sbpScene(){
        const el = $('section[data-scene="sweatersbagpen"]'); if(!el) return;
       
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {opacity:0, y:30, stagger:.09, duration:.4, ease:'power2.out'})
          .to(imgs, {y:-3, yoyo:true, repeat:1, duration:1.0, ease:'sine.inOut'}, .6);
        pin(tl, el, "top top", "+=150%");
    }

    function fragsScene(){
        const el = $('section[data-scene="frags"]'); if(!el) return;
        const cvs = $('.constellation', el); const ctx = cvs.getContext('2d');
        function resize(){ const r = el.getBoundingClientRect(); cvs.width=r.width*PIXEL_RATIO; cvs.height=(r.height*.7)*PIXEL_RATIO; }
        resize(); window.addEventListener('resize', resize);

        const dots = new Array(80).fill(0).map(()=>({
            x: Math.random()*cvs.width, y: Math.random()*cvs.height, r: Math.random()*2+1, s: Math.random()*0.6+0.4, hue: Math.random()*360
        }));
        function step(){
            ctx.clearRect(0,0,cvs.width,cvs.height);
            for(const d of dots){
                d.x += (Math.random()-.5)*d.s; d.y += (Math.random()-.5)*d.s;
                if(d.x<0) d.x=0; if(d.y<0) d.y=0; if(d.x>cvs.width) d.x=cvs.width; if(d.y>cvs.height) d.y=cvs.height;
                ctx.fillStyle = `hsla(${d.hue}, 70%, 60%, 0.7)`;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2); ctx.fill();
            }
            requestAnimationFrame(step);
        }
        if(!isReduced) step();
        onceInView(el, ()=> AudioEngine.chimeLo());
    }

    function underglowScene(){
        const el = $('section[data-scene="underglow"]'); if(!el) return;
        
        const road = $('.road', el);
        const tl = gsap.timeline();
        tl.fromTo(road,{xPercent:-50, opacity:0},{xPercent:50, opacity:1, duration:1.2, ease:'sine.inOut'})
          .to(road,{background:'linear-gradient(90deg, #f0f, #0ff, #ff0, #f0f)', duration:1.2, ease:'none'}, .2);
        pin(tl, el, "top top", "+=120%");
    }

    function djiScene(){
        const el = $('section[data-scene="dji"]'); if(!el) return;
       
        const hud = $$('.hud span', el);
        const tl = gsap.timeline();
        tl.from(hud, {y:20, opacity:0, stagger:.12, duration:.35, ease:'power2.out'})
          .to(hud, {y:-3, yoyo:true, repeat:1, duration:1.0, ease:'sine.inOut'}, .5);
        pin(tl, el, "top top", "+=120%");
    }

    function embodyScene(){
        const el = $('section[data-scene="embody"]'); if(!el) return;
        
        const img = $('img', el);
        const tl = gsap.timeline();
        tl.from(img, {scale:1.02, opacity:0.85, duration:.5, ease:'power2.out'})
          .to(img, {transform:'perspective(900px) rotateX(8deg) rotateY(-6deg)', duration:.6, ease:'sine.inOut'})
          .to(img, {transform:'perspective(900px) rotateX(18deg) rotateY(0deg) translateY(6px)', duration:.9, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=140%");
    }

    function poloScene(){
        const el = $('section[data-scene="poloTrousers"]'); if(!el) return;
        
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {opacity:0, rotateY:-15, transformOrigin:'0% 50%', stagger:.1, duration:.45, ease:'power2.out'})
          .to(imgs, {rotateY:0, duration:.8, ease:'sine.inOut'});
        pin(tl, el, "top top", "+=120%");
    }

    function fingearsScene(){
        const el = $('section[data-scene="fingears"]'); if(!el) return;
        
        const img = $('img', el);
        const tl = gsap.timeline();
        tl.from(img, {y:30, opacity:0, duration:.45, ease:'power2.out'})
          .to(img, {rotation:360, repeat:1, yoyo:true, duration:1.2, ease:'sine.inOut'}, .4);
        pin(tl, el, "top top", "+=120%");
        img.addEventListener('mousemove', ()=> AudioEngine.chimeHi());
    }

    function pwatchScene(){
        const el = $('section[data-scene="pwatch"]'); if(!el) return;
        
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {y:40, opacity:0, stagger:.12, duration:.45, ease:'power2.out'})
          .to(imgs, {rotation: (i)=> (i%2? -2:2), yoyo:true, repeat:1, transformOrigin:'50% 0%', duration:1.2, ease:'sine.inOut'}, .5);
        pin(tl, el, "top top", "+=130%");
    }

    function audioSoftScene(){
        const el = $('section[data-scene="audioSoft"]'); if(!el) return;
       
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs, {opacity:0, y:30, stagger:.1, duration:.4, ease:'power2.out'})
          .to(imgs, {y:-3, yoyo:true, repeat:2, duration:.6, ease:'sine.inOut'}, .6);
        pin(tl, el, "top top", "+=120%");
    }

    function geminiScene(){
        const el = $('section[data-scene="gemini"]'); if(!el) return;
        
        const img = $('img', el);
        const ring = document.createElement('div');
        ring.style.cssText='position:absolute; inset:auto 0 14% 0; margin:auto; width:18vw; height:18vw; max-width:220px; max-height:220px; border:2px solid rgba(40,10,80,.25); border-radius:50%; opacity:0;';
        el.appendChild(ring);
        const tl = gsap.timeline();
        tl.from(img, {opacity:0, y:20, duration:.5, ease:'power2.out'})
          .to(ring, {opacity:1, scale:1.6, borderColor:'rgba(40,10,80,.05)', duration:1.2, ease:'sine.out'}, .3)
          .to(ring, {opacity:0, duration:.4}, 1.2);
        pin(tl, el, "top top", "+=130%");
        onceInView(el, ()=> AudioEngine.whoosh());
    }

    function bonsaiScene(){
        const el = $('section[data-scene="bonsai"]'); if(!el) return;
        
        const imgs = $$('img', el);
        const tl = gsap.timeline();
        tl.from(imgs[0], {rotation:-1.2, transformOrigin:'50% 100%', duration:1.2, ease:'sine.inOut'})
          .from(imgs[1], {opacity:0, y:24, duration:.5, ease:'power2.out'}, .2)
          .to(imgs[1], {filter:'brightness(1.1) saturate(1.05)', duration:1.1, ease:'sine.inOut'}, .6);
        pin(tl, el, "top top", "+=130%");
    }

    function cursorMagnets(){
        const mags = $$('.btn, .links a, .cta .btn');
        mags.forEach(m=>{
            m.addEventListener('mouseenter', ()=> gsap.to(m, {y:-1, scale:1.02, duration:.2, ease:'power2.out'}));
            m.addEventListener('mouseleave', ()=> gsap.to(m, {y:0, scale:1.0, duration:.25, ease:'power2.out'}));
        });
    }

    function initAllAnimations() {
        console.log('Initializing animations...');
        
        hero();
        s63Scene();
        driversScene();
        hoodieScene();
        watchScene();
        linenScene();
        clubmasterScene();
        herodScene();
        creamBlazerScene();
        goldenGooseScene();
        joggersScene();
        cardiganScene();
        blazersScene();
        vnecksScene();
        velvetScene();
        chainsScene();
        suitsScene();
        purpleScene();
        chinosScene();
        gamesScene();
        ultimaScene();
        exoticsScene();
        deskScene();
        dubaiScene();
        sbpScene();
        fragsScene();
        underglowScene();
        djiScene();
        embodyScene();
        poloScene();
        fingearsScene();
        pwatchScene();
        audioSoftScene();
        geminiScene();
        bonsaiScene();
        cursorMagnets();
        
        setTimeout(() => {
            ScrollTrigger.refresh();
            console.log('All animations initialized!');
        }, 1000);
    }

    initAllAnimations();

    window.addEventListener('load', ()=>{
        if(!isReduced) gsap.to('.hero-line',{width:260, repeat:1, yoyo:true, duration:1.6, ease:'sine.inOut', delay:.8});
    });

});
