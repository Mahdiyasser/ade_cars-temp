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

function renderServices(services) {
  const grid = document.getElementById('services-about-grid');
  if (!grid) return;
  grid.innerHTML = services.map((s, i) => `
    <div class="service-about-card scroll-reveal" style="transition-delay:${i * 0.1}s">
      <div class="service-about-icon" aria-hidden="true">
        <i class="fa-solid ${serviceIcons[i] || 'fa-star'}"></i>
      </div>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
    </div>
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 0);
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

function initContactForm(data) {
  const form = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');
  if (!form) return;

  if (data?.about?.formTitle) {
    const title = document.getElementById('form-title');
    if (title) title.textContent = data.about.formTitle;
  }

  if (data?.about?.formSuccess) {
    const successText = document.getElementById('form-success-text');
    if (successText) successText.textContent = data.about.formSuccess;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#cf-name').value.trim();
    const email = form.querySelector('#cf-email').value.trim();
    const message = form.querySelector('#cf-message').value.trim();

    if (!name || !email || !message) {
      const firstEmpty = form.querySelector('input:invalid, textarea:invalid');
      if (firstEmpty) {
        firstEmpty.focus();
        firstEmpty.style.borderColor = 'rgba(239,68,68,0.6)';
        firstEmpty.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)';
        setTimeout(() => {
          firstEmpty.style.borderColor = '';
          firstEmpty.style.boxShadow = '';
        }, 2000);
      }
      return;
    }

    form.style.transition = 'opacity 0.3s ease';
    form.style.opacity = '0';
    setTimeout(() => {
      form.style.display = 'none';
      if (successEl) {
        successEl.style.display = 'flex';
        successEl.style.opacity = '0';
        successEl.style.transition = 'opacity 0.4s ease';
        setTimeout(() => { successEl.style.opacity = '1'; }, 10);
      }
    }, 300);
  });

  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    });
  });
}

function initParallax() {
  const heroImg = document.querySelector('.about-hero-bg img');
  if (!heroImg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = heroImg.closest('.about-hero');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, hero ? hero.offsetHeight : 800);
      heroImg.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
      ticking = false;
    });
  }, { passive: true });
}

function initPageTransition() {
  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '1';
  });
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      if (link.href === window.location.href) return;
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
  initPageTransition();

  const data = await loadData();

  if (data) {
    if (data.about?.mission) {
      const missionEl = document.getElementById('mission-text');
      if (missionEl) missionEl.textContent = data.about.mission;
    }
    if (data.services) renderServices(data.services);
    initContactForm(data);
  } else {
    initContactForm(null);
  }

  // always run, so sections never stay hidden if data.json fails to load
  setTimeout(initScrollReveal, 50);
}

document.addEventListener('DOMContentLoaded', init);