/* ═══════════════════════════════════════════════════════════════════════════
   PGLM — Gift Card Store — script.js
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Navbar scroll effect ─────────────────────────────────────────────────── */
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled')
  } else {
    nav.classList.remove('scrolled')
  }
}, { passive: true })

/* ── Mobile menu ──────────────────────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger')
const navMobile  = document.getElementById('navMobile')

hamburger.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open')
  hamburger.setAttribute('aria-expanded', isOpen)
  const spans = hamburger.querySelectorAll('span')
  if (isOpen) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)'
    spans[1].style.opacity   = '0'
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)'
  } else {
    spans[0].style.transform = ''
    spans[1].style.opacity   = ''
    spans[2].style.transform = ''
  }
})

/* Fecha o menu ao clicar em um link */
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMobile.classList.remove('open')
    const spans = hamburger.querySelectorAll('span')
    spans[0].style.transform = ''
    spans[1].style.opacity   = ''
    spans[2].style.transform = ''
  })
})

/* ── Scroll reveal (Intersection Observer) ────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

function initScrollReveal() {
  const fadeEls = document.querySelectorAll(
    '.cat-card, .product-card, .step-card, .review-card, .trust-item, .section-header'
  )
  fadeEls.forEach((el, i) => {
    el.classList.add('fade-in')
    el.style.transitionDelay = `${(i % 6) * 0.07}s`
    revealObserver.observe(el)
  })
}

/* ── Category label map ───────────────────────────────────────────────────── */
const CAT_LABELS = {
  games:     'Games',
  streaming: 'Streaming',
  musica:    'Música',
  compras:   'Compras',
  social:    'Social',
  outros:    'Outros',
}

/* ── Format BRL ───────────────────────────────────────────────────────────── */
function formatBRL(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ── Build product card HTML ──────────────────────────────────────────────── */
function buildProductCard(product) {
  const price = formatBRL(product.price)

  const iconHtml = product.imageUrl
    ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-img-thumb" onerror="this.parentElement.innerHTML='<span class=\\'product-icon-letter\\'>${(product.name || '?').charAt(0).toUpperCase()}</span>'" />`
    : `<span class="product-icon-letter">${(product.name || '?').charAt(0).toUpperCase()}</span>`

  const descHtml = product.description
    ? `<p class="product-desc">${product.description}</p>`
    : ''

  const platformHtml = product.platform
    ? `<span class="product-platform">${product.platform}</span>`
    : ''

  return `
    <div class="product-card" data-category="${product.category ?? 'outros'}">
      <div class="product-icon-wrap">
        ${iconHtml}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}${platformHtml}</h3>
        ${descHtml}
      </div>
      <div class="product-footer">
        <div class="product-price">
          <span class="price-from">Preço</span>
          <span class="price-value">${price}</span>
        </div>
        <a href="#comprar" class="btn btn-primary btn-sm">Comprar</a>
      </div>
    </div>
  `
}

/* ── Filter tabs logic ────────────────────────────────────────────────────── */
function buildFilterTabs(categories) {
  const filterTabs = document.getElementById('filterTabs')
  filterTabs.innerHTML = ''

  const allBtn = document.createElement('button')
  allBtn.className = 'filter-btn active'
  allBtn.dataset.filter = 'all'
  allBtn.textContent = 'Todos'
  filterTabs.appendChild(allBtn)

  categories.forEach(cat => {
    const btn = document.createElement('button')
    btn.className = 'filter-btn'
    btn.dataset.filter = cat
    btn.textContent = CAT_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1))
    filterTabs.appendChild(btn)
  })
}

