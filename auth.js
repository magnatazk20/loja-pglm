/* ═══════════════════════════════════════════════════════════
   PGLM — auth.js  (login + cadastro)
   ═══════════════════════════════════════════════════════════ */

const API_BASE = 'https://sua-api.com'; // troque pela URL real do seu backend

/* ── helpers ─────────────────────────────────────────────── */
function saveSession(token, user) {
  localStorage.setItem('pglm_token', token);
  localStorage.setItem('pglm_user', JSON.stringify(user));
}

function getSession() {
  const token = localStorage.getItem('pglm_token');
  const raw   = localStorage.getItem('pglm_user');
  if (!token || !raw) return null;
  try { return { token, user: JSON.parse(raw) }; } catch { return null; }
}

/* se já está logado, manda direto pro dashboard */
if (getSession()) {
  window.location.href = 'dashboard.html';
}

/* ── toggle senha visível ─────────────────────────────────── */
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input    = document.getElementById(targetId);
    if (!input) return;

    const isPass = input.type === 'password';
    input.type   = isPass ? 'text' : 'password';

    /* troca ícone */
    btn.innerHTML = isPass
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
           <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
         </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
           <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
         </svg>`;
  });
});

/* ── feedback ─────────────────────────────────────────────── */
function showFeedback(msg, type = 'error') {
  const el = document.getElementById('auth-feedback');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-feedback fb-${type}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideFeedback() {
  const el = document.getElementById('auth-feedback');
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading) {
  const txt = btn.querySelector('.auth-btn-text');
  const spin = btn.querySelector('.auth-spinner');
  btn.disabled = loading;
  if (txt)  txt.style.display  = loading ? 'none'  : '';
  if (spin) spin.style.display = loading ? 'inline-block' : 'none';
}

function markError(inputId, hasError) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.toggle('error', hasError);
}

/* ══════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════ */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback();

    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-password');
    const btn     = document.getElementById('loginBtn');

    const email    = emailEl.value.trim();
    const password = passEl.value;

    /* validação básica */
    let valid = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      markError('login-email', true); valid = false;
    } else { markError('login-email', false); }

    if (!password || password.length < 6) {
      markError('login-password', true); valid = false;
    } else { markError('login-password', false); }

    if (!valid) {
      showFeedback('Preencha todos os campos corretamente.');
      return;
    }

    setLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error || data.message || 'E-mail ou senha incorretos.');
        return;
      }

      saveSession(data.token, data.user);
      showFeedback('Login realizado! Redirecionando…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);

    } catch (err) {
      console.error(err);
      showFeedback('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(btn, false);
    }
  });

  /* limpa erro ao digitar */
  document.getElementById('login-email')?.addEventListener('input', () => markError('login-email', false));
  document.getElementById('login-password')?.addEventListener('input', () => markError('login-password', false));
}

/* ══════════════════════════════════════════════════════════
   CADASTRO
══════════════════════════════════════════════════════════ */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback();

    const nameEl    = document.getElementById('reg-name');
    const emailEl   = document.getElementById('reg-email');
    const passEl    = document.getElementById('reg-password');
    const confirmEl = document.getElementById('reg-confirm');
    const termsEl   = document.getElementById('reg-terms');
    const btn       = document.getElementById('registerBtn');

    const name     = nameEl.value.trim();
    const email    = emailEl.value.trim();
    const password = passEl.value;
    const confirm  = confirmEl.value;

    /* validações */
    let valid = true;

    if (!name || name.length < 3) {
      markError('reg-name', true); valid = false;
    } else { markError('reg-name', false); }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      markError('reg-email', true); valid = false;
    } else { markError('reg-email', false); }

    if (!password || password.length < 6) {
      markError('reg-password', true); valid = false;
    } else { markError('reg-password', false); }

    if (password !== confirm) {
      markError('reg-confirm', true); valid = false;
      if (valid !== false) showFeedback('As senhas não coincidem.');
    } else { markError('reg-confirm', false); }

    if (!termsEl.checked) {
      valid = false;
      showFeedback('Você precisa aceitar os Termos de Uso para continuar.');
      return;
    }

    if (!valid) {
      showFeedback('Preencha todos os campos corretamente.');
      return;
    }

    setLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error || data.message || 'Não foi possível criar a conta.');
        return;
      }

      /* se o backend retornar token, faz login automático */
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        showFeedback('Conta criada! Redirecionando…', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
      } else {
        showFeedback('Conta criada com sucesso! Faça login para continuar.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1400);
      }

    } catch (err) {
      console.error(err);
      showFeedback('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(btn, false);
    }
  });

  /* limpa erros ao digitar */
  ['reg-name', 'reg-email', 'reg-password', 'reg-confirm'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => markError(id, false));
  });

  /* confirmação de senha em tempo real */
  document.getElementById('reg-confirm')?.addEventListener('input', () => {
    const pass    = document.getElementById('reg-password')?.value || '';
    const confirm = document.getElementById('reg-confirm')?.value  || '';
    if (confirm && pass !== confirm) {
      markError('reg-confirm', true);
    } else {
      markError('reg-confirm', false);
    }
  });
}
