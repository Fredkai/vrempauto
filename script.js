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
   PRODUCT DATA & SEARCH
*/
let PRODUCTS = [];
const productGrid = qs('.shop-grid');
const searchResultsLabel = qs('#search-results');

const loadProducts = async () => {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Network response was not ok');
        PRODUCTS = await response.json();
    } catch (error) {
        console.error('Failed to load products.json:', error);
        PRODUCTS = [];
    }
};

const normaliseText = (value) => String(value || '').toLowerCase();

const productMatchesSearch = (product, query, category) => {
    const text = [product.title, product.category, product.desc, product.sku, product.make, product.model, product.year, ...(product.keywords || [])].join(' ').toLowerCase();
    const queryMatch = !query || text.includes(query.toLowerCase());
    const categoryMatch = !category || category === 'All Categories' || product.category.toLowerCase().includes(category.toLowerCase());
    return queryMatch && categoryMatch;
};

const filterProducts = ({ query = '', category = 'All Categories', make = '', model = '', year = '' }) => {
    let results = PRODUCTS.slice();
    if (category && category !== 'All Categories') {
        results = results.filter(product => product.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (make && make !== 'Select Make') {
        results = results.filter(product => product.make.toLowerCase().includes(make.toLowerCase()));
    }
    if (model && model !== 'Select Model') {
        results = results.filter(product => product.model.toLowerCase().includes(model.toLowerCase()));
    }
    if (year && year !== 'Select Year') {
        results = results.filter(product => product.year.toLowerCase().includes(year.toLowerCase()));
    }
    if (query) {
        results = results.filter(product => productMatchesSearch(product, query, category));
    }
    return results;
};

const buildProductCard = (product, index) => {
    const priceLabel = product.oldPrice
        ? `${product.price} <span class="old-price">${product.oldPrice}</span>`
        : product.price;
    const featureSpans = product.features.map(feature => `<span><i class="fa-solid fa-check"></i> ${feature}</span>`).join('');
    return `
        <div class="shop-card fade-in stagger-${(index % 6) + 1}" data-product-id="${product.id}" data-sku="${product.sku}" data-stock="${product.stock}" data-desc="${product.desc}">
            <div class="shop-card-img">
                <img src="${product.img}" alt="${product.title}">
            </div>
            <div class="shop-card-body">
                <div class="product-category">${product.category}</div>
                <h4 class="product-title">${product.title}</h4>
                <div class="product-specs">
                    ${featureSpans}
                </div>
                <div class="product-footer">
                    <span class="product-price">${priceLabel}</span>
                    <button class="btn-add-cart" aria-label="Add to cart"><i class="fa-solid fa-cart-plus"></i></button>
                </div>
            </div>
        </div>`;
};

const renderProducts = (products) => {
    if (!productGrid) return;
    if (!products || products.length === 0) {
        productGrid.innerHTML = `
            <div class="shop-empty-state">
                <h3>No parts match your search.</h3>
                <p>Try a different part number, category, or vehicle selection.</p>
            </div>`;
        return;
    }
    productGrid.innerHTML = products.map(buildProductCard).join('');
};

const updateSearchSummary = ({ total, queryText, searchType }) => {
    if (!searchResultsLabel) return;
    const queryPart = queryText ? ` for "${queryText}"` : '';
    if (total === 0) {
        searchResultsLabel.textContent = `No parts match${queryPart}.`;
        return;
    }
    searchResultsLabel.textContent = `Showing ${total} part${total === 1 ? '' : 's'}${queryPart}.`;
};

const getProductById = (id) => PRODUCTS.find(product => product.id === id);

const addProductToCart = (product) => {
    if (!product) return;
    cartState.push({ title: product.title, category: product.category, price: product.price, img: product.img });
    updateCartBadge();
    showToast(product);
};

const initProductListEvents = () => {
    document.addEventListener('click', (event) => {
        const cartButton = event.target.closest('.btn-add-cart');
        if (cartButton) {
            event.stopPropagation();
            const card = cartButton.closest('.shop-card');
            const productId = card?.dataset.productId;
            const product = getProductById(productId);
            addProductToCart(product);
            cartButton.innerHTML = '<i class="fa-solid fa-check"></i>';
            cartButton.style.background = 'var(--green)';
            cartButton.style.borderColor = 'var(--green)';
            cartButton.style.color = '#000';
            setTimeout(() => {
                cartButton.innerHTML = '<i class="fa-solid fa-cart-plus"></i>';
                cartButton.style.background = '';
                cartButton.style.borderColor = '';
                cartButton.style.color = '';
            }, 700);
            return;
        }
        const card = event.target.closest('.shop-card');
        if (card && !event.target.closest('.btn-add-cart')) {
            const productId = card.dataset.productId;
            const product = getProductById(productId);
            if (product) openProductDetail(product);
        }
    });
};

const performPartSearch = () => {
    const queryInput = qs('.search-input')?.value.trim() || '';
    const category = qs('#search-category')?.value || 'All Categories';
    const results = filterProducts({ query: queryInput, category });
    renderProducts(results);
    const queryText = queryInput || (category === 'All Categories' ? '' : category);
    updateSearchSummary({ total: results.length, queryText, searchType: 'part search' });
};

const performVehicleSearch = () => {
    const make = qs('#search-make')?.value || '';
    const model = qs('#search-model')?.value || '';
    const year = qs('#search-year')?.value || '';
    const results = filterProducts({ make, model, year });
    const summaryQuery = [make, model, year].filter(Boolean).join(' ').trim();
    renderProducts(results);
    updateSearchSummary({ total: results.length, queryText: summaryQuery || 'vehicle search', searchType: 'vehicle search' });
};

const initSearch = () => {
    const [partSearchBtn, vehicleSearchBtn] = qsa('.btn-search');
    partSearchBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        performPartSearch();
    });
    vehicleSearchBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        performVehicleSearch();
    });
    qsa('.quick-chip').forEach(chip => {
        chip.addEventListener('click', (event) => {
            event.preventDefault();
            const query = chip.textContent.trim();
            const input = qs('.search-input');
            if (input) input.value = query;
            performPartSearch();
        });
    });
};

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
const stripeCheckoutBtn = qs('#stripe-checkout-btn');
const paypalCheckoutBtn = qs('#paypal-checkout-btn');

