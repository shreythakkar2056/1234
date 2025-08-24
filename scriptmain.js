// ------- Utilities & accessibility helpers -------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll (single observer)
(function () {
    const revealEls = document.querySelectorAll('.reveal');
    if (prefersReducedMotion) {
        revealEls.forEach(el => el.classList.add('visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
})();

// ------- Seat simulation (simulated API with localStorage persistence) -------
// Key: 'cg_seats' stores remaining seats number to persist during testing
(function () {
    const START_SEATS = 18;
    const key = 'cg_seats';
    function readSeats() {
        const s = localStorage.getItem(key);
        return s ? parseInt(s, 10) : START_SEATS;
    }
    function writeSeats(n) { localStorage.setItem(key, String(n)); }

    // Initialize if not present
    if (!localStorage.getItem(key)) writeSeats(START_SEATS);

    // "API" functions (simulate async)
    window.api = {
        getBatchStatus: () => new Promise(res => {
            setTimeout(() => res({ seats_left: readSeats(), last_reserved: Date.now() }), 250);
        }),
        reserveSeat: (payload) => new Promise((res, rej) => {
            setTimeout(() => {
                let s = readSeats();
                if (s <= 0) return rej({ error: 'sold_out' });
                s = Math.max(0, s - 1);
                writeSeats(s);
                res({ seats_left: s, success: true });
            }, 420);
        })
    };
})();

// ------- UI hooks for seats & CTAs -------
(function () {
    const seatIndicator = document.getElementById('seat-indicator');
    const liveSeatNumber = document.getElementById('live-seat-number');

    // --- Toast Notification Handler ---
    const showToast = (message, isError = false) => {
        const toastEl = document.getElementById('toastMsg');
        if (!toastEl) return;
        const toastBody = toastEl.querySelector('.toast-body');
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });

        toastBody.textContent = message;
        toastEl.classList.toggle('bg-danger', isError);
        toastEl.classList.toggle('bg-primary', !isError);

        bsToast.show();
    };

    async function refreshSeatsUI() {
        try {
            const data = await window.api.getBatchStatus();
            if (seatIndicator) seatIndicator.textContent = data.seats_left;
            if (liveSeatNumber) liveSeatNumber.textContent = Math.max(0, data.seats_left - 6);
        } catch (e) { /* ignore for now */ }
    }

    // initial load
    refreshSeatsUI();

    // polite polling every 10s to reflect changes (in real app use server push)
    setInterval(refreshSeatsUI, 10000);

    // Wire enroll modal triggers
    // const enrollModal = new bootstrap.Modal(document.getElementById('enrollModal'));
    // document.getElementById('enroll-btn').addEventListener('click', () => enrollModal.show());
    // document.getElementById('hero-cta-enroll').addEventListener('click', () => enrollModal.show());
    // document.getElementById('applyPremium').addEventListener('click', () => enrollModal.show());


    // Book mentor (open Calendly - replace URL)
    const bookCallBtn = document.getElementById('book-call');
    if (bookCallBtn) {
        bookCallBtn.addEventListener('click', () => {
            window.open('https://calendly.com/hgthakkar7964/30min', '_blank');
        });
    }

    // Book food call (new button)
    const bookFoodCallBtn = document.getElementById('book-food-call');
    if (bookFoodCallBtn) {
        bookFoodCallBtn.addEventListener('click', () => {
            window.open('https://calendly.com/hgthakkar7964/30min', '_blank');
        });
    }
    // Book  call (new button)
    const bookcall = document.getElementById('book-call-cta');
    if (bookcall) {
        bookcall.addEventListener('click', () => {
            window.open('https://calendly.com/hgthakkar7964/30min', '_blank');
        });
    }
    const heroCtaBookBtn = document.getElementById('hero-cta-book');
    if (heroCtaBookBtn) {
        heroCtaBookBtn.addEventListener('click', () => {
            window.open('https://calendly.com/hgthakkar7964/30min', '_blank');
        });
    }

    // Enroll form submit -> call simulated API
    const form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            // basic client-side validation
            if (!formData.get('name') || !formData.get('email') || !formData.get('phone')) {
                showToast('Please fill all required fields.', true);
                return;
            }

            // optimistic UI: disable submit
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            try {
                const res = await window.api.reserveSeat(Object.fromEntries(formData));
                showToast('Thanks — we received your seat request. Check your email for next steps.');
                setTimeout(() => {
                    const enrollModal = document.getElementById('enrollModal');
                    if (enrollModal) {
                        const modalInstance = bootstrap.Modal.getInstance(enrollModal);
                        if (modalInstance) modalInstance.hide();
                    }
                }, 600);
                const seatInd = document.getElementById('seat-indicator');
                if (seatInd) seatInd.textContent = res.seats_left;
                const liveSeatNum = document.getElementById('live-seat-number');
                if (liveSeatNum) liveSeatNum.textContent = Math.max(0, res.seats_left - 6);
            } catch (err) {
                if (err && err.error === 'sold_out') {
                    showToast('Sorry — this batch is sold out.', true);
                } else {
                    showToast('Something went wrong — try again.', true);
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm & Pay';
                }
            }
        });
    }

    // Reserve Masterclass button (placeholder)
    const reserveBtn = document.getElementById('reserve-masterclass');
    if (reserveBtn) reserveBtn.addEventListener('click', () => {
        // show a simple modal or redirect to masterclass booking
        window.open('https://calendly.com/your-masterclass', '_blank');
    });

})();

