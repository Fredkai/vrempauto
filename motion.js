/* ============================================================
   VREMP — Motion Layer
   GSAP handles hero + cursor only.
   All scroll reveals use CSS classes (never hides content).
   ============================================================ */

window.addEventListener('load', () => {

  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     SCROLL PROGRESS BAR
  ========================================================= */
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    gsap.to(bar, {
      width: '100%', ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });
  }

  /* =========================================================
     HERO ANIMATIONS — safe, on load only, not scroll-gated
  ========================================================= */
  gsap.set('.split-inner', { yPercent: 110, opacity: 0 });
  gsap.to('.split-inner', { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power4.out', stagger: 0.22, delay: 0.2 });

  gsap.from('.hero-eyebrow', { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
  gsap.from('.hero-desc', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.55 });
  gsap.from('.hero-cta-group', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.70 });
  gsap.from('.hero-stats', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.85 });
  gsap.from('.hero-img-wrap', { scale: 0.93, opacity: 0, y: 30, duration: 1.2, ease: 'power4.out', delay: 0.3 });

  /* Hero stat count-up */
  document.querySelectorAll('.hero-stat-num[data-count]').forEach(el => {
    let obj = { val: 0 };
    const target = parseInt(el.getAttribute('data-count'), 10);
    gsap.to(obj, {
      val: target, duration: 2, delay: 1.2, ease: 'power2.out',
      onUpdate() { el.textContent = Math.floor(obj.val).toLocaleString('en-US'); }
    });
  });

  /* Hero parallax */
  const hv = document.getElementById('hero-visual');
  if (hv) gsap.to(hv, { y: 90, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 } });

  const hint = document.getElementById('hero-scroll-hint');
  if (hint) {
    ScrollTrigger.create({
      trigger: '.hero-section', start: 'top+=80 top',
      onEnter: () => gsap.to(hint, { opacity: 0, duration: 0.4 }),
      onLeaveBack: () => gsap.to(hint, { opacity: 1, duration: 0.4 }),
    });
  }

  /* =========================================================
     THREE.JS PARTICLES
  ========================================================= */
  if (typeof THREE !== 'undefined') {
    const hero = document.querySelector('.hero-section');
    if (hero) {
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(hero.offsetWidth, hero.offsetHeight);
      const cvs = renderer.domElement;
      cvs.classList.add('hero-js-canvas');
      cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
      cvs.setAttribute('aria-hidden', 'true');
      hero.insertBefore(cvs, hero.firstChild);

      const hc = hero.querySelector('.hero-container');
      const hp = hero.querySelector('.hero-parallax-layer');
      const hs = document.getElementById('hero-scroll-hint');
      if (hc) { hc.style.position = 'relative'; hc.style.zIndex = '2'; }
      if (hp) { hp.style.position = 'relative'; hp.style.zIndex = '1'; }
      if (hs) { hs.style.zIndex = '2'; }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, hero.offsetWidth / hero.offsetHeight, 0.1, 50);
      camera.position.z = 4;

      const N = 1800, pos = new Float32Array(N * 3), aCol = new Float32Array(N * 3), sz = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
        const t = Math.random();
        aCol[i * 3] = t * 0.3; aCol[i * 3 + 1] = 0.4 + t * 0.4; aCol[i * 3 + 2] = 1.0;
        sz[i] = Math.random() * 2.8 + 0.8;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(aCol, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) } },
        vertexShader: `
          attribute float size; attribute vec3 aColor;
          uniform float uTime; uniform vec2 uMouse;
          varying vec3 vCol; varying float vA;
          void main(){
            vCol=aColor;
            vec3 p=position;
            p.x+=sin(uTime*0.28+position.z*1.4)*0.1;
            p.y+=cos(uTime*0.18+position.x*0.7)*0.08;
            float d=(position.z+4.0)/8.0;
            p.x+=uMouse.x*d*0.9; p.y+=uMouse.y*d*0.6;
            vA=0.22+d*0.55;
            vec4 mv=modelViewMatrix*vec4(p,1.0);
            gl_PointSize=size*(300.0/-mv.z);
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          varying vec3 vCol; varying float vA;
          void main(){
            float d=length(gl_PointCoord-0.5);
            if(d>0.5)discard;
            float s=pow(1.0-d*2.0,1.6);
            gl_FragColor=vec4(vCol,s*vA);
          }`,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, vertexColors: false
      });

      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      let tmx = 0, tmy = 0, cmx = 0, cmy = 0;
      let hasTouchOrMouse = false;
      let touchTimeout;

      document.addEventListener('mousemove', e => {
        hasTouchOrMouse = true;
        tmx = (e.clientX / window.innerWidth - 0.5) * 2;
        tmy = (e.clientY / window.innerHeight - 0.5) * -2;
      }, { passive: true });

      const handleTouch = e => {
        if (e.touches && e.touches.length > 0) {
          hasTouchOrMouse = true;
          clearTimeout(touchTimeout);
          const touch = e.touches[0];
          tmx = (touch.clientX / window.innerWidth - 0.5) * 2.6;
          tmy = (touch.clientY / window.innerHeight - 0.5) * -2.6;
        }
      };

      document.addEventListener('touchstart', handleTouch, { passive: true });
      document.addEventListener('touchmove', handleTouch, { passive: true });
      document.addEventListener('touchend', () => {
        touchTimeout = setTimeout(() => { hasTouchOrMouse = false; }, 1200);
      }, { passive: true });

      const handleResize = () => {
        if (!hero) return;
        renderer.setSize(hero.offsetWidth, hero.offsetHeight);
        camera.aspect = hero.offsetWidth / hero.offsetHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));

      const clock = new THREE.Clock();
      (function tick() {
        requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        mat.uniforms.uTime.value = t;

        // Autonomous ethereal motion on mobile / when not actively touching
        if (!hasTouchOrMouse) {
          const autoX = Math.sin(t * 0.42) * 0.8 + Math.cos(t * 0.21) * 0.3;
          const autoY = Math.cos(t * 0.35) * 0.7 + Math.sin(t * 0.16) * 0.2;
          tmx += (autoX - tmx) * 0.03;
          tmy += (autoY - tmy) * 0.03;
        }

        cmx += (tmx - cmx) * 0.045;
        cmy += (tmy - cmy) * 0.045;
        mat.uniforms.uMouse.value.set(cmx, cmy);
        pts.rotation.y = t * 0.018 + cmx * 0.15;
        pts.rotation.x = Math.sin(t * 0.09) * 0.06 + cmy * 0.08;
        renderer.render(scene, camera);
      })();
    }
  }

  /* =========================================================
     CSS-CLASS SCROLL REVEALS
     Uses IntersectionObserver to add .in-view class.
     CSS transitions handle the animation.
     Content starts VISIBLE — CSS only hides when .will-animate
     is present, which we add only to elements below the fold.
  ========================================================= */
  const REVEAL_SELECTORS = [
    { sel: '.section-header', cls: 'rv-up', delay: 0 },
    { sel: '.showcase-copy', cls: 'rv-left', delay: 0 },
    { sel: '.showcase-visual', cls: 'rv-right', delay: 0 },
    { sel: '.search-card', cls: 'rv-up', delay: 0 },
    { sel: '.contact-form', cls: 'rv-right', delay: 0 },
    { sel: '.shop-card', cls: 'rv-up', delay: 0 },
    { sel: '.step-card', cls: 'rv-up', delay: 0 },
    { sel: '.testimonial-card', cls: 'rv-up', delay: 0 },
    { sel: '.faq-item', cls: 'rv-up', delay: 0 },
    { sel: '.footer-brand-col', cls: 'rv-up', delay: 0 },
    { sel: '.footer-col', cls: 'rv-up', delay: 0 },
    { sel: '.footer-bottom', cls: 'rv-up', delay: 0 },
    { sel: '.brand-strip', cls: 'rv-up', delay: 0 },
  ];

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  REVEAL_SELECTORS.forEach(({ sel, cls }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const alreadyVisible = r.top < window.innerHeight && r.bottom > 0;
      if (alreadyVisible) return; /* skip — don't touch visible content */
      el.classList.add('will-animate', cls);
      el.style.transitionDelay = (i % 6) * 0.08 + 's';
      io.observe(el);
    });
  });

  /* Section enter lines */
  document.querySelectorAll('section, .showcase-panel').forEach(sec => {
    sec.style.position = 'relative';
    const line = document.createElement('div');
    line.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:0;background:#0066ff;z-index:10;pointer-events:none;transition:width 1.2s cubic-bezier(0.16,1,0.3,1);';
    sec.prepend(line);
    const lineIO = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { line.style.width = '100%'; lineIO.disconnect(); }
    }, { threshold: 0.05 });
    lineIO.observe(sec);
  });

  /* Word split for data-split elements */
  document.querySelectorAll('[data-split]').forEach(el => {
    const r = el.getBoundingClientRect();
    const alreadyVisible = r.top < window.innerHeight;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w =>
      `<span style="display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.2;padding-bottom:0.04em"><span class="sw" style="display:inline-block;transition:transform 0.75s cubic-bezier(0.16,1,0.3,1),opacity 0.6s ease;${alreadyVisible ? '' : 'transform:translateY(110%) rotate(3deg);opacity:0;'}">${w}</span></span>`
    ).join(' ');

    if (!alreadyVisible) {
      const splitIO = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        el.querySelectorAll('.sw').forEach((w, i) => {
          setTimeout(() => { w.style.transform = 'translateY(0) rotate(0)'; w.style.opacity = '1'; }, i * 60);
        });
        splitIO.disconnect();
      }, { threshold: 0.2 });
      splitIO.observe(el);
    }
  });

  /* =========================================================
     CUSTOM CURSOR
  ========================================================= */
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (dot && ring && window.matchMedia('(pointer:fine)').matches) {
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    document.addEventListener('mousemove', e => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0, overwrite: true });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.14, ease: 'power2.out', overwrite: true });
    });
    document.querySelectorAll('a, button, .magnetic, .shop-card, .faq-question').forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.8, duration: 0.3, ease: 'power2.out' }));
      el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, duration: 0.3, ease: 'power2.out' }));
    });
    document.addEventListener('mousedown', () => gsap.to(ring, { scale: 0.6, duration: 0.15 }));
    document.addEventListener('mouseup', () => gsap.to(ring, { scale: 1, duration: 0.3 }));
  }

  /* =========================================================
     MAGNETIC BUTTONS
  ========================================================= */
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.35, ease: 'power2.out', overwrite: true });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)', overwrite: true });
    });
  });

});
