// Section links (Work/Skills/About/Contact) use clean paths like
// /work instead of hash fragments like /#work — Vercel rewrites those
// paths to this same page, so on the homepage we just need to smooth
// -scroll to the right section and swap in the clean URL ourselves
// instead of letting the browser do a hash jump.
const SECTION_IDS = ['work', 'skills', 'about', 'contact'];

function scrollToSection(id, behavior) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior });
}

// Landing directly on /work (a fresh load, a bookmark, or arriving
// from another page's link) — jump straight there once the page has
// laid out, no visible scroll animation needed for an initial landing.
(() => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  if (SECTION_IDS.includes(path)) {
    window.addEventListener('load', () => scrollToSection(path, 'auto'));
  }
})();

// Clicking a section link while already on the homepage: scroll
// smoothly and push the clean URL, rather than navigating away.
document.querySelectorAll('a[href]').forEach(link => {
  const path = link.getAttribute('href').replace(/^\//, '');
  if (!SECTION_IDS.includes(path)) return;
  link.addEventListener('click', (e) => {
    if (!document.getElementById(path)) return;
    e.preventDefault();
    scrollToSection(path, 'smooth');
    history.pushState(null, '', `/${path}`);
  });
});

// Browser back/forward between section URLs on the homepage.
window.addEventListener('popstate', () => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  if (SECTION_IDS.includes(path)) {
    scrollToSection(path, 'smooth');
  } else if (document.getElementById('top')) {
    scrollToSection('top', 'smooth');
  }
});

// Nav background state on scroll
const nav = document.getElementById('nav');
const hero = document.querySelector('.hero, .project-hero');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  // solid once you've scrolled past the hero, instead of the
  // difference-blend look used over it
  const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : Infinity;
  if (window.scrollY > heroBottom - nav.offsetHeight) {
    nav.classList.add('solid');
  } else {
    nav.classList.remove('solid');
  }
}, { passive: true });

// Gentle reveal-on-scroll for cards and sections
const revealTargets = document.querySelectorAll('.project-card, .skill-group, .contact-links');

revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero entrance — the same lift-and-fade used for scroll-reveal
// elsewhere on the page, staggered piece by piece. Triggered by an
// IntersectionObserver like everything else, but re-armed on exit so
// it replays every time the hero scrolls back into view instead of
// only once per visit.
const heroSection = document.querySelector('.hero');
const heroReveal = [
  { el: document.querySelector('.hero h1'), delay: 0 },
  { el: document.querySelector('.hero-pitch'), delay: 220 },
  { el: document.querySelector('.hero-actions'), delay: 420 },
  { el: document.querySelector('.hero-photo'), delay: 300 },
].filter(item => item.el);

if (prefersReducedMotion) {
  heroReveal.forEach(({ el }) => { el.style.opacity = '1'; });
} else if (heroSection && heroReveal.length) {
  heroReveal.forEach(({ el }) => {
    el.style.transition = 'opacity 1.1s ease, transform 1.1s ease';
  });

  let heroTimeouts = [];

  const hideHero = () => {
    heroTimeouts.forEach(clearTimeout);
    heroTimeouts = [];
    heroReveal.forEach(({ el }) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
    });
  };

  const playHeroReveal = () => {
    heroTimeouts.forEach(clearTimeout);
    heroTimeouts = [];
    // Double rAF guarantees the opacity:0 state actually paints once
    // before it changes — without it, a delay of 0 can get batched
    // with the initial style and skip the transition entirely.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroReveal.forEach(({ el, delay }) => {
          heroTimeouts.push(setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay));
        });
      });
    });
  };

  hideHero();

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playHeroReveal();
      } else {
        hideHero();
      }
    });
  }, { threshold: 0.2 });
  heroObserver.observe(heroSection);
}

// Ambient MDR number field — a dense, slowly drifting sea of digits behind
// the skills grid, echoing the Macrodata Refinement work screens.
function buildMdrField(section) {
  const field = document.createElement('div');
  field.className = 'mdr-field';
  field.setAttribute('aria-hidden', 'true');
  const cols = 18;
  const rows = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const span = document.createElement('span');
      span.textContent = Math.floor(Math.random() * 10);
      span.style.left = `${(c / cols) * 100 + (Math.random() * 3 - 1.5)}%`;
      span.style.top = `${(r / rows) * 100 + (Math.random() * 3 - 1.5)}%`;
      span.style.setProperty('--dx', `${(Math.random() * 16 - 8).toFixed(1)}px`);
      span.style.setProperty('--dy', `${(Math.random() * 16 - 8).toFixed(1)}px`);
      span.style.animationDuration = `${4 + Math.random() * 4}s`;
      span.style.animationDelay = `${Math.random() * -8}s`;
      field.appendChild(span);
    }
  }
  section.prepend(field);
}

const skillsSection = document.getElementById('skills');
if (skillsSection) buildMdrField(skillsSection);

// MDR-style decode: each skill starts as scrambled digits and slowly
// resolves into its real letters left to right, pulling out of the
// number field — brighter and glowing while mid-decode, like a selected
// cluster, then settling back to plain text once resolved.
const DIGITS = '0123456789';

function scrambleReveal(el, duration = 1400) {
  const final = el.textContent;
  const isLetter = c => /[a-zA-Z]/.test(c);
  const start = performance.now();
  el.classList.add('decoding');

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const locked = Math.floor(progress * final.length);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const c = final[i];
      out += (!isLetter(c) || i < locked) ? c : DIGITS[Math.floor(Math.random() * DIGITS.length)];
    }
    el.textContent = out;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = final;
      el.classList.remove('decoding');
    }
  }
  requestAnimationFrame(tick);
}

// Each item drops from its category header with a slight overshoot, then
// once it's landed, decodes from scrambled digits into its real text.
function decodeSkillGroup(group) {
  group.querySelectorAll('li').forEach((li, i) => {
    setTimeout(() => {
      li.classList.add('dropped');
      setTimeout(() => scrambleReveal(li, 1100), 350);
    }, i * 160);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      if (entry.target.classList.contains('skill-group') && !prefersReducedMotion) {
        decodeSkillGroup(entry.target);
      }
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => observer.observe(el));

// Respect reduced motion preference
if (prefersReducedMotion) {
  revealTargets.forEach(el => {
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.skill-group li').forEach(li => {
    li.style.transition = 'none';
    li.style.opacity = '1';
    li.style.transform = 'none';
  });
}

// Whole project cards are clickable when they link to a detail page —
// clicking anywhere on the card navigates, except clicks on an actual
// link inside it (Live app, Repo, etc.), which keep their own target.
document.querySelectorAll('.project-card[data-href]').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    window.location.href = card.dataset.href;
  });
});

// About section's small photo carousel — prev/next buttons plus
// dots, looping in both directions.
document.querySelectorAll('.about-carousel').forEach(carousel => {
  const track = carousel.querySelector('.about-carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.about-carousel-slide'));
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  let index = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('active', di === index));
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
});

// Lightbox — tap any image on a project page (wireframes, screenshots,
// icon grids, charts) to see it at full size, since a lot of them are
// too small to make out at card size on a phone.
const lightboxImages = document.querySelectorAll('.project-detail-section img');

if (lightboxImages.length) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const overlayImg = document.createElement('img');
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';

  overlay.append(overlayImg, closeBtn);
  document.body.appendChild(overlay);

  function openLightbox(src, alt) {
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  lightboxImages.forEach(img => {
    img.classList.add('lightbox-trigger');
    img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
  });

  // Close on backdrop click, but not when the click is on the
  // (already full-size) image itself.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeBtn) closeLightbox();
  });
  overlayImg.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
  });
}
