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
const EMAILJS_PUBLIC_KEY = '-TCmq_j4CY6exLNv7';
const EMAILJS_SERVICE_ID = 'service_xkc4s1k';
const EMAILJS_TEMPLATE_ID = 'template_t438vj8';
const EMAILJS_CART_TEMPLATE_ID = 'template_t438vj8';

/* ── Helpers ────────────────────────────────────────────── */
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// Focus-trap helpers for dialogs/overlays
let prevFocus = null;
let focusTrapElement = null;
const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapKeyHandler(e) {
    if (e.key !== 'Tab') return;
    const el = focusTrapElement;
    if (!el) return;
    const nodes = [...el.querySelectorAll(focusableSelector)].filter(n => n.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

function enableFocusTrap(container) {
    focusTrapElement = container;
    container?.addEventListener('keydown', trapKeyHandler);
}

function disableFocusTrap() {
    if (focusTrapElement) {
        focusTrapElement.removeEventListener('keydown', trapKeyHandler);
        focusTrapElement = null;
    }
}

/* ============================================================
   PRODUCT DATA & SEARCH
*/
let CATALOG = { products: [], rentals: [] };
let PRODUCTS = [];
let RENTALS = [];
const productGrid = qs('.shop-grid');
const searchResultsLabel = qs('#search-results');

const loadCatalog = async () => {
    try {
        const response = await fetch('catalog.json');
        if (!response.ok) throw new Error('Network response was not ok');
        CATALOG = await response.json();
        PRODUCTS = CATALOG.products || [];
        RENTALS = CATALOG.rentals || [];
    } catch (error) {
        console.error('Failed to load catalog.json:', error);
        PRODUCTS = [];
        RENTALS = [];
    }
};

const loadProducts = loadCatalog;

const normaliseText = (value) => String(value || '').toLowerCase();
const getSelectValue = (selector, fallback = '') => qs(selector)?.dataset.value || fallback;

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

const getCurrentLocationText = () => {
    const label = qs('.location-label');
    const text = label?.textContent?.trim();
    if (!text || text === 'Kigali, Rwanda') return '';
    return ` in ${text}`;
};

const updateSearchSummary = ({ total, queryText, searchType }) => {
    if (!searchResultsLabel) return;
    const queryPart = queryText ? ` for "${queryText}"` : '';
    const locationPart = getCurrentLocationText();
    if (total === 0) {
        searchResultsLabel.textContent = `No parts match${queryPart}${locationPart}.`;
        return;
    }
    searchResultsLabel.textContent = `Showing ${total} part${total === 1 ? '' : 's'}${queryPart}${locationPart}.`;
};

const setCurrentLocationLabel = (text) => {
    const label = qs('.location-label');
    if (!label) return;
    label.textContent = text || 'Kigali, Rwanda';
    const pill = qs('#current-location-pill');
    if (pill) {
        pill.style.borderColor = text && text !== 'Kigali, Rwanda' ? 'rgba(0, 102, 255, 0.5)' : 'rgba(255,255,255,0.1)';
    }
};

const detectCurrentLocation = () => {
    const button = qs('#use-current-location');
    if (!button) return;

    if (!navigator.geolocation) {
        setCurrentLocationLabel('Location unavailable');
        return;
    }

    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
            if (!response.ok) throw new Error('Reverse geocode failed');
            const data = await response.json();
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.county || 'your area';
            const country = address.country || 'your region';
            const display = `${city}, ${country}`;
            setCurrentLocationLabel(display);
            updateSearchSummary({
                total: filterProducts({ query: qs('.search-input')?.value.trim() || '', category: getSelectValue('#search-category', 'All Categories') }).length,
                queryText: qs('.search-input')?.value.trim() || '',
                searchType: 'part search'
            });
        } catch (error) {
            console.warn('Location detection failed:', error);
            setCurrentLocationLabel('Location unavailable');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }, () => {
        setCurrentLocationLabel('Location unavailable');
        button.disabled = false;
        button.innerHTML = originalText;
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
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
    const category = qs('#search-category')?.dataset.value || 'All Categories';
    const results = filterProducts({ query: queryInput, category });
    renderProducts(results);
    const queryText = queryInput || (category === 'All Categories' ? '' : category);
    updateSearchSummary({ total: results.length, queryText, searchType: 'part search' });
};

const performVehicleSearch = () => {
    const make = getSelectValue('#search-make');
    const model = getSelectValue('#search-model');
    const year = getSelectValue('#search-year');
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
    qs('.search-input')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performPartSearch();
        }
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

const scrollToTarget = (selector) => {
    const target = qs(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

qs('#header-search-toggle')?.addEventListener('click', () => {
    scrollToTarget('#search');
    setTimeout(() => qs('.search-input')?.focus(), 450);
});

qsa('.enterprise-card[data-interaction-target]').forEach(card => {
    const activate = () => scrollToTarget(card.dataset.interactionTarget);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
        }
    });
});

/* ============================================================
   EMAILJS INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    const currentLocationButton = qs('#use-current-location');
    currentLocationButton?.addEventListener('click', detectCurrentLocation);
    // Hide decorative icons from assistive tech; social links have labels
    qsa('i').forEach(ic => ic.setAttribute('aria-hidden', 'true'));
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
const navLinks = qsa('.main-nav-pill .nav-link');

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
const hamburger = qs('#hamburger-btn');
const mobileMenu = qs('#mobile-menu');
const menuClose = qs('#mobile-menu-close');

const openMobileMenu = () => {
    mobileMenu?.classList.add('open');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    // focus management
    prevFocus = document.activeElement;
    const firstLink = mobileMenu?.querySelector('.mobile-nav a');
    firstLink?.focus();
    enableFocusTrap(mobileMenu);
    document.body.style.overflow = 'hidden';
};

const closeMobileMenu = () => {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    disableFocusTrap();
    if (prevFocus) prevFocus.focus();
    document.body.style.overflow = '';
};

hamburger?.addEventListener('click', () =>
    mobileMenu?.classList.contains('open') ? closeMobileMenu() : openMobileMenu()
);
menuClose?.addEventListener('click', closeMobileMenu);

// Auto-close mobile menu when tapping any navigation link
qsa('.mobile-nav-link, .mobile-menu-footer a').forEach(link => {
    link.addEventListener('click', () => {
        closeMobileMenu();
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMobileMenu(); closeCart(); }
});

/* ============================================================
   CART STATE
   ============================================================ */
const cartState = [];
const cartBadgeEl = qs('.cart-badge');
const cartItemsList = qs('#cart-items-list');
const cartEmptyEl = qs('#cart-empty');
const cartTotalEl = qs('#cart-total-price');

const updateCartBadge = () => {
    if (!cartBadgeEl) return;
    cartBadgeEl.textContent = cartState.length;
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
const cartDrawer = qs('#cart-drawer');
const cartOverlay = qs('#cart-overlay');
const cartToggle = qs('#cart-toggle');
const cartClose = qs('#cart-close');
const cartContinue = qs('#cart-continue');

const openCart = () => {
    cartDrawer?.classList.add('open');
    cartOverlay?.classList.add('open');
    cartDrawer?.setAttribute('aria-hidden', 'false');
    cartToggle?.setAttribute('aria-expanded', 'true');
    prevFocus = document.activeElement;
    cartClose?.focus();
    enableFocusTrap(cartDrawer);
    document.body.style.overflow = 'hidden';
    renderCart();
};

const closeCart = () => {
    cartDrawer?.classList.remove('open');
    cartOverlay?.classList.remove('open');
    cartDrawer?.setAttribute('aria-hidden', 'true');
    cartToggle?.setAttribute('aria-expanded', 'false');
    disableFocusTrap();
    if (prevFocus) prevFocus.focus();
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
    btn.disabled = true;

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CART_TEMPLATE_ID, {
        items_list: itemsList,
        total: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item_count: cartState.length,
    }).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Quote Sent!';
        btn.style.background = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        btn.style.color = '#000';
        cartState.length = 0;
        updateCartBadge();
        renderCart();
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.disabled = false;
            closeCart();
        }, 3000);
    }).catch(() => {
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed — try email';
        btn.disabled = false;
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
const productDetailClose = qs('#product-detail-close');
const productDetailImage = qs('#product-detail-image');
const productDetailCategory = qs('#product-detail-category');
const productDetailTitle = qs('#product-detail-title');
const productDetailDesc = qs('#product-detail-desc');
const productDetailSku = qs('#product-detail-sku');
const productDetailStock = qs('#product-detail-stock');
const productDetailFeatures = qs('#product-detail-features');
const productDetailPrice = qs('#product-detail-price');
const modalAddCartBtn = qs('#modal-add-cart');
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
        total: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item_count: 1,
    }).then(() => {
        modalRequestQuoteBtn.innerHTML = '<i class="fa-solid fa-check"></i> Request Sent';
        modalRequestQuoteBtn.style.background = 'var(--green)';
        modalRequestQuoteBtn.style.borderColor = 'var(--green)';
        modalRequestQuoteBtn.style.color = '#000';
        setTimeout(() => {
            modalRequestQuoteBtn.innerHTML = 'Request Quote';
            modalRequestQuoteBtn.style.background = '';
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
// Ensure FAQ answers have IDs and aria-controls set on buttons
qsa('.faq-item').forEach((el, idx) => {
    const btn = el.querySelector('.faq-question');
    const ans = el.querySelector('.faq-answer');
    if (!btn || !ans) return;
    const aid = ans.id || `faq-answer-${idx + 1}`;
    ans.id = aid;
    ans.setAttribute('role', 'region');
    ans.setAttribute('aria-hidden', el.classList.contains('open') ? 'false' : 'true');
    btn.setAttribute('aria-controls', aid);
    btn.setAttribute('aria-expanded', el.classList.contains('open') ? 'true' : 'false');
    btn.addEventListener('click', function () {
        const isOpen = el.classList.contains('open');
        qsa('.faq-item.open').forEach(openEl => {
            openEl.classList.remove('open');
            const b = openEl.querySelector('.faq-question');
            const a = openEl.querySelector('.faq-answer');
            b?.setAttribute('aria-expanded', 'false');
            a?.setAttribute('aria-hidden', 'true');
        });
        if (!isOpen) {
            el.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            ans.setAttribute('aria-hidden', 'false');
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
        const btn = this.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;

        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
        btn.disabled = true;

        if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            /* Fallback — open mailto */
            const name = this.querySelector('[name="from_name"]')?.value || '';
            const email = this.querySelector('[name="reply_to"]')?.value || '';
            const company = this.querySelector('[name="company"]')?.value || '';
            const phone = this.querySelector('[name="phone"]')?.value || '';
            const message = this.querySelector('[name="message"]')?.value || '';
            const subject = encodeURIComponent('VREMP Inquiry from ' + name);
            const body = encodeURIComponent(
                `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`
            );
            window.location.href = `mailto:info@vrempauto.com?subject=${subject}&body=${body}`;
            btn.innerHTML = orig;
            btn.disabled = false;
            return;
        }

        emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
            .then(() => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
                btn.style.background = 'var(--green)';
                btn.style.borderColor = 'var(--green)';
                btn.style.color = '#000';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML = orig;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                    btn.disabled = false;
                }, 3000);
            })
            .catch((err) => {
                console.error('EmailJS error:', err);
                const code = err?.status || err?.text || JSON.stringify(err);
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Failed (${code})`;
                btn.disabled = false;
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
    const y = e.clientY - r.top - s / 2;
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
   MOBILE CATEGORY FILTER CHIPS
   ============================================================ */
const initCategoryChips = () => {
    const chipContainer = qs('#shop-category-chips');
    if (!chipContainer) return;

    chipContainer.addEventListener('click', e => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;

        chipContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const category = chip.dataset.cat || 'All Categories';
        const filtered = filterProducts({ category });
        renderProducts(filtered);

        // Synchronize search category dropdown if visible
        const searchCategorySelect = qs('#search-category');
        if (searchCategorySelect) {
            searchCategorySelect.dataset.value = category;
            const label = searchCategorySelect.querySelector('.custom-select-label');
            if (label) label.textContent = category;
        }
    });
};

/* ============================================================
   INIT
   ============================================================ */
const initApp = async () => {
    await loadCatalog();
    renderCart();
    renderProducts(PRODUCTS);
    renderRentals(RENTALS);
    initSearch();
    initProductListEvents();
    initRentalEvents();
    initCustomSelects();
    initCategoryChips();
};

initApp();

/* ============================================================
   RENTALS — dynamic rental grid
  ============================================================ */
const rentalGrid = qs('#rental-grid');

const loadRentals = loadCatalog;

const buildRentalCard = (rental) => `
    <article class="rental-card" data-id="${rental.id}">
        <div class="rental-thumb"><img src="${rental.img}" alt="${rental.title}"></div>
        <h4>${rental.title}</h4>
        <p class="rental-meta">${rental.meta}</p>
        <div class="rental-rates">
            <span>${rental.rates.daily}/day</span>
            <span>${rental.rates.weekly}/week</span>
        </div>
        <div style="margin-top:0.7rem;"><button class="btn btn-outline btn-sm btn-request-rental">Request Rental</button></div>
    </article>`;

const renderRentals = (items) => {
    if (!rentalGrid) return;
    if (!items || items.length === 0) {
        rentalGrid.innerHTML = '<p class="muted">No rental items available.</p>';
        return;
    }
    rentalGrid.innerHTML = items.map(buildRentalCard).join('');
};

const initRentalEvents = () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-request-rental');
        if (!btn) return;
        const card = btn.closest('.rental-card');
        const id = card?.dataset.id;
        const rental = RENTALS.find(r => r.id === id);
        if (rental) {
            const msg = qs('#message');
            const name = qs('#from_name');
            if (msg) msg.value = `Inquiry: Rental request for ${rental.title} (${rental.id}). Please contact me with availability and rates.`;
            if (name) name.focus();
            document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
};

/* ============================================================
   CUSTOM SELECT DROPDOWNS
   ============================================================ */
const initCustomSelects = () => {
    document.querySelectorAll('.custom-select').forEach(select => {
        const btn = select.querySelector('.custom-select-btn');
        const list = select.querySelector('.custom-select-list');
        const label = select.querySelector('.custom-select-label');
        if (!btn || !list || !label) return;
        // ARIA roles
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');
        list.setAttribute('role', 'listbox');

        btn.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = select.classList.contains('open');
            document.querySelectorAll('.custom-select.open').forEach(s => {
                s.classList.remove('open');
                s.querySelector('.custom-select-btn')?.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                select.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        list.querySelectorAll('li').forEach(item => {
            item.setAttribute('role', 'option');
            item.setAttribute('tabindex', '-1');
            item.addEventListener('click', e => {
                e.stopPropagation();
                const value = item.dataset.value;
                select.dataset.value = value;
                label.textContent = item.textContent;
                list.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
                item.classList.add('selected');
                select.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
        }
    });
};

initCustomSelects();


/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const scrollProgress = qs('#scroll-progress');
if (scrollProgress) {
    const updateScrollProgress = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + '%';
    };
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
}

/* ============================================================
   CUSTOM CURSOR (Desktop only)
   ============================================================ */
const cursorDot = qs('#cursor-dot');
const cursorRing = qs('#cursor-ring');

if (cursorDot && cursorRing && window.innerWidth > 1024) {
    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const animateCursor = () => {
        dotX += (mouseX - dotX) * 0.9;
        dotY += (mouseY - dotY) * 0.9;
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Cursor interactions
    const interactiveElements = 'a, button, .shop-card, .btn, input, select, textarea';
    document.addEventListener('mouseenter', (e) => {
        if (e.target.matches(interactiveElements)) {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
        }
    }, true);

    document.addEventListener('mouseleave', (e) => {
        if (e.target.matches(interactiveElements)) {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }, true);
}

/* ============================================================
   HERO ANIMATIONS — GSAP + ScrollTrigger
   ============================================================ */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Split text animation
    const splitLines = qsa('.split-line');
    splitLines.forEach((line, i) => {
        const inner = line.querySelector('.split-inner');
        if (inner) {
            gsap.from(inner, {
                y: 100,
                opacity: 0,
                duration: 1.2,
                ease: 'power4.out',
                delay: i * 0.15,
            });
        }
    });

    // Reveal animations
    qsa('.reveal-fade, .reveal-up').forEach((el, i) => {
        const isUp = el.classList.contains('reveal-up');
        gsap.from(el, {
            y: isUp ? 40 : 0,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            delay: 0.3 + (i * 0.1) + (el.classList.contains('reveal-delay-1') ? 0.2 : 0) + (el.classList.contains('reveal-delay-2') ? 0.4 : 0),
        });
    });

    // Counter animation for stats
    qsa('.hero-stat-num').forEach(num => {
        const target = parseInt(num.dataset.count || '0');
        gsap.from(num, {
            textContent: 0,
            duration: 2.5,
            ease: 'power2.out',
            delay: 0.8,
            snap: { textContent: 1 },
            onUpdate: function () {
                num.textContent = Math.floor(this.targets()[0].textContent).toLocaleString();
            }
        });
    });

    // Stagger animations for cards
    for (let i = 1; i <= 6; i++) {
        const cards = qsa(`.stagger-${i}`);
        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: cards[0],
                    start: 'top 80%',
                },
                y: 60,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1 * i,
            });
        }
    }

    // Floating cards animation
    qsa('.floating-card').forEach(card => {
        gsap.to(card, {
            y: -15,
            duration: 2.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
        });
    });

    // Section reveals
    qsa('.fade-in-scale, .fade-in-left, .fade-in-right').forEach(el => {
        let xStart = 0;
        if (el.classList.contains('fade-in-left')) xStart = -80;
        if (el.classList.contains('fade-in-right')) xStart = 80;

        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
            },
            x: xStart,
            scale: el.classList.contains('fade-in-scale') ? 0.9 : 1,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
        });
    });
}

/* ============================================================
   PARALLAX EFFECTS — Mouse move
   ============================================================ */
const heroVisual = qs('#hero-visual');
const heroParallax = qs('#hero-parallax');

if (heroParallax && window.innerWidth > 768 && typeof gsap !== 'undefined') {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        gsap.to(heroParallax, {
            x: x,
            y: y,
            duration: 0.8,
            ease: 'power2.out',
        });
    });
}

/* ============================================================
   3D PARTICLES — Three.js background
   ============================================================ */
if (typeof THREE !== 'undefined' && window.innerWidth > 768) {
    const heroVisualEl = qs('#hero-visual');
    if (heroVisualEl) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, heroVisualEl.offsetWidth / heroVisualEl.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(heroVisualEl.offsetWidth, heroVisualEl.offsetHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        renderer.domElement.style.pointerEvents = 'none';
        heroVisualEl.insertBefore(renderer.domElement, heroVisualEl.firstChild);

        // Create particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 150;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x4ea3ff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        camera.position.z = 5;

        // Animation
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        const animate = () => {
            requestAnimationFrame(animate);
            particlesMesh.rotation.x += 0.0005;
            particlesMesh.rotation.y += 0.0008;

            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;

            renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                camera.aspect = heroVisualEl.offsetWidth / heroVisualEl.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(heroVisualEl.offsetWidth, heroVisualEl.offsetHeight);
            }
        });
    }
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
if (typeof gsap !== 'undefined' && window.innerWidth > 1024) {
    qsa('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out',
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            });
        });
    });
}

/* ============================================================
   VEHICLE SELECTOR — Dynamic Model/Year filtering
   ============================================================ */
const vehicleMakeSelect = qs('#search-make');
const vehicleModelSelect = qs('#search-model');
const vehicleYearSelect = qs('#search-year');

// Extract unique values from products
const getUniqueValues = (key) => {
    const values = PRODUCTS.map(p => p[key]).filter(Boolean);
    return [...new Set(values)].sort();
};

const populateVehicleSelects = () => {
    if (vehicleMakeSelect && PRODUCTS.length > 0) {
        const makes = getUniqueValues('make');
        vehicleMakeSelect.innerHTML = '<option>Select Make</option>' +
            makes.map(m => `<option value="${m}">${m}</option>`).join('');
    }
};

const updateModelsForMake = (make) => {
    if (!vehicleModelSelect) return;
    if (!make || make === 'Select Make') {
        vehicleModelSelect.innerHTML = '<option>Select Model</option>';
        vehicleModelSelect.disabled = true;
        return;
    }
    const models = [...new Set(PRODUCTS.filter(p => p.make === make).map(p => p.model).filter(Boolean))].sort();
    vehicleModelSelect.innerHTML = '<option>Select Model</option>' +
        models.map(m => `<option value="${m}">${m}</option>`).join('');
    vehicleModelSelect.disabled = false;
};

const updateYearsForModel = (make, model) => {
    if (!vehicleYearSelect) return;
    if (!model || model === 'Select Model') {
        vehicleYearSelect.innerHTML = '<option>Select Year</option>';
        vehicleYearSelect.disabled = true;
        return;
    }
    const years = [...new Set(PRODUCTS.filter(p => p.make === make && p.model === model).map(p => p.year).filter(Boolean))].sort().reverse();
    vehicleYearSelect.innerHTML = '<option>Select Year</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
    vehicleYearSelect.disabled = false;
};

if (vehicleMakeSelect) {
    vehicleMakeSelect.addEventListener('change', (e) => {
        updateModelsForMake(e.target.value);
        if (vehicleYearSelect) {
            vehicleYearSelect.innerHTML = '<option>Select Year</option>';
            vehicleYearSelect.disabled = true;
        }
    });
}

if (vehicleModelSelect) {
    vehicleModelSelect.addEventListener('change', (e) => {
        const make = vehicleMakeSelect?.value;
        updateYearsForModel(make, e.target.value);
    });
}

// Call after products loaded
setTimeout(() => {
    if (PRODUCTS.length > 0) {
        populateVehicleSelects();
    }
}, 500);