const createPaymentSession = async (endpoint, payload, button) => {
    if (!button) return null;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Redirecting…';
    button.disabled = true;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('checkout failed');
        return await response.json();
    } catch (error) {
        console.error(error);
        button.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Try Again';
        setTimeout(() => { button.innerHTML = originalText; button.disabled = false; }, 2200);
        return null;
    }
};

const handleStripeCheckout = async () => {
    if (cartState.length === 0) return;
    const session = await createPaymentSession('/api/checkout-session', {
        cart: cartState,
        success_url: `${window.location.origin}/checkout-success.html`,
        cancel_url: `${window.location.origin}/checkout-cancel.html`,
    }, stripeCheckoutBtn);
    if (session?.url) {
        window.location.href = session.url;
    }
};

const handlePaypalCheckout = async () => {
    if (cartState.length === 0) return;
    const order = await createPaymentSession('/api/paypal-order', {
        cart: cartState,
        return_url: `${window.location.origin}/checkout-success.html`,
        cancel_url: `${window.location.origin}/checkout-cancel.html`,
    }, paypalCheckoutBtn);
    if (order?.approveUrl) {
        window.location.href = order.approveUrl;
    }
};

stripeCheckoutBtn?.addEventListener('click', handleStripeCheckout);
paypalCheckoutBtn?.addEventListener('click', handlePaypalCheckout);

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

const productDetailOverlay = qs('#product-detail-overlay');
const productDetailClose   = qs('#product-detail-close');
const productDetailImage   = qs('#product-detail-image');
const productDetailCategory= qs('#product-detail-category');
const productDetailTitle   = qs('#product-detail-title');
const productDetailDesc    = qs('#product-detail-desc');
const productDetailSku     = qs('#product-detail-sku');
const productDetailStock   = qs('#product-detail-stock');
const productDetailFeatures= qs('#product-detail-features');
const productDetailPrice   = qs('#product-detail-price');
const modalAddCartBtn      = qs('#modal-add-cart');
const modalRequestQuoteBtn = qs('#modal-request-quote');
let currentProductDetail = null;

const formatFeatures = (card) => {
    return [...card.querySelectorAll('.product-specs span')].map(span => span.textContent.trim());
};

