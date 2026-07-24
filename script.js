/* VREMP Premium Interactive Script */
document.addEventListener('DOMContentLoaded', function () {

    // ======================================
    // CART SYSTEM
    // ======================================
    let cartCount = 0;
    const cartBadge = document.querySelector('.cart-badge');

    function updateCartBadge() {
        if (cartBadge) {
            cartBadge.textContent = cartCount;
            // Pop animation
            cartBadge.style.transform = 'scale(1.35)';
            setTimeout(() => {
                cartBadge.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Add to cart buttons
    const addCartBtns = document.querySelectorAll('.btn-add-cart');
    addCartBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            cartCount++;
            updateCartBadge();

            // Success flash
            const originalIcon = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-check"></i>';
            this.style.background = '#10b981';
            this.style.borderColor = '#10b981';
            this.style.color = '#ffffff';
            setTimeout(() => {
                this.innerHTML = originalIcon;
                this.style.background = '';
                this.style.borderColor = '';
                this.style.color = '';
            }, 700);
        });
    });

    // ======================================
    // NAVIGATION - ACTIVE LINK ON SCROLL
    // ======================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.main-nav-pill .nav-link');

    function setActiveLink() {
        let currentId = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 200;
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                currentId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href').replace('#', '');
            if (href === currentId) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', setActiveLink);

    // ======================================
    // SMOOTH SCROLL FOR NAV LINKS
    // ======================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ======================================
    // CONTACT FORM SUBMISSION
    // ======================================
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.8';

            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
                submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                contactForm.reset();

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '';
                }, 2500);
            }, 1200);
        });
    }

    // ======================================
    // BUTTON RIPPLE EFFECT
    // ======================================
    const rippleButtons = document.querySelectorAll('.btn, .btn-add-cart, .icon-circle');
    rippleButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Skip if icon-circle
            if (this.classList.contains('icon-circle')) return;

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.35)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'rippleAnim 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '100';

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple keyframes dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes rippleAnim {
            to {
                transform: scale(2.5);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ======================================
    // Fade-in on scroll (IntersectionObserver)
    // ======================================
    const fadeTargets = document.querySelectorAll(
        '.shop-card, .category-card, .section-header, .hero-copy, .hero-visual, .contact-form'
    );

    fadeTargets.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        fadeTargets.forEach(el => observer.observe(el));
    } else {
        // Fallback: just show everything
        fadeTargets.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }

});
