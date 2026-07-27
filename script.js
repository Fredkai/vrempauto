/* ============================================================
   VREMP — Main Script  |  Apple × Mercury × Motion
   ============================================================ */
'use strict';

/* ── Utility ────────────────────────────────────────────────── */
const qs  = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp  = (a, b, t)   => a + (b - a) * t;

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursorDot  = qs('#cursor-dot');
const cursorRing = qs('#cursor-ring');

if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cursorDot.style.left = mx + 'px';
        cursorDot.style.top  = my + 'px';
    });

    const animRing = () => {
        rx = lerp(rx, mx, 0.12);
        ry = lerp(ry, my, 0.12);
        cursorRing.style.left = rx + 'px';
        cursorRing.style.top  = ry + 'px';
        rafId = requestAnimationFrame(animRing);
    };
    animRing();

    // Hover state
    document.addEventListener('mouseover', e => {
        const el = e.target.closest('a, button, .magnetic, .faq-question, .search-tab, .quick-chip');
        if (el) cursorRing.classList.add('hovering');
    });
    document.addEventListener('mouseout', e => {
        const el = e.target.closest('a, button, .magnetic, .faq-question, .search-tab, .quick-chip');
        if (el) cursorRing.classList.remove('hovering');
    });

    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
    document.addEventListener('mouseup',   () => cursorRing.classList.remove('clicking'));
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
qsa('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top  + r.height / 2);
        el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = '';
    });
});

/* ============================================================
   HERO CANVAS — animated dot grid
   ============================================================ */
const canvas = qs('#hero-canvas');
if (canvas) {
    const ctx2d = canvas.getContext('2d');
    let W, H, dots = [], mouseX = -9999, mouseY = -9999;
    const SPACING = 44;
    const RADIUS  = 1.2;
    const GLOW_R  = 160;
    const COLOR   = '0,102,255';

    const buildDots = () => {
        dots = [];
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        const cols = Math.ceil(W / SPACING) + 1;
        const rows = Math.ceil(H / SPACING) + 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dots.push({ x: c * SPACING, y: r * SPACING, ox: c * SPACING, oy: r * SPACING });
            }
        }
    };

    const drawDots = () => {
        ctx2d.clearRect(0, 0, W, H);
        for (const d of dots) {
            const dx   = mouseX - d.ox;
            const dy   = mouseY - d.oy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const pull = Math.max(0, 1 - dist / GLOW_R);
            const alpha = 0.12 + pull * 0.55;
            const size  = RADIUS + pull * 1.8;
            ctx2d.beginPath();
            ctx2d.arc(d.ox, d.oy, size, 0, Math.PI * 2);
            ctx2d.fillStyle = `rgba(${COLOR},${alpha})`;
            ctx2d.fill();
        }
        requestAnimationFrame(drawDots);
    };

    buildDots();
    drawDots();

    window.addEventListener('resize', buildDots);
    document.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
    });
}

/* ============================================================
   HERO PARALLAX — visual floats on scroll
   ============================================================ */
const heroVisual    = qs('#hero-visual');
const heroOrb1      = qs('.hero-orb-1');
const heroOrb2      = qs('.hero-orb-2');
const heroScrollHint = qs('#hero-scroll-hint');

window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (heroVisual)  heroVisual.style.transform  = `translateY(${sy * 0.18}px)`;
    if (heroOrb1)    heroOrb1.style.transform     = `translateY(${sy * 0.12}px)`;
    if (heroOrb2)    heroOrb2.style.transform     = `translateY(${-sy * 0.08}px)`;
    if (heroScrollHint) heroScrollHint.classList.toggle('hidden', sy > 120);
}, { passive: true });

/* ============================================================
   HERO SPLIT-LINE TEXT REVEAL (on page load)
   ============================================================ */
const splitInners = qsa('.split-inner');
setTimeout(() => {
    splitInners.forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 180);
    });
}, 400);

/* ============================================================
   HERO INLINE STAT COUNTERS (run immediately on load)
   ============================================================ */
const countEl = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur    = 2000;
    const start  = performance.now();
    const step   = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

setTimeout(() => {
    qsa('.hero-stat-num[data-count]').forEach(countEl);
}, 1600);

/* ============================================================
   REVEAL ON SCROLL — reveal-up / reveal-left / reveal-right / reveal-fade
   ============================================================ */