// --- Brochure Popup Modal Logic ---
(function () {
    const modal = document.getElementById('brochureModal');
    if (!modal) return;


    const closeBtn = modal.querySelector('.brochure-popup-close');
    const form = document.getElementById('brochureForm');
    const continueWithEmailLink = document.getElementById('continueWithEmail');
    const phoneWrapper = modal.querySelector('.phone-input-wrapper');
    const emailWrapper = modal.querySelector('.email-input-wrapper');
    const emailInput = emailWrapper ? emailWrapper.querySelector('input') : null;
    const phoneInput = phoneWrapper ? phoneWrapper.querySelector('input') : null;

    const showModal = () => {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10); // For transition
    };

    const hideModal = () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400); // Wait for transition
    };

    // Show modal after a delay
    setTimeout(showModal, 13000); // 13 seconds

    // Event listeners
    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Click on overlay
            hideModal();
        }
    });

    if (continueWithEmailLink && phoneWrapper && emailWrapper && emailInput && phoneInput) {
        continueWithEmailLink.addEventListener('click', (e) => {
            e.preventDefault();
            phoneWrapper.style.display = 'none';
            phoneInput.required = false;
            emailWrapper.style.display = 'block';
            emailInput.required = true;
            e.target.style.display = 'none'; // Hide the link itself
            const orDivider = modal.querySelector('.or-divider');
            if (orDivider) orDivider.style.display = 'none';
            const smallMuted = modal.querySelector('p.small.text-muted');
            if (smallMuted) smallMuted.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            const toastEl = document.getElementById('toastMsg');
            if (toastEl) {
                const toastBody = toastEl.querySelector('.toast-body');
                if (toastBody) toastBody.textContent = 'Thank you! Your brochure is on its way.';
                toastEl.className = 'toast align-items-center text-white bg-primary border-0';
                const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
                bsToast.show();
            }
            hideModal();
        });
    }
   
    // Enhanced Placement Carousel
function initializePremiumCarousel() {
    const carousel = document.querySelector('.placement-carousel');
    const items = document.querySelectorAll('.placement-item');
    
    // Clone items for seamless infinite scroll
    items.forEach(item => {
        const clone = item.cloneNode(true);
        carousel.appendChild(clone);
    });
    
    // Add smooth pause/resume on hover
    const carouselContainer = document.querySelector('.placement-carousel-container');
    
    carouselContainer.addEventListener('mouseenter', () => {
        carousel.style.animationPlayState = 'paused';
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        carousel.style.animationPlayState = 'running';
    });
    
    // Add individual item hover effects
    document.querySelectorAll('.placement-image-wrapper').forEach(wrapper => {
        wrapper.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        
        wrapper.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializePremiumCarousel, 500);
});

})();

// small keyboard accessibility helper
document.body.addEventListener('keyup', (e) => { if (e.key === 'Tab') document.documentElement.classList.add('kbd'); });

document.querySelectorAll('.whatsapp-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // analytics event placeholder:
        try { window.dataLayer && window.dataLayer.push({ event: 'click_whatsapp' }); } catch (e) { }
        // link has href already, default anchor behavior handles open
    });
});
function animateCounters() {
const counters = document.querySelectorAll('.counter');
counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const increment = target / 50;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        counter.textContent = Math.floor(current);
        if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
        }
    }, 30);
});
}
/* Scroll Trigger Animation JavaScript */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special handling for counters
                if (entry.target.classList.contains('success-metrics')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);

    // Observe all elements with fade-in-up class
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // Observe sections for counter animation
    document.querySelectorAll('.success-metrics').forEach(el => {
        observer.observe(el);
    });
}
/* Enhanced Counter Animation for Success Metrics */
function initializeSuccessMetrics() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                animateMetricCounters();
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe the success metrics section
    const metricsSection = document.querySelector('.success-metrics');
    if (metricsSection) {
        observer.observe(metricsSection);
    }
}

