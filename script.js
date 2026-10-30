const DATA_URL = '/data/data.json';

const serviceIcons = ['fa-car', 'fa-magnifying-glass', 'fa-wrench', 'fa-gear'];

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (e) {
    console.error('Data load error:', e);
    return null;
  }
}

function formatPrice(p) {
  return '$' + p.toLocaleString('en-US');
}

function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = services.map((s, i) => `
    <div class="service-card scroll-reveal" style="transition-delay:${i * 0.1}s">
      <div class="service-icon"><i class="fa-solid ${serviceIcons[i] || 'fa-star'}"></i></div>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
    </div>
  `).join('');
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function renderFeatured(cars) {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const picks = pickRandom(cars, 3);
  grid.innerHTML = picks.map((car, i) => `
    <article class="car-card scroll-reveal" style="transition-delay:${i * 0.12}s" data-tilt>
      <div class="car-card-image">
        <img src="/data/images/${car.image}" alt="${car.name}" loading="lazy" />
        <span class="car-card-badge">${car.type}</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-name">${car.name}</h3>
        <div class="car-card-footer">
          <span class="car-card-price">${formatPrice(car.price)}</span>
          <a href="/gallery/?car=${car.id}" class="car-card-btn">
            View <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </article>
  `).join('');
  initTilt();
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;
  grid.innerHTML = reviews.map((r, i) => `
    <article class="review-card scroll-reveal" style="transition-delay:${i * 0.1}s">
      <div class="review-stars" aria-label="5 stars">
        ${Array(5).fill('<i class="fa-solid fa-star"></i>').join('')}
      </div>
      <p class="review-text">"${r.text}"</p>
      <div class="review-author">
        <div class="review-avatar">
          <img src="/data/images/${r.image}" alt="${r.name}" loading="lazy" />
        </div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-role">Verified Customer</div>
        </div>
      </div>
    </article>
  `).join('');
}

function initScrollReveal() {
  const els = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

function initParallax() {
  const img = document.getElementById('hero-parallax');
  if (!img) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    img.style.transform = `translateY(${y * 0.35}px) scale(1.1)`;
  }, { passive: true });
}

function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const colors = ['rgba(0,201,177,0.6)', 'rgba(201,168,76,0.6)', 'rgba(255,255,255,0.4)'];
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const dur = Math.random() * 12 + 8;
    const delay = Math.random() * -20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      width:${size}px; height:${size}px; left:${x}%;
      background:${color}; animation-duration:${dur}s;
      animation-delay:${delay}s;
      box-shadow: 0 0 ${size * 4}px ${color};
    `;
    container.appendChild(p);
  }
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const isDecimal = el.dataset.decimal === 'true';
      const duration = 2000;
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = isDecimal
          ? (eased * target).toFixed(1)
          : Math.round(eased * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

function initTilt() {
  const cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -8;
      const rotY = ((x - cx) / cx) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.transition = 'transform 0.5s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.15s ease';
    });
  });
}

function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function initHamburger() {
  const btn = document.getElementById('hamburger');
  const overlay = document.getElementById('mobile-overlay');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn = document.getElementById('mobile-nav-close');
  if (!btn || !overlay || !mobileNav) return;

  function open() {
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    overlay.classList.add('active');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('active');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileNav.classList.contains('open') ? close() : open();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
  }

  overlay.addEventListener('click', close);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

function initPageTransition() {
  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '1';
  });
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      const isSamePage = link.href === window.location.href;
      if (isSamePage) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.25s ease';
      setTimeout(() => { window.location.href = href; }, 250);
    });
  });
}

async function init() {
  initNav();
  initHamburger();
  initParallax();
  initParticles();
  initCounters();
  initPageTransition();

  const data = await loadData();
  if (!data) return;

  renderServices(data.services);
  renderFeatured(data.cars);
  renderReviews(data.reviews);

  setTimeout(initScrollReveal, 50);
}

document.addEventListener('DOMContentLoaded', init);