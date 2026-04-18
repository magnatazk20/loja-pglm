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

/* ── Filter tabs ──────────────────────────────────────────────────────────── */
const filterBtns = document.querySelectorAll('.filter-btn')
const productCards = document.querySelectorAll('.product-card')

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    /* Active state */
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    const filter = btn.dataset.filter

    productCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = ''
        /* Pequena animação de entrada */
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
  })
})

/* ── Scroll reveal (Intersection Observer) ────────────────────────────────── */
const fadeEls = document.querySelectorAll(
  '.cat-card, .product-card, .step-card, .review-card, .trust-item, .section-header'
)

fadeEls.forEach(el => el.classList.add('fade-in'))

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      observer.unobserve(entry.target)
    }
  })
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

fadeEls.forEach((el, i) => {
  /* Staggered delay por grupo */
  el.style.transitionDelay = `${(i % 6) * 0.07}s`
  observer.observe(el)
})

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

/* ── Value chip interactive select ───────────────────────────────────────── */
document.querySelectorAll('.product-values').forEach(valuesEl => {
  valuesEl.querySelectorAll('.value-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      valuesEl.querySelectorAll('.value-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
    })
  })
})

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