function animateMetricCounters() {
    const metricItems = document.querySelectorAll('.metric-item h3');
    
    metricItems.forEach((counter, index) => {
        const text = counter.textContent;
        let target = 0;
        let suffix = '';
        
        // Extract number and suffix
        if (text.includes('+')) {
            target = parseInt(text.replace('+', ''));
            suffix = '+';
        } else if (text.includes('₹') && text.includes('L')) {
            target = parseFloat(text.replace('₹', '').replace('L', ''));
            suffix = 'L';
        } else if (text.includes('%')) {
            target = parseInt(text.replace('%', ''));
            suffix = '%';
        } else {
            target = parseInt(text);
        }
        
        let current = 0;
        const increment = target / 60; // 60 frames for smooth animation
        const duration = 2000; // 2 seconds
        const frameRate = duration / 60;
        
        counter.classList.add('counting');
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                if (text.includes('₹')) {
                    counter.textContent = `₹${target}${suffix}`;
                } else {
                    counter.textContent = `${Math.floor(target)}${suffix}`;
                }
                clearInterval(timer);
            } else {
                if (text.includes('₹')) {
                    counter.textContent = `₹${current.toFixed(1)}${suffix}`;
                } else {
                    counter.textContent = `${Math.floor(current)}${suffix}`;
                }
            }
        }, frameRate);
        
        // Add stagger delay for each counter
        setTimeout(() => {
            // Counter animation starts
        }, index * 200);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeSuccessMetrics, 500);
});// Updated Video Testimonials Function
function initializeVideoTestimonials() {
  const videoCards = document.querySelectorAll('.video-testimonial-card');
  
  // Add loading animation to video cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  videoCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
  });

  // Add video event listeners
  videoCards.forEach(card => {
    const video = card.querySelector('video');
    if (video) {
      video.addEventListener('play', function() {
        console.log('Video started playing');
        // Add analytics tracking here if needed
      });
      
      video.addEventListener('loadstart', function() {
        // Video is starting to load
        this.style.opacity = '0.7';
      });
      
      video.addEventListener('loadeddata', function() {
        // Video data is loaded
        this.style.opacity = '1';
      });
    }
  });
}

// Make sure this runs after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeVideoTestimonials();
});



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeScrollAnimations, 500);
});
// Enhanced Page Loader with Logo Transition
class PageLoader {
    constructor() {
        this.loader = document.getElementById('pageLoader');
        this.loaderLogo = document.getElementById('loaderLogo');
        this.loadingText = document.getElementById('loadingText');
        this.progressBar = document.getElementById('progressBar');
        this.progress = 0;
        this.loadingMessages = [
            'Loading...',
            'Preparing your experience...',
            'Almost ready...',
            'Welcome to Connectogrowth!'
        ];
        this.currentMessageIndex = 0;
    }

    init() {
        this.simulateLoading();
        this.rotateLoadingMessages();
    }

    simulateLoading() {
        const duration = 3000; // 3 seconds total loading time
        const interval = 50; // Update every 50ms
        const increment = 100 / (duration / interval);

        const progressInterval = setInterval(() => {
            this.progress += increment + Math.random() * 5; // Add some randomness
            
            if (this.progress >= 100) {
                this.progress = 100;
                clearInterval(progressInterval);
                setTimeout(() => this.completeLoading(), 500);
            }
            
            this.updateProgress();
        }, interval);
    }

    updateProgress() {
        if (this.progressBar) {
            this.progressBar.style.width = `${Math.min(this.progress, 100)}%`;
        }
    }

    rotateLoadingMessages() {
        const messageInterval = setInterval(() => {
            if (this.progress >= 100) {
                clearInterval(messageInterval);
                return;
            }

            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
            if (this.loadingText) {
                this.loadingText.textContent = this.loadingMessages[this.currentMessageIndex];
            }
        }, 800);
    }

    completeLoading() {
        // Start logo transition animation
        this.startLogoTransition();
        
        // Hide loader after logo transition
        setTimeout(() => {
            this.hideLoader();
        }, 1500);
    }

