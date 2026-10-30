const DATA_URL = '/data/data.json';

let allCars = [];
let activeCategory = 'All';
let searchQuery = '';
let maxPrice = Infinity;
let sortMode = 'default';
let maxCarPrice = 100000;
let minCarPrice = 0;
const PRICE_STEP = 1000;
let renderQueued = false;

const categoryIcons = {
  Street: 'fa-road',
  Track: 'fa-flag-checkered',
  Drift: 'fa-rotate',
  Race: 'fa-trophy'
};

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

function buildChips(categories) {
  const container = document.getElementById('category-chips');
  if (!container) return;
  container.innerHTML = '';

  ['All', ...categories].forEach(cat => {
    const count = cat === 'All' ? allCars.length : allCars.filter(c => c.type === cat).length;
    const icon = cat === 'All' ? 'fa-layer-group' : (categoryIcons[cat] || 'fa-car');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (cat === activeCategory ? ' active' : '');
    btn.dataset.cat = cat;
    btn.setAttribute('aria-pressed', cat === activeCategory ? 'true' : 'false');
    btn.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${cat}</span><span class="chip-count">${count}</span>`;
    container.appendChild(btn);
  });

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    setCategory(btn.dataset.cat);
    // keep the chosen chip centred when the row scrolls (mobile)
    container.scrollTo({
      left: btn.offsetLeft - (container.clientWidth - btn.offsetWidth) / 2,
      behavior: 'smooth'
    });
  });
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('#category-chips .chip').forEach(c => {
    const on = c.dataset.cat === cat;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderGallery();
}

function hasActiveFilters() {
  return activeCategory !== 'All' || searchQuery !== '' || maxPrice < maxCarPrice;
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderGallery();
  });
}

function resetFilters() {
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  updateSearchClear();
  maxPrice = maxCarPrice;
  syncSlider();
  setCategory('All'); // re-renders
}

function filterCars() {
  const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  return allCars
    .filter(car => {
      if (activeCategory !== 'All' && car.type !== activeCategory) return false;
      if (car.price > maxPrice) return false;
      const haystack = (car.name + ' ' + car.type).toLowerCase();
      return tokens.every(t => haystack.includes(t));
    })
    .sort((a, b) => {
      if (sortMode === 'price-asc') return a.price - b.price;
      if (sortMode === 'price-desc') return b.price - a.price;
      if (sortMode === 'name-asc') return a.name.localeCompare(b.name);
      if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const countEl = document.getElementById('gallery-count');
  if (!grid) return;

  const filtered = filterCars();
  const count = filtered.length;

  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.hidden = !hasActiveFilters();

  if (countEl) {
    countEl.innerHTML = `Showing <strong>${count}</strong> vehicle${count !== 1 ? 's' : ''}`;
  }

  if (!count) {
    grid.innerHTML = `
      <div class="gallery-empty">
        <i class="fa-solid fa-car-burst" aria-hidden="true"></i>
        <p>No vehicles match your current filters. Try a different search, category or price.</p>
        <button type="button" class="gallery-empty-btn" id="empty-reset"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i>Clear filters</button>
      </div>
    `;
    document.getElementById('empty-reset')?.addEventListener('click', resetFilters);
    return;
  }

  grid.innerHTML = filtered.map((car, i) => `
    <article
      class="car-card scroll-reveal"
      style="transition-delay:${Math.min(i, 8) * 0.06}s"
      data-tilt
      data-car-index="${allCars.indexOf(car)}"
      tabindex="0"
      role="button"
      aria-label="View details for ${car.name}"
    >
      <div class="car-card-image">
        <img src="/data/images/${car.image}" alt="${car.name}" loading="lazy" />
        <span class="car-card-badge">${car.type}</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-name">${car.name}</h3>
        <div class="car-card-detail">
          <span><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>Certified Inspection</span>
          <span><i class="fa-solid fa-file-contract" aria-hidden="true"></i>Fully Documented</span>
        </div>
        <div class="car-card-footer">
          <span class="car-card-price">${formatPrice(car.price)}</span>
          <button class="car-card-btn open-modal" data-car-index="${allCars.indexOf(car)}">
            Details <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  initScrollReveal();
  initTilt();
  bindCardEvents();
}

function bindCardEvents() {
  document.querySelectorAll('.open-modal, .car-card').forEach(el => {
    el.addEventListener('click', (e) => {
      const idx = parseInt(el.dataset.carIndex ?? el.closest('[data-car-index]')?.dataset.carIndex);
      if (isNaN(idx)) return;
      if (e.target.closest('a, button') && !e.target.closest('.car-card') || e.target.closest('.open-modal')) {
        openModal(allCars[idx]);
      } else if (el.classList.contains('car-card')) {
        openModal(allCars[idx]);
      }
    });
    if (el.classList.contains('car-card')) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = parseInt(el.dataset.carIndex);
          if (!isNaN(idx)) openModal(allCars[idx]);
        }
      });
    }
  });
}

