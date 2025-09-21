// Theme Management
class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                primary: '#0f172a',
                secondary: '#1e293b',
                accent: '#64ffda',
                text: '#e2e8f0',
                textSecondary: '#94a3b8',
                border: '#334155'
            },
            blue: {
                primary: '#0c4a6e',
                secondary: '#0369a1',
                accent: '#38bdf8',
                text: '#f0f9ff',
                textSecondary: '#bae6fd',
                border: '#0284c7'
            },
            purple: {
                primary: '#581c87',
                secondary: '#7c3aed',
                accent: '#c084fc',
                text: '#faf5ff',
                textSecondary: '#ddd6fe',
                border: '#8b5cf6'
            },
            green: {
                primary: '#14532d',
                secondary: '#166534',
                accent: '#4ade80',
                text: '#f0fdf4',
                textSecondary: '#bbf7d0',
                border: '#22c55e'
            }
        };

        this.currentTheme = localStorage.getItem('portfolio-theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeMenu = document.getElementById('theme-menu');
        const themeOptions = document.querySelectorAll('.theme-option');

        if (themeToggle && themeMenu) {
            themeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                themeMenu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                themeMenu.classList.remove('active');
            });

            themeOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const theme = e.target.getAttribute('data-theme');
                    this.setTheme(theme);
                    themeMenu.classList.remove('active');
                });
            });
        }
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        localStorage.setItem('portfolio-theme', themeName);
        this.applyTheme(themeName);
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;

        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-secondary', theme.secondary);
        root.style.setProperty('--color-accent', theme.accent);
        root.style.setProperty('--color-text', theme.text);
        root.style.setProperty('--color-text-secondary', theme.textSecondary);
        root.style.setProperty('--color-border', theme.border);

        // Add theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
    }
}

// Scroll Animation Manager
class ScrollAnimationManager {
    constructor() {
        this.animatedElements = [];
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupProgressBars();
        this.setupParallaxEffects();
        this.setupScrollIndicator();
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');

                    // Trigger skill bars animation if this is a skills page
                    if (entry.target.classList.contains('skill-category')) {
                        this.animateSkillBars(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupProgressBars() {
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateSkillBars(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.skill-category').forEach(el => {
            skillObserver.observe(el);
        });
    }

    animateSkillBars(skillCategory) {
        const progressBars = skillCategory.querySelectorAll('.skill-progress');
        progressBars.forEach((bar, index) => {
            const progress = bar.getAttribute('data-progress');
            setTimeout(() => {
                bar.style.width = progress + '%';
            }, index * 200);
        });
    }

    setupParallaxEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero');

            parallaxElements.forEach(element => {
                const speed = 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    setupScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                if (scrolled > 100) {
                    scrollIndicator.style.opacity = '0';
                } else {
                    scrollIndicator.style.opacity = '1';
                }
            });
        }
    }
}

// Project Filter Manager
class ProjectFilterManager {
    constructor() {
        this.init();
    }

    init() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');

                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter projects
                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                        card.classList.add('fade-in');
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('fade-in');
                    }
                });
            });
        });
    }
}

// Contact Form Manager
class ContactFormManager {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(form);
            });
        }
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');

        // Simulate form submission
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            submitBtn.textContent = 'Message Sent!';
            submitBtn.style.background = 'var(--color-accent)';

            setTimeout(() => {
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
                submitBtn.style.background = '';
                form.reset();
            }, 3000);
        }, 2000);
    }
}

// Dynamic Page Effects
class PageEffectsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupPageTransitions();
        this.setupHoverEffects();
        this.setupTypingAnimation();
    }

    setupPageTransitions() {
        // Add loading animation when navigating
        document.querySelectorAll('a[href$=".html"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.href !== window.location.href) {
                    document.body.classList.add('page-transition');
                }
            });
        });
    }

    setupHoverEffects() {
        // Enhanced hover effects for cards
        document.querySelectorAll('.feature, .project-card, .skill-category, .preview-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'translateY(-10px) scale(1.02)';
            });

            card.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    setupTypingAnimation() {
        const typingElement = document.querySelector('.hero-content h2');
        if (typingElement && typingElement.textContent.includes("Hi, I'm")) {
            const text = typingElement.textContent;
            typingElement.textContent = '';

            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    typingElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };

            setTimeout(typeWriter, 1000);
        }
    }
}

// Initialize all managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new ScrollAnimationManager();
    new ProjectFilterManager();
    new ContactFormManager();
    new PageEffectsManager();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add CSS custom properties fallback
if (!CSS.supports('(--color: red)')) {
    document.documentElement.style.setProperty = function(property, value) {
        this.style[property.replace('--', '')] = value;
    };
}