    startLogoTransition() {
        if (this.loaderLogo && this.loader) {
            // Add transitioning class to loader
            this.loader.classList.add('logo-transitioning');
            
            // Add transition class to logo
            this.loaderLogo.classList.add('transitioning');
            
            // Hide other elements
            if (this.loadingText) this.loadingText.style.opacity = '0';
            if (this.progressBar) this.progressBar.parentElement.style.opacity = '0';
            
            // Hide loading ring
            const loadingRing = document.querySelector('.loading-ring');
            if (loadingRing) loadingRing.style.opacity = '0';
        }
    }

    hideLoader() {
        if (this.loader) {
            this.loader.classList.add('hidden');
            
            // Ensure navbar logo is visible and animate it in
            setTimeout(() => {
                const navbarLogo = document.querySelector('.navbar .brand img, .navbar .brand .logo');
                if (navbarLogo) {
                    navbarLogo.style.opacity = '0';
                    navbarLogo.style.transform = 'scale(0.8)';
                    navbarLogo.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        navbarLogo.style.opacity = '1';
                        navbarLogo.style.transform = 'scale(1)';
                    }, 100);
                }
                
                // Remove loader from DOM after animation
                setTimeout(() => {
                    if (this.loader.parentNode) {
                        this.loader.parentNode.removeChild(this.loader);
                    }
                }, 800);
            }, 200);
        }
    }
}

// Initialize page loader
document.addEventListener('DOMContentLoaded', function() {
    const pageLoader = new PageLoader();
    pageLoader.init();
});

// Alternative simple initialization if you prefer
function initPageLoader() {
    const loader = document.getElementById('pageLoader');
    const loaderLogo = document.getElementById('loaderLogo');
    const progressBar = document.getElementById('progressBar');
    
    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Start logo transition after loading complete
            setTimeout(() => {
                loader.classList.add('logo-transitioning');
                loaderLogo.classList.add('transitioning');
                
                // Hide loader
                setTimeout(() => {
                    loader.classList.add('hidden');
                }, 1500);
            }, 500);
        }
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }, 100);
}

// Use this simpler version if you prefer
// document.addEventListener('DOMContentLoaded', initPageLoader);

