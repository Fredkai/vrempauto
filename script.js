/* ============================================================
   VREMP — Main Script
   ============================================================ */
'use strict';

/* ── EmailJS config ─────────────────────────────────────────
   HOW TO SET UP (free, 5 min):
   1. Go to https://www.emailjs.com and create a free account
   2. Add an Email Service (Gmail recommended) → copy Service ID
   3. Create an Email Template → copy Template ID
      Template variables to use: {{from_name}}, {{reply_to}},
      {{company}}, {{phone}}, {{message}}
   4. Go to Account → copy your Public Key
   5. Replace the three values below
   --------------------------------------------------------- */
const EMAILJS_PUBLIC_KEY  = '-TCmq_j4CY6exLNv7';
const EMAILJS_SERVICE_ID  = 'service_xkc4s1k';
const EMAILJS_TEMPLATE_ID = 'template_t438vj8';
const EMAILJS_CART_TEMPLATE_ID = 'template_t438vj8';

/* ── Helpers ────────────────────────────────────────────── */
const qs  = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ============================================================
   EMAILJS INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
});

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
   HEADER SCROLL
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
    const id = anchor.getAttribute('href');
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
const cartState     = [];
const cartBadgeEl   = qs('.cart-badge');
const cartItemsList = qs('#cart-items-list');
const cartEmptyEl   = qs('#cart-empty');
const cartTotalEl   = qs('#cart-total-price');

const updateCartBadge = () => {
    if (!cartBadgeEl) return;
    cartBadgeEl.textContent     = cartState.length;
    cartBadgeEl.style.transform = 'scale(1.45)';
    setTimeout(() => cartBadgeEl.style.transform = '', 220);
};

const renderCart = () => {
    if (!cartItemsList) return;
    const empty = cartState.length === 0;
    if (cartEmptyEl) cartEmptyEl.style.display = empty ? 'flex' : 'none';
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
    updateCartBadge();
    renderCart();
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
   CART CHECKOUT — sends quote request email
   ============================================================ */
const checkoutBtn = qs('#checkout-btn');
checkoutBtn?.addEventListener('click', () => {
    if (cartState.length === 0) return;

    const itemsList = cartState.map((item, i) =>
        `${i + 1}. ${item.title} (${item.category}) — ${item.price}`
    ).join('\n');

    const total = cartState.reduce((sum, item) => {
        return sum + (parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0);
    }, 0);

    const btn = checkoutBtn;
    const orig = btn.innerHTML;

    if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        /* EmailJS not configured yet — open mailto as fallback */
        const subject = encodeURIComponent('VREMP Quote Request');
        const body = encodeURIComponent(
            `Hello VREMP Team,\n\nI would like a quote for the following parts:\n\n${itemsList}\n\nEstimated Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nPlease contact me with pricing and availability.\n\nThank you`
        );
        window.location.href = `mailto:info@vrempauto.com?subject=${subject}&body=${body}`;
        closeCart();
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
    btn.disabled  = true;

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CART_TEMPLATE_ID, {
        items_list: itemsList,
        total:      `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item_count: cartState.length,
    }).then(() => {
        btn.innerHTML  = '<i class="fa-solid fa-check"></i> Quote Sent!';
        btn.style.background  = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        btn.style.color = '#000';
        cartState.length = 0;
        updateCartBadge();
        renderCart();
        setTimeout(() => {
            btn.innerHTML         = orig;
            btn.style.background  = '';
            btn.style.borderColor = '';
            btn.style.color       = '';
            btn.disabled          = false;
            closeCart();
        }, 3000);
    }).catch(() => {
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed — try email';
        btn.disabled  = false;
        setTimeout(() => { btn.innerHTML = orig; }, 3000);
    });
});

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
        updateCartBadge();
        showToast({ title, category, price, img });

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
        if (!isOpen) {
            item.classList.add('open');
            this.setAttribute('aria-expanded', 'true');
        }
    });
});

/* ============================================================
   CONTACT FORM — EmailJS
   ============================================================ */
const contactForm = qs('#contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn  = this.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;

        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
        btn.disabled  = true;

        if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            /* Fallback — open mailto */
            const name    = this.querySelector('[name="from_name"]')?.value || '';
            const email   = this.querySelector('[name="reply_to"]')?.value || '';
            const company = this.querySelector('[name="company"]')?.value || '';
            const phone   = this.querySelector('[name="phone"]')?.value || '';
            const message = this.querySelector('[name="message"]')?.value || '';
            const subject = encodeURIComponent('VREMP Inquiry from ' + name);
            const body    = encodeURIComponent(
                `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`
            );
            window.location.href = `mailto:info@vrempauto.com?subject=${subject}&body=${body}`;
            btn.innerHTML = orig;
            btn.disabled  = false;
            return;
        }

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
            .then(() => {
                btn.innerHTML         = '<i class="fa-solid fa-check"></i> Sent!';
                btn.style.background  = 'var(--green)';
                btn.style.borderColor = 'var(--green)';
                btn.style.color       = '#000';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML         = orig;
                    btn.style.background  = '';
                    btn.style.borderColor = '';
                    btn.style.color       = '';
                    btn.disabled          = false;
                }, 3000);
            })
            .catch((err) => {
                console.error('EmailJS error:', err);
                btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed — try again';
                btn.disabled  = false;
                setTimeout(() => { btn.innerHTML = orig; }, 3000);
            });
    });
}

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
   LEGACY FADE-IN
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
   RIPPLE
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
        animation: 'rippleAnim 0.55s ease-out forwards',
        pointerEvents: 'none', zIndex: '10',
    });
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
});

/* ============================================================
   INIT
   ============================================================ */
renderCart();
