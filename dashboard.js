/* ═══════════════════════════════════════════════════════════
   PGLM — dashboard.js
   ═══════════════════════════════════════════════════════════ */

const API_BASE = (window.ENV && window.ENV.API_BASE) || 'https://sua-api.com';

/* ══════════════════════════════════════════════════════════
   SESSÃO
══════════════════════════════════════════════════════════ */
function getSession() {
  const token = localStorage.getItem('pglm_token');
  const raw   = localStorage.getItem('pglm_user');
  if (!token || !raw) return null;
  try { return { token, user: JSON.parse(raw) }; } catch { return null; }
}

function logout() {
  localStorage.removeItem('pglm_token');
  localStorage.removeItem('pglm_user');
  window.location.href = 'login.html';
}

/* auth guard */
const session = getSession();
if (!session) {
  window.location.href = 'login.html';
  throw new Error('Não autenticado');
}

const { token, user } = session;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtBRL(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ══════════════════════════════════════════════════════════
   PREENCHE INFO DO USUÁRIO
══════════════════════════════════════════════════════════ */
function populateUserInfo() {
  const ini = initials(user.name);

  const sidebarAvatar  = document.getElementById('sidebarAvatar');
  const sidebarName    = document.getElementById('sidebarName');
  const sidebarEmail   = document.getElementById('sidebarEmail');
  const topbarAvatar   = document.getElementById('topbarAvatar');
  const greetName      = document.getElementById('greetName');
  const profileAvatar  = document.getElementById('profileAvatar');
  const profileName    = document.getElementById('profileName');
  const profileEmail   = document.getElementById('profileEmail');
  const perfilNameInp  = document.getElementById('perfilName');
  const perfilEmailInp = document.getElementById('perfilEmail');

  if (sidebarAvatar) sidebarAvatar.textContent = ini;
  if (sidebarName)   sidebarName.textContent   = user.name  || '—';
  if (sidebarEmail)  sidebarEmail.textContent  = user.phone || user.email || '—';
  if (topbarAvatar)  topbarAvatar.textContent  = ini;
  if (greetName)     greetName.textContent     = (user.name || '').split(' ')[0] || '—';
  if (profileAvatar) profileAvatar.textContent = ini;
  if (profileName)   profileName.textContent   = user.name  || '—';
  if (profileEmail)  profileEmail.textContent  = user.phone || user.email || '—';
  if (perfilNameInp) perfilNameInp.value        = user.name  || '';
  if (perfilEmailInp)perfilEmailInp.value       = user.phone || user.email || '';
}

/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */
let currentTab = 'overview';

function switchTab(tabId) {
  if (tabId === currentTab) return;

  document.querySelectorAll('.dash-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.dash-nav-item[data-tab]').forEach(el => el.classList.remove('active'));

  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) tabEl.classList.add('active');

  const navEl = document.querySelector(`.dash-nav-item[data-tab="${tabId}"]`);
  if (navEl) navEl.classList.add('active');

  currentTab = tabId;

  /* fecha sidebar mobile */
  closeMobileSidebar();

  /* carrega dados específicos da aba ao entrar nela */
  if (tabId === 'saldo')     loadBalance();
  if (tabId === 'giftcards') renderGiftCardsGrid();
}

document.querySelectorAll('.dash-nav-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.dash-link[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.goto));
});

/* ══════════════════════════════════════════════════════════
   MOBILE SIDEBAR
══════════════════════════════════════════════════════════ */
const menuBtn       = document.getElementById('menuBtn');
const sidebar       = document.getElementById('sidebar');
const overlay       = document.getElementById('sidebarOverlay');

function openMobileSidebar() {
  sidebar?.classList.add('open');
  overlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  sidebar?.classList.remove('open');
  overlay?.classList.remove('active');
  document.body.style.overflow = '';
}

menuBtn?.addEventListener('click', openMobileSidebar);
overlay?.addEventListener('click', closeMobileSidebar);

/* ══════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════ */
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Deseja sair da sua conta?')) logout();
});

/* ══════════════════════════════════════════════════════════
   DADOS: SALDO
══════════════════════════════════════════════════════════ */
let shopBalance = 0;