const revealEls = qsa('.reveal-fade, .reveal-up, .reveal-left, .reveal-right');

const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('on');
        revealObs.unobserve(entry.target);
    });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

revealEls.forEach(el => revealObs.observe(el));

/* ============================================================
   SHOWCASE PANEL PARALLAX — image slight drift on scroll
   ============================================================ */
const showcaseImgs = qsa('.showcase-img-wrap');

const showcaseScroll = () => {
    showcaseImgs.forEach(wrap => {
        const rect  = wrap.getBoundingClientRect();
        const wh    = window.innerHeight;
        const ratio = (wh - rect.top) / (wh + rect.height);
        const shift = (ratio - 0.5) * 40;
        const img   = wrap.querySelector('.showcase-img');
        if (img) img.style.transform = `translateY(${shift}px)`;
    });
};

window.addEventListener('scroll', showcaseScroll, { passive: true });
showcaseScroll();

/* ============================================================
   LOADING SCREEN
   ============================================================ */
const loadingScreen = qs('#loading-screen');
if (loadingScreen) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 700);
        }, 1400);
    });
}

/* ============================================================
   HEADER — scroll state
   ============================================================ */
const header = qs('#site-header');
if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */
const sections = qsa('section[id]');
const navLinks  = qsa('.main-nav-pill .nav-link');

const updateNav = () => {
    const y = window.scrollY + 160;
    let current = '';
    sections.forEach(s => { if (y >= s.offsetTop) current = s.id; });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
};

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id     = anchor.getAttribute('href');
    if (id === '#') return;
    const target = qs(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeMobileMenu();
});

/* ============================================================
   MOBILE MENU
   ============================================================ */
const hamburger  = qs('#hamburger-btn');
const mobileMenu = qs('#mobile-menu');
const menuClose  = qs('#mobile-menu-close');

const openMobileMenu = () => {
    mobileMenu?.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
};

const closeMobileMenu = () => {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

hamburger?.addEventListener('click', () =>
    mobileMenu?.classList.contains('open') ? closeMobileMenu() : openMobileMenu()
);
menuClose?.addEventListener('click', closeMobileMenu);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMobileMenu(); closeCart(); }
});

/* ============================================================
   CART STATE
   ============================================================ */
const cartState    = [];
const cartBadgeEl  = qs('.cart-badge');
const cartItemsList = qs('#cart-items-list');
const cartEmptyEl  = qs('#cart-empty');
const cartTotalEl  = qs('#cart-total-price');

const updateCartBadge = () => {
    if (!cartBadgeEl) return;
    cartBadgeEl.textContent     = cartState.length;
    cartBadgeEl.style.transform = 'scale(1.45)';
    setTimeout(() => cartBadgeEl.style.transform = '', 220);
};