function applyFilter(filter) {
  const cards = document.querySelectorAll('#productsGrid .product-card')
  const filterBtns = document.querySelectorAll('.filter-btn')

  filterBtns.forEach(b => b.classList.remove('active'))
  const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`)
  if (activeBtn) activeBtn.classList.add('active')

  cards.forEach(card => {
    if (filter === 'all' || card.dataset.category === filter) {
      card.style.display = ''
      card.style.opacity = '0'
      card.style.transform = 'translateY(12px)'
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
        card.style.opacity = '1'
        card.style.transform = 'translateY(0)'
      }, 10)
    } else {
      card.style.display = 'none'
    }
  })
}

function bindFilterBtns() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.filter)
    })
  })
}

/* ── Value chip interactive select ───────────────────────────────────────── */
function bindValueChips(container) {
  container.querySelectorAll('.product-values').forEach(valuesEl => {
    valuesEl.querySelectorAll('.value-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        valuesEl.querySelectorAll('.value-chip').forEach(c => c.classList.remove('active'))
        chip.classList.add('active')
      })
    })
  })
}

/* ── Render products into grid ────────────────────────────────────────────── */
function renderProducts(products) {
  const grid = document.getElementById('productsGrid')

  if (!products || products.length === 0) {
    grid.innerHTML = '<p class="products-empty">Nenhum produto disponível no momento.</p>'
    return
  }

  /* Collect distinct categories in the order they appear */
  const cats = []
  products.forEach(p => {
    const cat = p.category ?? 'outros'
    if (!cats.includes(cat)) cats.push(cat)
  })

  /* Build filter tabs */
  buildFilterTabs(cats)
  bindFilterBtns()

  /* Render cards */
  grid.innerHTML = products.map(buildProductCard).join('')

  /* Bind value chips on any static chips (not used currently but kept for future) */
  bindValueChips(grid)

  /* Re-init scroll reveal for newly added cards */
  grid.querySelectorAll('.product-card').forEach((el, i) => {
    el.classList.add('fade-in')
    el.style.transitionDelay = `${(i % 6) * 0.07}s`
    revealObserver.observe(el)
  })
}

/* ── Fetch products from API ──────────────────────────────────────────────── */
async function loadProducts() {
  const grid = document.getElementById('productsGrid')
  const loading = document.getElementById('productsLoading')

  try {
    const apiBase = (window.ENV && window.ENV.API_BASE) ? window.ENV.API_BASE : 'https://api.pgl-m.com'
    const res = await fetch(`${apiBase}/api/shop/products`)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()

    if (data && Array.isArray(data.products)) {
      renderProducts(data.products)
    } else {
      throw new Error('Resposta inválida da API')
    }
  } catch (err) {
    console.warn('[PGLM] Não foi possível carregar produtos da API:', err.message)
    if (loading) loading.remove()
    grid.innerHTML = '<p class="products-empty">Produtos indisponíveis no momento. Tente novamente mais tarde.</p>'
  }
}

/* ── Active nav link on scroll ────────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]')
const navLinks  = document.querySelectorAll('.nav-links a')

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = ''
      })
      const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`)
      if (activeLink) activeLink.style.color = 'var(--accent3)'
    }
  })
}, { threshold: 0.35 })

sections.forEach(section => sectionObserver.observe(section))

/* ── Smooth scroll for anchor links ──────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'))
    if (!target) return
    e.preventDefault()
    const offset = 72 /* altura da nav */
    const top = target.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  })
})

/* ── Number counter animation ─────────────────────────────────────────────── */
function animateCounter(el, end, suffix = '') {
  let start = 0
  const duration = 1600
  const step = (timestamp) => {
    if (!start) start = timestamp
    const progress = Math.min((timestamp - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.floor(eased * end).toLocaleString('pt-BR') + suffix
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    const statEls = entry.target.querySelectorAll('.hero-stat strong')
    const data = [
      { end: 50000, suffix: 'k+', display: '50k+' },
      { end: 200,   suffix: '+',  display: '200+' },
      { end: 4.9,   suffix: '★', display: '4.9★' },
    ]
    statEls.forEach((el, i) => {
      const d = data[i]
      if (i === 2) {
        /* Rating — não animar número decimal */
        setTimeout(() => { el.textContent = d.display }, 400)
      } else {
        setTimeout(() => animateCounter(el, d.end, d.suffix.replace(/\d/g, '')), i * 150)
      }
    })
    statsObserver.unobserve(entry.target)
  })
}, { threshold: 0.5 })

const heroStats = document.querySelector('.hero-stats')
if (heroStats) statsObserver.observe(heroStats)

/* ── Add spin keyframe for loading spinner ────────────────────────────────── */
const spinStyle = document.createElement('style')
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
document.head.appendChild(spinStyle)

/* ── Init ─────────────────────────────────────────────────────────────────── */
/* Scroll reveal for static elements (non-product cards) */
initScrollReveal()

/* Load products from API */
loadProducts()
