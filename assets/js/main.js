// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('show');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

// Simple dropdown (accessible-ish)
const dropdown = document.querySelector('.nav-dropdown');
if (dropdown) {
  const btn = dropdown.querySelector('.drop-btn');
  const menu = dropdown.querySelector('.drop-menu');
  const toggle = (open) => {
    dropdown.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.getAttribute('aria-expanded') === 'true';
    toggle(!open);
  });
  document.addEventListener('click', () => toggle(false));
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
    if (e.key === 'ArrowDown') { e.preventDefault(); menu?.querySelector('a')?.focus(); }
  });
}

// Contact form (placeholder)
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('送信は現在準備中です。メールにてご連絡ください: contact@example.com');
  });
}

// Scroll effects: parallax background, progress bar, and reveal-on-scroll
(function(){
  const root = document.documentElement;
  const hero = document.querySelector('.hero');

  // progress bar
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  // reveal targets
  const targets = Array.from(document.querySelectorAll('.card, .news-list li, section h2, .page-ctas .btn'));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 }) : null;
  targets.forEach(el => {
    el.classList.add('reveal');
    io?.observe(el);
  });

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    root.style.setProperty('--scroll', String(y));
    root.style.setProperty('--parallax-y', (y * 0.06) + 'px');
    root.style.setProperty('--parallax-x', (Math.sin(y * 0.002) * 10).toFixed(2) + 'px');

    // progress width
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(100, (y / h) * 100) : 0;
    bar.style.width = p + '%';

    // hero parallax
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (200 - rect.top) / 200));
      const t = (1 - ratio) * 10; // 0→10px
      const h1 = hero.querySelector('h1');
      const pEl = hero.querySelector('p');
      h1 && (h1.style.transform = `translateY(${t * -0.7}px)`);
      pEl && (pEl.style.transform = `translateY(${t * -0.3}px)`);
    }
    ticking = false;
  };
  const rafScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  };
  window.addEventListener('scroll', rafScroll, { passive: true });
  onScroll();
})();