const renderCart = () => {
    if (!cartItemsList) return;
    const empty = cartState.length === 0;
    if (cartEmptyEl)   cartEmptyEl.style.display  = empty ? 'flex' : 'none';
    cartItemsList.style.display = empty ? 'none' : 'flex';
    cartItemsList.innerHTML = '';
    let total = 0;
    cartState.forEach((item, i) => {
        const raw = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        total += raw;
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div class="cart-item-img"><img src="${item.img}" alt="${item.title}"></div>
            <div class="cart-item-info">
                <div class="cart-item-category">${item.category}</div>
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">${item.price}</div>
            </div>
            <button class="cart-item-remove" data-index="${i}" aria-label="Remove">
                <i class="fa-solid fa-xmark"></i>
            </button>`;
        cartItemsList.appendChild(li);
    });
    if (cartTotalEl) cartTotalEl.textContent = total > 0
        ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00';
};

cartItemsList?.addEventListener('click', e => {
    const btn = e.target.closest('.cart-item-remove');
    if (!btn) return;
    cartState.splice(parseInt(btn.dataset.index, 10), 1);
    updateCartBadge(); renderCart();
});

/* ============================================================
   CART DRAWER
   ============================================================ */
const cartDrawer   = qs('#cart-drawer');
const cartOverlay  = qs('#cart-overlay');
const cartToggle   = qs('#cart-toggle');
const cartClose    = qs('#cart-close');
const cartContinue = qs('#cart-continue');

const openCart = () => {
    cartDrawer?.classList.add('open');
    cartOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
};

const closeCart = () => {
    cartDrawer?.classList.remove('open');
    cartOverlay?.classList.remove('open');
    document.body.style.overflow = '';
};

cartToggle?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
cartContinue?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

/* ============================================================
   ADD TO CART + TOAST
   ============================================================ */
const showToast = (item) => {
    const c = qs('#toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `
        <div class="toast-img"><img src="${item.img}" alt="${item.title}"></div>
        <div class="toast-body">
            <strong>${item.title}</strong>
            <span>Added to cart</span>
        </div>
        <div class="toast-check"><i class="fa-solid fa-check"></i></div>`;
    c.appendChild(t);
    setTimeout(() => {
        t.classList.add('removing');
        setTimeout(() => t.remove(), 300);
    }, 2800);
};

qsa('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', function () {
        const card     = this.closest('.shop-card');
        const title    = card?.querySelector('.product-title')?.textContent.trim() || 'Part';
        const category = card?.querySelector('.product-category')?.textContent.trim() || '';
        const priceEl  = card?.querySelector('.product-price');
        const clone    = priceEl?.cloneNode(true);
        clone?.querySelector('.old-price')?.remove();
        const price = clone?.textContent.trim() || '';
        const img   = card?.querySelector('.shop-card-img img')?.src || '';
        cartState.push({ title, category, price, img });
        updateCartBadge(); showToast({ title, category, price, img });
        const orig = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-check"></i>';
        this.style.background  = 'var(--green)';
        this.style.borderColor = 'var(--green)';
        this.style.color       = '#000';
        setTimeout(() => {
            this.innerHTML         = orig;
            this.style.background  = '';
            this.style.borderColor = '';
            this.style.color       = '';
        }, 700);
    });
});

/* ============================================================
   SEARCH TABS
   ============================================================ */
qsa('.search-tab').forEach(tab => {
    tab.addEventListener('click', function () {
        const target = this.dataset.tab;
        qsa('.search-tab').forEach(t => t.classList.remove('active'));
        qsa('.search-panel').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        qs(`#panel-${target}`)?.classList.add('active');
    });
});

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
qsa('.faq-question').forEach(btn => {
    btn.addEventListener('click', function () {
        const item   = this.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        qsa('.faq-item.open').forEach(el => {
            el.classList.remove('open');
            el.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) { item.classList.add('open'); this.setAttribute('aria-expanded', 'true'); }
    });
});

/* ============================================================
   SCROLL-TO-TOP
   ============================================================ */
const scrollBtn = qs('#scroll-to-top');
if (scrollBtn) {
    window.addEventListener('scroll', () => {
        scrollBtn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   FADE-IN ON SCROLL (legacy .fade-in classes)
   ============================================================ */
const fadeEls = qsa('.fade-in, .fade-in-left, .fade-in-right, .fade-in-scale');
if ('IntersectionObserver' in window) {
    const fadeObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            fadeObs.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => fadeObs.observe(el));
} else {
    fadeEls.forEach(el => el.classList.add('visible'));
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
const contactForm = qs('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn  = this.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
        btn.disabled  = true;
        setTimeout(() => {
            btn.innerHTML         = '<i class="fa-solid fa-check"></i> Sent!';
            btn.style.background  = 'var(--green)';
            btn.style.borderColor = 'var(--green)';
            btn.style.color       = '#000';
            this.reset();
            setTimeout(() => {
                btn.innerHTML         = orig;
                btn.style.background  = '';
                btn.style.borderColor = '';
                btn.style.color       = '';
                btn.disabled          = false;
            }, 2500);
        }, 1200);
    });
}

/* ============================================================
   RIPPLE on .btn
   ============================================================ */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const x = e.clientX - r.left - s / 2;
    const y = e.clientY - r.top  - s / 2;
    const rip = document.createElement('span');
    Object.assign(rip.style, {
        position: 'absolute', width: `${s}px`, height: `${s}px`,
        left: `${x}px`, top: `${y}px`, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', transform: 'scale(0)',
        animation: 'rippleAnim 0.55s ease-out forwards', pointerEvents: 'none', zIndex: '10',
    });
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
});

/* ============================================================
   INIT
   ============================================================ */
renderCart();