async function loadBalance() {
  try {
    const res  = await fetch(`${API_BASE}/api/shop/balance/${user.id}`, { headers: authHeaders() });
    const data = await res.json();
    shopBalance = parseFloat(data.shopBalance ?? data.balance ?? 0);
  } catch {
    shopBalance = 0;
  }

  const formatted = fmtBRL(shopBalance);
  const statEl    = document.getElementById('statShopBalance');
  const balEl     = document.getElementById('balanceValue');
  if (statEl) statEl.textContent = formatted;
  if (balEl)  balEl.textContent  = formatted;

  loadBalanceHistory();
}

async function loadBalanceHistory() {
  const el = document.getElementById('fullHistory');
  if (!el) return;

  try {
    const res  = await fetch(`${API_BASE}/api/shop/balance/${user.id}/history`, { headers: authHeaders() });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.history ?? []);

    renderTxList(el, list);

    /* overview: só as 5 últimas */
    const recentEl = document.getElementById('recentTransactions');
    if (recentEl) renderTxList(recentEl, list.slice(0, 5));

    /* total gasto */
    const totalSpent = list
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + parseFloat(t.amount ?? 0), 0);
    const statEl = document.getElementById('statTotalSpent');
    if (statEl) statEl.textContent = fmtBRL(totalSpent);

  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    el.innerHTML = '<div class="dash-empty"><p>Erro ao carregar histórico.</p></div>';
  }
}