function openModal(car) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay || !car) return;
  document.getElementById('modal-img').src = '/data/images/' + car.image;
  document.getElementById('modal-img').alt = car.name;
  document.getElementById('modal-title').textContent = car.name;
  document.getElementById('modal-price').textContent = formatPrice(car.price);
  document.getElementById('modal-type').textContent = car.type;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close').focus();
  setCarParam(car.id);
  document.getElementById('modal').scrollTop = 0;
  updateScrollHint();
}

function updateScrollHint() {
  const modal = document.getElementById('modal');
  const hint = document.getElementById('modal-scroll-hint');
  if (!modal || !hint) return;
  const remaining = modal.scrollHeight - modal.scrollTop - modal.clientHeight;
  hint.classList.toggle('hidden', remaining < 8);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  setCarParam(null);
}

function setCarParam(id) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set('car', id);
  } else {
    url.searchParams.delete('car');
  }
  history.replaceState(null, '', url);
}

function openModalFromUrl() {
  const id = new URLSearchParams(window.location.search).get('car');
  if (!id) return;
  openModal(allCars.find(c => c.id === id));
}

function initModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.getElementById('modal')?.addEventListener('scroll', updateScrollHint, { passive: true });
  window.addEventListener('resize', updateScrollHint);
  closeBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function syncSlider() {
  const slider = document.getElementById('price-slider');
  const display = document.getElementById('price-display');
  if (!slider) return;
  slider.value = maxPrice;
  const min = Number(slider.min);
  const span = (Number(slider.max) - min) || 1;
  slider.style.setProperty('--p', ((maxPrice - min) / span).toString());
  slider.setAttribute('aria-valuetext', formatPrice(maxPrice));
  if (display) display.textContent = formatPrice(maxPrice);
}

function initPriceSlider() {
  const slider = document.getElementById('price-slider');
  if (!slider || !allCars.length) return;

  const prices = allCars.map(c => c.price);
  minCarPrice = Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP;
  maxCarPrice = Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP;

  slider.min = minCarPrice;
  slider.max = maxCarPrice;
  slider.step = PRICE_STEP;
  maxPrice = maxCarPrice;

  const minLabel = document.getElementById('price-min-label');
  const maxLabel = document.getElementById('price-max-label');
  if (minLabel) minLabel.textContent = formatPrice(minCarPrice);
  if (maxLabel) maxLabel.textContent = formatPrice(maxCarPrice);

  slider.addEventListener('input', () => {
    maxPrice = Number(slider.value);
    syncSlider();
    scheduleRender();
  });

  syncSlider();
}

function updateSearchClear() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  if (input && clear) clear.hidden = !input.value;
}

function initSearch() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  if (!input) return;
  let debounceTimer;

  input.addEventListener('input', () => {
    updateSearchClear();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value.trim();
      renderGallery();
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur(); // closes the mobile keyboard
  });

  clear?.addEventListener('click', () => {
    clearTimeout(debounceTimer);
    input.value = '';
    searchQuery = '';
    updateSearchClear();
    renderGallery();
    input.focus();
  });
}

function initReset() {
  document.getElementById('clear-filters')?.addEventListener('click', resetFilters);
}

function initSort() {
  const select = document.getElementById('sort-select');
  if (!select) return;
  select.addEventListener('change', () => {
    sortMode = select.value;
    renderGallery();
  });
}

function initScrollReveal() {
  const els = document.querySelectorAll('.scroll-reveal:not(.revealed)');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => observer.observe(el));
}

function initTilt() {
  const cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotX = ((y - rect.height / 2) / rect.height) * -6;
      const rotY = ((x - rect.width / 2) / rect.width) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
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
  nav.classList.add('scrolled');
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
  initModal();
  initSearch();
  initSort();
  initReset();
  initPageTransition();

  const data = await loadData();
  if (!data) return;

  allCars = data.cars;

  buildChips(data.categories);
  initPriceSlider();
  renderGallery();
  openModalFromUrl();
}

document.addEventListener('DOMContentLoaded', init);