/* Sticky CTA JavaScript */
function initializeStickyCTA() {
    const stickyCTA = document.getElementById('stickyCTA');
    const heroSection = document.querySelector('.hero-section');
    
    window.addEventListener('scroll', () => {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY;
        
        if (scrollPosition > heroBottom + 200) {
            stickyCTA.classList.add('visible');
        } else {
            stickyCTA.classList.remove('visible');
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeStickyCTA);

/* FAQ JavaScript */
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Initialize FAQ
document.addEventListener('DOMContentLoaded', initializeFAQ);
    btn.classList.add('animate');
    setTimeout(() => btn.classList.remove('animate'), 1000);
    /* Course Modal Functionality */
function initializeCourseModals() {
    const courseCards = document.querySelectorAll('.course-card');
    const modal = document.getElementById('courseModal');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.getElementById('modalClose');
    
    // Course data
    const courseData = {
        'self-paced': {
            title: 'Self-Paced Digital Marketing',
            subtitle: '8-Week Recorded Program',
            curriculum: [
                {
                    week: 'Week 1',
                    title: 'Orientation + Fundamentals',
                    content: 'Learn funnels, ICP, KPIs → Create ICP + funnel map'
                },
                {
                    week: 'Week 2',
                    title: 'Web & Tracking Basics',
                    content: 'WordPress/Elementor, GA4/GTM → Build 1-page LP with events'
                },
                {
                    week: 'Week 3',
                    title: 'Content & Copy Foundations',
                    content: 'AIDA/PAS, Canva → Create 5 ad copies + calendar'
                },
                {
                    week: 'Week 4',
                    title: 'Organic Social',
                    content: 'IG/FB/LinkedIn → Develop 7-day plan + 2 reels scripts'
                },
                {
                    week: 'Week 5',
                    title: 'Meta Ads Intro',
                    content: 'Objectives, pixel, audiences → Lead-gen campaign plan'
                },
                {
                    week: 'Week 6',
                    title: 'Google Ads Intro',
                    content: 'Keywords, RSAs, conversions → Search campaign draft'
                },
                {
                    week: 'Week 7',
                    title: 'SEO Basics',
                    content: 'Topic research, on-page → 1 optimised blog'
                },
                {
                    week: 'Week 8',
                    title: 'Analytics + Automation',
                    content: 'GA4, Looker, Email/WA, Zapier → 2-page strategy + dashboard'
                }
            ],
            outcomes: 'Perfect for beginners who want to learn digital marketing fundamentals at their own pace. You\'ll complete practical projects and build a solid foundation in all key areas.'
        },
        'performance-marketing': {
            title: 'Performance Marketing',
            subtitle: '16-Week Live Skill Mastery Program',
            curriculum: [
                {
                    week: 'Weeks 1-4',
                    title: 'Foundations',
                    content: 'Ecosystem, WordPress/Elementor + GA4/GTM, copy sprint, creatives (Canva/CapCut)'
                },
                {
                    week: 'Weeks 5-8',
                    title: 'Social + Meta Ads',
                    content: 'Organic systems, Meta setup, testing, optimisation & scaling'
                },
                {
                    week: 'Weeks 9-12',
                    title: 'Performance + SEO',
                    content: 'Google Search/Display/YouTube, SEO on-page, remarketing, dashboards (Looker), CRO'
                },
                {
                    week: 'Weeks 13-16',
                    title: 'Automation + Client Readiness',
                    content: 'Email/WhatsApp flows, CRM basics, agency ops, Capstone build & demo'
                }
            ],
            outcomes: 'Launch working funnels & campaigns, show a dashboard, present a capstone; client-ready playbooks & templates. Perfect for those serious about performance marketing mastery.'
        },
        'career-accelerator': {
            title: 'Career Accelerator',
            subtitle: '48-Week Comprehensive Career Program',
            curriculum: [
                {
                    week: 'Phase 1 (W1-12)',
                    title: 'Deep Foundations',
                    content: 'Offers, web, tracking, copy/design, organic, Meta & Google basics, analytics'
                },
                {
                    week: 'Phase 2 (W13-24)',
                    title: 'Advanced Performance',
                    content: 'PMAX/Shopping, YouTube, attribution, SEO (clusters/on-page/technical), CRO, automation'
                },
                {
                    week: 'Phase 3 (W25-36)',
                    title: 'Specializations',
                    content: 'Choose: E-commerce / B2B-SaaS / Agency Building → Weekly deliverables + capstone demo'
                },
                {
                    week: 'Phase 4 (W37-44)',
                    title: 'Growth Systems',
                    content: 'Advanced automation, sales/pipeline, reporting, legal/finance, leadership, hackathon'
                },
                {
                    week: 'Phase 5 (W45-48)',
                    title: 'Career Ready',
                    content: 'Portfolio/resume lab, mock interviews, job fair & referrals, offer negotiation + 90-day plan'
                }
            ],
            outcomes: 'The most comprehensive program designed for serious career changers. Includes specialization tracks, portfolio building, and guaranteed placement support with our network of 50+ hiring partners.'
        }
    };
    
    // Add click event to course cards
    courseCards.forEach(card => {
        card.addEventListener('click', function() {
            const courseType = this.dataset.course;
            const course = courseData[courseType];
            
            if (course) {
                showModal(course);
            }
        });
    });
    
    // Show modal function
    function showModal(course) {
        const curriculumHTML = course.curriculum.map(item => `
            <div class="curriculum-item">
                <div class="curriculum-week">${item.week}: ${item.title}</div>
                <div class="curriculum-content">${item.content}</div>
            </div>
        `).join('');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${course.title}</h2>
                <p class="modal-subtitle">${course.subtitle}</p>
            </div>
            
            <div class="curriculum-section">
                <h3 class="curriculum-title">📚 Course Curriculum</h3>
                <div class="curriculum-list">
                    ${curriculumHTML}
                </div>
            </div>
            
            <div class="outcomes-section">
                <h3 class="outcomes-title">🎯 Program Outcomes</h3>
                <div class="outcomes-content">${course.outcomes}</div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Close modal events
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize course modals when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeCourseModals, 500);
});
// Particle Effect
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  function resizeCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.querySelector('.hero-section').offsetHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.8,
    dy: (Math.random() - 0.5) * 0.8
  }));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,166,255,0.7)";
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    connect();
    update();
    requestAnimationFrame(draw);
  }

  function update() {
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;
    });
  }

  function connect() {
    ctx.strokeStyle = "rgba(0,166,255,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  draw();
}
document.addEventListener("DOMContentLoaded", initParticles);