function renderTxList(container, list) {
  if (!list || list.length === 0) {
    container.innerHTML = '<div class="dash-empty"><p>Nenhuma transação encontrada.</p></div>';
    return;
  }

  container.innerHTML = list.map(tx => {
    const isCredit = tx.type === 'credit';
    const sign     = isCredit ? '+' : '−';
    const cls      = isCredit ? 'tx-credit' : 'tx-debit';
    return `
      <div class="dash-tx-item">
        <div class="dash-tx-icon ${cls}">
          ${isCredit
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
          }
        </div>
        <div class="dash-tx-info">
          <span class="dash-tx-desc">${escHtml(tx.description || (isCredit ? 'Crédito na conta' : 'Débito na conta'))}</span>
          <span class="dash-tx-date">${fmtDateTime(tx.createdAt || tx.created_at)}</span>
        </div>
        <span class="dash-tx-amount ${cls}">${sign} ${fmtBRL(tx.amount)}</span>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   DADOS: GIFT CARDS
══════════════════════════════════════════════════════════ */
let allGiftCards = [];

async function loadGiftCards() {
  try {
    const res  = await fetch(`${API_BASE}/api/shop/giftcards/${user.id}`, { headers: authHeaders() });
    const data = await res.json();
    allGiftCards = Array.isArray(data) ? data : (data.giftcards ?? data.items ?? []);
  } catch (err) {
    console.error('Erro ao carregar gift cards:', err);
    allGiftCards = [];
  }

  /* contagem */
  const statEl = document.getElementById('statGiftCount');
  if (statEl) statEl.textContent = allGiftCards.length;

  /* último recebimento */
  const lastEl = document.getElementById('statLastDate');
  if (lastEl && allGiftCards.length > 0) {
    const sorted = [...allGiftCards].sort((a, b) =>
      new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
    );
    lastEl.textContent = fmtDate(sorted[0].createdAt || sorted[0].created_at);
  }

  renderRecentGiftCards();
  renderGiftCardsGrid();
}

function renderRecentGiftCards() {
  const el = document.getElementById('recentGiftCards');
  if (!el) return;

  const recent = allGiftCards.slice(0, 4);
  if (recent.length === 0) {
    el.innerHTML = `<div class="dash-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M20 12v10H4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 7H2v5h20V7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <p>Nenhum gift card ainda.</p>
      <span>Quando você receber um gift card, ele aparecerá aqui.</span>
    </div>`;
    return;
  }

  el.innerHTML = recent.map(gc => buildGcListItem(gc)).join('');
  attachGcListeners(el);
}

function renderGiftCardsGrid() {
  const el      = document.getElementById('giftCardsGrid');
  const search  = (document.getElementById('gcSearch')?.value || '').toLowerCase();
  const filter  = document.getElementById('gcFilter')?.value || 'all';

  if (!el) return;

  let list = allGiftCards;
  if (filter !== 'all') list = list.filter(gc => (gc.status || 'disponivel') === filter);
  if (search)           list = list.filter(gc =>
    (gc.name || gc.product || '').toLowerCase().includes(search) ||
    (gc.platform || '').toLowerCase().includes(search)
  );

  if (list.length === 0) {
    el.innerHTML = `<div class="dash-empty dash-empty-full">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M20 12v10H4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 7H2v5h20V7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <p>${search || filter !== 'all' ? 'Nenhum resultado encontrado.' : 'Você ainda não recebeu nenhum gift card.'}</p>
      <span>${search || filter !== 'all' ? 'Tente outros filtros.' : 'Os gift cards aparecem aqui após serem entregues pelo suporte.'}</span>
    </div>`;
    return;
  }

  el.innerHTML = list.map(gc => buildGcCard(gc)).join('');
  attachGcListeners(el);
}

/* item de lista (overview) */
function buildGcListItem(gc) {
  const statusCls  = gc.status === 'usado' ? 'gc-status-used' : 'gc-status-ok';
  const statusTxt  = gc.status === 'usado' ? 'Usado' : 'Disponível';
  return `
    <div class="dash-gc-list-item">
      <div class="dash-gc-list-icon">
        ${gcIcon(gc)}
      </div>
      <div class="dash-gc-list-info">
        <strong>${escHtml(gc.name || gc.product || 'Gift Card')}</strong>
        <span>${escHtml(gc.platform || '—')} · ${fmtDate(gc.createdAt || gc.created_at)}</span>
      </div>
      <div class="dash-gc-list-right">
        <span class="gc-status-badge ${statusCls}">${statusTxt}</span>
        <span class="dash-gc-list-value">${fmtBRL(gc.value)}</span>
        ${gc.status !== 'usado' ? `<button class="dash-view-code-btn" data-gc-id="${gc.id}">Ver Código</button>` : ''}
      </div>
    </div>`;
}

/* card de grid (aba gift cards) */
function buildGcCard(gc) {
  const statusCls = gc.status === 'usado' ? 'gc-status-used' : 'gc-status-ok';
  const statusTxt = gc.status === 'usado' ? 'Usado' : 'Disponível';
  return `
    <div class="dash-gc-card">
      <div class="dash-gc-card-head">
        <div class="dash-gc-card-icon">${gcIcon(gc)}</div>
        <span class="gc-status-badge ${statusCls}">${statusTxt}</span>
      </div>
      <h3 class="dash-gc-card-name">${escHtml(gc.name || gc.product || 'Gift Card')}</h3>
      <span class="dash-gc-card-platform">${escHtml(gc.platform || '—')}</span>
      <div class="dash-gc-card-footer">
        <span class="dash-gc-card-value">${fmtBRL(gc.value)}</span>
        ${gc.status !== 'usado'
          ? `<button class="dash-view-code-btn" data-gc-id="${gc.id}">Ver Código</button>`
          : `<span class="dash-gc-card-used-txt">Resgatado</span>`
        }
      </div>
    </div>`;
}

function gcIcon(gc) {
  if (gc.imageUrl) {
    return `<img src="${escHtml(gc.imageUrl)}" alt="${escHtml(gc.platform || '')}" onerror="this.style.display='none'" />`;
  }
  /* ícone genérico */
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 12v10H4V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 7H2v5h20V7z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

function attachGcListeners(container) {
  container.querySelectorAll('.dash-view-code-btn').forEach(btn => {
    btn.addEventListener('click', () => openCodeModal(btn.dataset.gcId));
  });
}

/* search + filter */
document.getElementById('gcSearch')?.addEventListener('input',  renderGiftCardsGrid);
document.getElementById('gcFilter')?.addEventListener('change', renderGiftCardsGrid);

/* ══════════════════════════════════════════════════════════
   MODAL: VER CÓDIGO
══════════════════════════════════════════════════════════ */
function openCodeModal(gcId) {
  const gc = allGiftCards.find(g => String(g.id) === String(gcId));
  if (!gc) return;

  document.getElementById('modalGcName').textContent   = gc.name || gc.product || 'Gift Card';
  document.getElementById('modalPlatform').textContent  = gc.platform || '—';
  document.getElementById('modalCode').textContent      = gc.code || '(código não disponível)';
  document.getElementById('modalValue').textContent     = fmtBRL(gc.value);
  document.getElementById('modalPlatform2').textContent = gc.platform || '—';
  document.getElementById('modalDate').textContent      = fmtDateTime(gc.createdAt || gc.created_at);
  document.getElementById('modalStatus').textContent    = gc.status === 'usado' ? 'Usado' : 'Disponível';

  const modal = document.getElementById('codeModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeCodeModal() {
  const modal = document.getElementById('codeModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

document.getElementById('closeModal')?.addEventListener('click', closeCodeModal);
document.getElementById('codeModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCodeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCodeModal();
});

/* ── botão copiar código ─────────────────────────────────── */
document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
  const code = document.getElementById('modalCode')?.textContent || '';
  if (!code || code === '(código não disponível)') return;

  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copyCodeBtn');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copiado!`;
    btn.style.background = 'rgba(16,185,129,0.15)';
    btn.style.color      = '#34d399';
    setTimeout(() => {
      btn.innerHTML       = orig;
      btn.style.background = '';
      btn.style.color      = '';
    }, 2000);
  }).catch(() => {
    /* fallback para navegadores sem clipboard API */
    const el = document.getElementById('modalCode');
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  });
});

