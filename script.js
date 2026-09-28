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