const openProductDetail = (product) => {
    if (!productDetailOverlay) return;
    currentProductDetail = product;
    productDetailImage.src = product.img;
    productDetailImage.alt = product.title;
    productDetailCategory.textContent = product.category;
    productDetailTitle.textContent = product.title;
    productDetailDesc.textContent = product.desc || 'Premium part engineered for professional-grade performance and reliable service life.';
    productDetailSku.textContent = product.sku || 'N/A';
    productDetailStock.textContent = product.stock || 'Check availability';
    productDetailPrice.textContent = product.price;
    productDetailFeatures.innerHTML = product.features.map(feature => `<li>${feature}</li>`).join('');
    productDetailOverlay.classList.add('open');
    productDetailOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
};

const closeProductDetail = () => {
    if (!productDetailOverlay) return;
    productDetailOverlay.classList.remove('open');
    productDetailOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentProductDetail = null;
};

productDetailClose?.addEventListener('click', closeProductDetail);
productDetailOverlay?.addEventListener('click', (event) => {
    if (event.target === productDetailOverlay) closeProductDetail();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProductDetail();
});

const requestQuoteForProduct = (product) => {
    const itemsList = [`1. ${product.title} (${product.category}) — ${product.price}`].join('\n');
    const total = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
    if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        const subject = encodeURIComponent(`VREMP Quote Request: ${product.title}`);
        const body = encodeURIComponent(
            `Hello VREMP Team,\n\nI would like a quote for the following part:\n\n${itemsList}\n\nEstimated Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nPlease contact me with pricing and availability.\n\nThank you`
        );
        window.location.href = `mailto:info@vrempauto.com?subject=${subject}&body=${body}`;
        closeProductDetail();
        return;
    }

    modalRequestQuoteBtn.disabled = true;
    modalRequestQuoteBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CART_TEMPLATE_ID, {
        items_list: itemsList,
        total:      `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item_count: 1,
    }).then(() => {
        modalRequestQuoteBtn.innerHTML = '<i class="fa-solid fa-check"></i> Request Sent';
        modalRequestQuoteBtn.style.background  = 'var(--green)';
        modalRequestQuoteBtn.style.borderColor = 'var(--green)';
        modalRequestQuoteBtn.style.color = '#000';
        setTimeout(() => {
            modalRequestQuoteBtn.innerHTML = 'Request Quote';
            modalRequestQuoteBtn.style.background  = '';
            modalRequestQuoteBtn.style.borderColor = '';
            modalRequestQuoteBtn.style.color = '';
            modalRequestQuoteBtn.disabled = false;
            closeProductDetail();
        }, 2200);
    }).catch(() => {
        modalRequestQuoteBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed';
        modalRequestQuoteBtn.disabled = false;
        setTimeout(() => { modalRequestQuoteBtn.innerHTML = 'Request Quote'; }, 2200);
    });
};

modalAddCartBtn?.addEventListener('click', () => {
    if (!currentProductDetail) return;
    cartState.push({
        title: currentProductDetail.title,
        category: currentProductDetail.category,
        price: currentProductDetail.price,
        img: currentProductDetail.img,
    });
    updateCartBadge();
    showToast(currentProductDetail);
    closeProductDetail();
});

modalRequestQuoteBtn?.addEventListener('click', () => {
    if (!currentProductDetail) return;
    requestQuoteForProduct(currentProductDetail);
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
                const code = err?.status || err?.text || JSON.stringify(err);
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Failed (${code})`;
                btn.disabled  = false;
                setTimeout(() => { btn.innerHTML = orig; }, 4000);
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
const initApp = async () => {
    await loadProducts();
    renderCart();
    renderProducts(PRODUCTS);
    initSearch();
    initProductListEvents();
};

initApp();
renderProducts(PRODUCTS);
initSearch();
initProductListEvents();

/* ============================================================
   CUSTOM SELECT DROPDOWNS
   ============================================================ */
const initCustomSelects = () => {
    document.querySelectorAll('.custom-select').forEach(select => {
        const btn   = select.querySelector('.custom-select-btn');
        const list  = select.querySelector('.custom-select-list');
        const label = select.querySelector('.custom-select-label');

        // Toggle open/close
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = select.classList.contains('open');
            // Close all others first
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
            if (!isOpen) select.classList.add('open');
        });

        // Select an option
        list.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', e => {
                e.stopPropagation();
                const value = item.dataset.value;
                select.dataset.value = value;
                label.textContent = item.textContent;
                list.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
                item.classList.add('selected');
                select.classList.remove('open');
            });
        });
    });

    // Close on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
        }
    });
};

initCustomSelects();