/* ══════════════════════════════════════════════════════════
   PERFIL: FORM
══════════════════════════════════════════════════════════ */
document.getElementById('perfilForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameVal  = document.getElementById('perfilName')?.value.trim() || '';
  const emailVal = document.getElementById('perfilEmail')?.value.trim() || '';
  const passVal  = document.getElementById('perfilPassword')?.value || '';
  const feedEl   = document.getElementById('perfilFeedback');
  const btn      = e.target.querySelector('button[type="submit"]');

  if (!nameVal || !emailVal) {
    showPerfilFeedback('Preencha nome e e-mail.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Salvando…';

  try {
    const body = { name: nameVal, email: emailVal };
    if (passVal && passVal.length >= 6) body.password = passVal;
    if (passVal && passVal.length > 0 && passVal.length < 6) {
      showPerfilFeedback('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    const res  = await fetch(`${API_BASE}/api/auth/profile`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showPerfilFeedback(data.error || data.message || 'Erro ao salvar.', 'error');
      return;
    }

    /* atualiza sessão local */
    const updatedUser = { ...user, name: nameVal, email: emailVal };
    localStorage.setItem('pglm_user', JSON.stringify(updatedUser));

    /* atualiza UI */
    const ini = initials(nameVal);
    document.getElementById('sidebarAvatar').textContent  = ini;
    document.getElementById('sidebarName').textContent    = nameVal;
    document.getElementById('sidebarEmail').textContent   = emailVal;
    document.getElementById('topbarAvatar').textContent   = ini;
    document.getElementById('greetName').textContent      = nameVal.split(' ')[0];
    document.getElementById('profileAvatar').textContent  = ini;
    document.getElementById('profileName').textContent    = nameVal;
    document.getElementById('profileEmail').textContent   = emailVal;

    if (passVal) document.getElementById('perfilPassword').value = '';

    showPerfilFeedback('Dados salvos com sucesso!', 'success');

  } catch (err) {
    console.error(err);
    showPerfilFeedback('Erro de conexão. Tente novamente.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar alterações';
  }
});

function showPerfilFeedback(msg, type) {
  const el = document.getElementById('perfilFeedback');
  if (!el) return;
  el.textContent  = msg;
  el.className    = `auth-feedback fb-${type}`;
  el.style.display = 'block';
  setTimeout(() => { if (type === 'success') el.style.display = 'none'; }, 3500);
}

/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════════════ */
async function init() {
  populateUserInfo();
  await Promise.all([
    loadBalance(),
    loadGiftCards(),
  ]);
}

init().catch(console.error);
