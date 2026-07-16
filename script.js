document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // Custom Cursor
    // ============================================================
    const cursor    = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.cursor-dot');

    document.addEventListener('mousemove', e => {
        if (cursor) cursor.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 500, fill: 'forwards' });
        if (cursorDot) { cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`; }
    });
    document.addEventListener('mouseleave', () => { if (cursor) cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { if (cursor) cursor.style.opacity = '1'; });

    const bindCursorHovers = () => {
        document.querySelectorAll('a, button, [data-tilt]').forEach(el => {
            el.addEventListener('mouseenter', () => { if (cursor) { cursor.style.transform = 'translate(-50%,-50%) scale(1.5)'; cursor.style.borderColor = 'rgba(0,242,254,.8)'; } });
            el.addEventListener('mouseleave', () => { if (cursor) { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; cursor.style.borderColor = 'var(--primary)'; } });
        });
    };
    bindCursorHovers();

    // ============================================================
    // Scroll Progress & Header Scrolled State
    // ============================================================
    const progressBar = document.querySelector('.scroll-progress');
    window.addEventListener('scroll', () => {
        const winScroll  = document.documentElement.scrollTop;
        const height     = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (progressBar) progressBar.style.width = ((winScroll / height) * 100) + '%';
    });

    // ============================================================
    // Reveal on Scroll
    // ============================================================
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.getAttribute('data-delay') || 0);
                setTimeout(() => entry.target.classList.add('revealed'), delay);
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ============================================================
    // Stat Counter (if any)
    // ============================================================
    document.querySelectorAll('.h-stat-val').forEach(stat => {
        const target = parseInt(stat.dataset.target);
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                let cur = 0, inc = target / 80;
                const tick = () => { if (cur < target) { cur += inc; stat.innerText = Math.ceil(cur); setTimeout(tick, 20); } else stat.innerText = target; };
                tick(); obs.disconnect();
            }
        }, { threshold: 0.5 });
        obs.observe(stat);
    });

    // ============================================================
    // Card Tilt
    // ============================================================
    const bindTilt = () => {
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const rx = ((e.clientY - rect.top)  - rect.height / 2) / 14;
                const ry = (rect.width / 2 - (e.clientX - rect.left)) / 14;
                card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    };
    bindTilt();

    // ============================================================
    // Logo Glitch
    // ============================================================
    const brand = document.getElementById('brand-logo');
    if (brand) {
        setInterval(() => {
            if (Math.random() > 0.95) {
                brand.style.opacity = '0.6';
                setTimeout(() => brand.style.opacity = '1', 60);
                setTimeout(() => brand.style.opacity = '0.8', 120);
                setTimeout(() => brand.style.opacity = '1', 180);
            }
        }, 2000);
    }

    // ============================================================
    // Search Button
    // ============================================================
    document.getElementById('search-btn')?.addEventListener('click', () => {
        const q = document.getElementById('search-input')?.value.trim();
        if (q) { alert(`Searching for: "${q}"`); }
    });

    // ============================================================
    // CART STATE
    // ============================================================
    let cart = [];

    const cartDrawer   = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartBody     = document.getElementById('cart-body-items');
    const cartCount    = document.getElementById('cart-count');
    const cartTotal    = document.getElementById('cart-total-amount');

    const openCart  = () => { cartDrawer?.classList.add('active'); cartBackdrop?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const closeCart = () => { cartDrawer?.classList.remove('active'); cartBackdrop?.classList.remove('active'); document.body.style.overflow = ''; };

    document.getElementById('cart-trigger')?.addEventListener('click', openCart);
    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    cartBackdrop?.addEventListener('click', closeCart);

    const calcTotal = () => cart.reduce((sum, item) => {
        return sum + (item.category === 'equipment' ? item.price * item.qty * item.days : item.price * item.qty);
    }, 0);

    const renderCart = () => {
        const total = calcTotal();
        const totalItems = cart.reduce((s, i) => s + i.qty, 0);
        if (cartCount) cartCount.innerText = totalItems;
        if (cartTotal) cartTotal.innerText = '$' + total.toLocaleString();

        if (!cartBody) return;
        if (cart.length === 0) {
            cartBody.innerHTML = `<p class="cart-empty-msg"><i class="fa-solid fa-cart-shopping" style="font-size:2.5rem;color:var(--text-muted);display:block;margin-bottom:1rem;"></i>Your cart is empty.<br>Add parts or equipment from the catalog.</p>`;
            return;
        }

        cartBody.innerHTML = '';
        cart.forEach((item, idx) => {
            const subtotal = item.category === 'equipment' ? item.price * item.qty * item.days : item.price * item.qty;
            const isRental = item.category === 'equipment';
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-top">
                    <div>
                        <div class="cart-item-name">${item.name}</div>
                        <span class="cart-item-type-badge ${isRental ? 'type-rental' : 'type-parts'}">${isRental ? 'Machinery Rental' : 'Spare Parts'}</span>
                    </div>
                    <button class="cart-item-remove" data-idx="${idx}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div class="cart-item-bottom">
                    <div class="qty-control">
                        <button class="qty-btn dec-btn" data-idx="${idx}">−</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn inc-btn" data-idx="${idx}">+</button>
                    </div>
                    ${isRental ? `<div class="rental-days-wrap"><span>Days:</span><input class="rental-days-input" type="number" min="1" max="90" value="${item.days}" data-idx="${idx}"></div>` : ''}
                    <div class="cart-item-price">$${subtotal.toLocaleString()}</div>
                </div>
            `;
            cartBody.appendChild(div);
        });

        // Bind controls
        cartBody.querySelectorAll('.cart-item-remove').forEach(btn =>
            btn.addEventListener('click', () => { cart.splice(+btn.dataset.idx, 1); renderCart(); }));
        cartBody.querySelectorAll('.inc-btn').forEach(btn =>
            btn.addEventListener('click', () => { cart[+btn.dataset.idx].qty++; renderCart(); }));
        cartBody.querySelectorAll('.dec-btn').forEach(btn =>
            btn.addEventListener('click', () => { const i = +btn.dataset.idx; cart[i].qty > 1 ? cart[i].qty-- : cart.splice(i,1); renderCart(); }));
        cartBody.querySelectorAll('.rental-days-input').forEach(input =>
            input.addEventListener('change', () => { let v = parseInt(input.value); if (isNaN(v)||v<1) v=1; cart[+input.dataset.idx].days = v; renderCart(); }));

        bindCursorHovers();
    };

    // Bind Add to Cart Buttons
    const bindAddButtons = () => {
        document.querySelectorAll('.add-to-cart-btn, .btn-circle-sm').forEach(btn => {
            btn.addEventListener('click', e => {
                const card = btn.closest('[data-category]');
                if (!card) return;
                const id       = card.dataset.id;
                const name     = card.querySelector('.part-name, .machine-name, h4')?.innerText || 'Item';
                const price    = parseFloat(card.dataset.price);
                const category = card.dataset.category;
                const existing = cart.find(i => i.id === id);
                if (existing) { existing.qty++; }
                else { cart.push({ id, name, price, category, qty: 1, days: category === 'equipment' ? 3 : 0 }); }
                renderCart();
                openCart();
            });
        });
    };
    bindAddButtons();

    // ============================================================
    // Checkout Modal
    // ============================================================
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutForm  = document.getElementById('checkout-form');
    const checkoutSucc  = document.getElementById('checkout-success');

    document.getElementById('checkout-trigger')?.addEventListener('click', () => {
        if (cart.length === 0) { alert('Your cart is empty.'); return; }
        closeCart();
        checkoutForm.style.display = '';
        checkoutSucc.style.display = 'none';
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    document.getElementById('checkout-modal-close')?.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    document.getElementById('close-receipt-btn')?.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    checkoutModal?.addEventListener('click', e => {
        if (e.target === checkoutModal) { checkoutModal.classList.remove('active'); document.body.style.overflow = ''; }
    });

    // Live Card Visual Updates
    document.getElementById('card-holder')?.addEventListener('input', e => {
        document.getElementById('cv-holder').innerText = e.target.value.toUpperCase() || 'YOUR NAME';
    });
    document.getElementById('card-number')?.addEventListener('input', e => {
        let val = e.target.value.replace(/\D/g,'');
        let fmt = val.match(/.{1,4}/g)?.join(' ') || '';
        e.target.value = fmt;
        document.getElementById('cv-num').innerText = fmt || '•••• •••• •••• ••••';
    });
    document.getElementById('card-expiry')?.addEventListener('input', e => {
        let val = e.target.value.replace(/\D/g,'');
        if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2,4);
        e.target.value = val;
        document.getElementById('cv-exp').innerText = val || 'MM/YY';
    });

    // Checkout Form Submit
    checkoutForm?.addEventListener('submit', e => {
        e.preventDefault();
        const payBtnText   = document.getElementById('pay-btn-text');
        const payBtnLoader = document.getElementById('pay-btn-loader');
        payBtnText.style.display   = 'none';
        payBtnLoader.style.display = 'inline';

        setTimeout(() => {
            checkoutForm.style.display = 'none';
            checkoutSucc.style.display = 'block';

            // Build receipt
            const name    = document.getElementById('chk-name')?.value;
            const address = document.getElementById('chk-address')?.value;
            const orderNo = 'VRM-' + Math.floor(100000 + Math.random() * 900000);
            let rows = '', total = calcTotal();

            cart.forEach(item => {
                const sub = item.category === 'equipment' ? item.price * item.qty * item.days : item.price * item.qty;
                rows += `<div class="receipt-row"><span>${item.name} ×${item.qty}${item.category==='equipment'?` [${item.days}d]`:''}</span><span>$${sub.toLocaleString()}</span></div>`;
            });

            document.getElementById('receipt-details').innerHTML = `
                <div class="receipt-box">
                    <div class="receipt-row"><strong>Order</strong><strong>${orderNo}</strong></div>
                    <div class="receipt-row"><span>Client</span><span>${name}</span></div>
                    <div class="receipt-row"><span>Site</span><span>${address}</span></div>
                    <div style="margin:.8rem 0;border-top:1px dashed rgba(255,255,255,.08);"></div>
                    ${rows}
                    <div class="receipt-row total"><span>Total Charged</span><span>$${total.toLocaleString()}</span></div>
                </div>`;

            cart = [];
            renderCart();
            payBtnText.style.display   = 'inline';
            payBtnLoader.style.display = 'none';
        }, 1800);
    });

    // ============================================================
    // Inquiry / Partner Modal
    // ============================================================
    const inquiryModal = document.getElementById('inquiry-modal');
    const inquiryForm  = document.getElementById('inquiry-form');
    const inquirySucc  = document.getElementById('inquiry-success');

    const openInquiry = e => {
        e?.preventDefault();
        inquiryForm.style.display = '';
        inquirySucc.style.display = 'none';
        inquiryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const closeInquiry = () => { inquiryModal.classList.remove('active'); document.body.style.overflow = ''; };

    document.getElementById('apply-btn')?.addEventListener('click', openInquiry);
    document.getElementById('login-trigger')?.addEventListener('click', openInquiry);
    document.getElementById('custom-rental-trigger')?.addEventListener('click', openInquiry);
    document.getElementById('contact-nav-trigger')?.addEventListener('click', openInquiry);
    document.getElementById('inquiry-modal-close')?.addEventListener('click', closeInquiry);
    inquiryModal?.addEventListener('click', e => { if (e.target === inquiryModal) closeInquiry(); });

    inquiryForm?.addEventListener('submit', e => {
        e.preventDefault();
        const t = document.getElementById('inq-btn-text');
        const l = document.getElementById('inq-btn-loader');
        t.style.display = 'none'; l.style.display = 'inline';
        setTimeout(() => { inquiryForm.style.display = 'none'; inquirySucc.style.display = 'block'; t.style.display = 'inline'; l.style.display = 'none'; }, 1500);
    });

    // ============================================================
    // Help Form & Live Support triggers
    // ============================================================
    const helpForm = document.getElementById('help-support-form');
    const helpSuccess = document.getElementById('help-success');
    if (helpForm) {
        helpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnText = document.getElementById('help-btn-text');
            const btnLoader = document.getElementById('help-btn-loader');
            
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            
            setTimeout(() => {
                helpForm.style.display = 'none';
                helpSuccess.style.display = 'block';
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }, 1200);
        });
    }

    document.getElementById('whatsapp-trigger')?.addEventListener('click', () => {
        alert('Initiating VREMP WhatsApp Live Chat support portal...');
    });

    // Deals Countdown Timers
    const startDealsTimers = () => {
        const hrsElements = document.querySelectorAll('.timer-hrs');
        const minsElements = document.querySelectorAll('.timer-mins');
        
        setInterval(() => {
            hrsElements.forEach((hrsEl, idx) => {
                const minsEl = minsElements[idx];
                let hrs = parseInt(hrsEl.innerText);
                let mins = parseInt(minsEl.innerText);
                
                if (mins > 0) {
                    mins--;
                } else {
                    if (hrs > 0) {
                        hrs--;
                        mins = 59;
                    }
                }
                
                hrsEl.innerText = hrs.toString().padStart(2, '0');
                minsEl.innerText = mins.toString().padStart(2, '0');
            });
        }, 60000); // tick every minute
    };
    startDealsTimers();

    // ============================================================
    // FAQ Accordion
    // ============================================================
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });

});
