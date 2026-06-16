// main.js — Page animations

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  animateHero();
  animateSections();
});

function animateHero() {
  gsap.timeline({ delay: 0.1 })
    .fromTo('.hero-tag',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    .fromTo('.hero-headline', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
    .fromTo('.hero-sub',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
    .fromTo('.cta-btn',       { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .fromTo('.hero-note',     { opacity: 0 },         { opacity: 1, duration: 0.6 }, '-=0.1');
}

function animateSections() {
  gsap.utils.toArray('.section-headline').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  gsap.fromTo('.offer-card', { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.15,
    scrollTrigger: { trigger: '.offer-cards', start: 'top 85%' }
  });

  gsap.fromTo('.offer-cta-btn', { opacity: 0, y: 16 }, {
    opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
    scrollTrigger: { trigger: '.offer-cta', start: 'top 90%' }
  });

  gsap.fromTo('.final-sub', { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
    scrollTrigger: { trigger: '.final-cta', start: 'top 85%' }
  });

  gsap.fromTo('.final-cta .cta-btn', { opacity: 0, y: 16 }, {
    opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
    scrollTrigger: { trigger: '.final-cta', start: 'top 85%' },
    delay: 0.15
  });
}
