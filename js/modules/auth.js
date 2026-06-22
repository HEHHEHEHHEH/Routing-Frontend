/* ============================================
   AUTH.JS - Authentication Manager
   Pioneer Adhesives Routing Template System

   Handles login, logout, JWT token storage,
   and the Authorization header for all API calls.

   Flow:
   1. On page load, main.js calls Auth.init().
   2. If no valid token found, the login screen
      is shown and the app is blocked.
   3. On successful login, the token is stored
      in sessionStorage and the app initializes.
   4. On logout, the token is cleared and the
      login screen is shown again.

   Admin Features:
   - Admin-only tab visibility (Admin Panel, Audit Logs)
   - Admin role badge in user badge
   - isAdmin() helper for module checks
   ============================================ */

const Auth = {
  TOKEN_KEY: 'routing_access_token',
  USER_KEY:  'routing_user',

  /* ── Token helpers ── */

  getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY) || null;
  },

  setToken(token) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  },

  getUser() {
    try {
      const raw = sessionStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  },

  setUser(user) {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Check if the currently logged-in user has the 'admin' role.
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getUser();
    return !!(user && user.role === 'admin');
  },

  /**
   * Return the Authorization header object for fetch calls.
   * Returns {} if no token is stored (API handles the 401).
   */
  authHeaders() {
    const token = this.getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  },

  /* ── Login / Logout ── */

  /**
   * POST /api/auth/login
   * @param {string} username
   * @param {string} password
   * @returns {{ ok: boolean, user?: Object, error?: string }}
   */
  async login(username, password) {
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        this.setToken(data.access_token);
        this.setUser(data.user);
        return { ok: true, user: data.user };
      }

      // Map status codes to friendly messages
      if (response.status === 401) return { ok: false, error: 'Invalid username or password.' };
      if (response.status === 403) return { ok: false, error: 'Your account has been disabled. Contact an administrator.' };
      if (response.status === 429) return { ok: false, error: 'Too many login attempts. Please wait a moment and try again.' };
      return { ok: false, error: data.error || 'Login failed. Please try again.' };

    } catch (_) {
      return { ok: false, error: 'Cannot connect to server. Please check your connection.' };
    }
  },

  /**
   * Clear token and user, then reload the page.
   *
   * WHY RELOAD instead of just _showLoginScreen():
   * _waitForLogin() creates a one-shot Promise whose resolve function is stored
   * in window._loginSuccessCallback.  That callback is consumed (set to null)
   * the first time a login succeeds.  If we only call _showLoginScreen() here,
   * any subsequent Sign-In attempt will authenticate correctly (Auth.login()
   * returns ok:true and the token is stored), but _loginSuccessCallback is null
   * so _hideLoginScreen() is never called and the app never initialises for the
   * new session — the login screen just sits there with "no changes".
   *
   * A full page reload lets initApp() run from scratch: isLoggedIn() returns
   * false, _waitForLogin() registers a fresh callback, and the next login works
   * correctly for every role (admin, superuser, user).
   */
  logout() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    window.location.reload();
  },

  /**
   * GET /api/auth/me — verify the stored token is still valid.
   * @returns {boolean} true if token is valid, false otherwise
   */
  async verifyToken() {
    if (!this.getToken()) return false;
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/me', {
        headers: { ...this.authHeaders(), 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.username) this.setUser(data); // refresh stored user info
        return true;
      }
      return false;
    } catch (_) {
      // Network error — allow offline use with cached token
      return this.isLoggedIn();
    }
  },

  /* ── App initialization gate ── */

  /**
   * Call this from main.js before initializing the app.
   * Shows the login screen if no valid token exists.
   * Resolves when the user is authenticated.
   */
  async init() {
    _renderLoginScreen();

    if (this.isLoggedIn()) {
      const valid = await this.verifyToken();
      if (valid) {
        _hideLoginScreen();
        _updateUserBadge(this.getUser());
        _refreshAdminTabs();
        return; // Token valid — proceed to app init
      }
      // Token expired
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }

    // Block until login succeeds
    await _waitForLogin();
    _hideLoginScreen();
    _updateUserBadge(this.getUser());
    _refreshAdminTabs();
  },
};


/* ============================================
   LOGIN SCREEN UI
   ============================================ */

function _renderLoginScreen() {
  // Only render once
  if (document.getElementById('login-screen')) return;

  const screen = document.createElement('div');
  screen.id = 'login-screen';
  screen.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10000',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:#f1f5f9',
  ].join(';');

  screen.innerHTML = `
    <div style="background:#fff; border-radius:16px; padding:2.5rem 2rem; width:100%; max-width:380px;
                box-shadow:0 20px 48px rgba(0,0,0,0.12); display:flex; flex-direction:column; gap:0;">

      <!-- Header -->
      <div style="text-align:center; margin-bottom:1.75rem;">
        <p style="font-size:0.72rem; font-weight:700; letter-spacing:0.1em; color:#94a3b8;
                  text-transform:uppercase; margin:0 0 0.35rem;">Pioneer Adhesives Inc.</p>
        <h1 style="font-size:1.35rem; font-weight:800; color:#0f172a; margin:0 0 0.2rem;">
          Routing Template System
        </h1>
        <p style="font-size:0.82rem; color:#64748b; margin:0;">Sign in to continue</p>
      </div>

      <!-- Error banner (hidden by default) -->
      <div id="login-error"
           style="display:none; background:#fff1f2; border:1px solid #fecdd3; border-radius:8px;
                  padding:0.6rem 0.85rem; font-size:0.82rem; color:#be123c; margin-bottom:1rem;
                  line-height:1.45;">
      </div>

      <!-- Form -->
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:600; color:#374151;
                        margin-bottom:0.35rem; letter-spacing:0.02em;">Username</label>
          <input id="login-username" type="text" autocomplete="username"
                 placeholder="Enter your username"
                 style="width:100%; border:1px solid #d1d5db; border-radius:8px;
                        padding:0.6rem 0.8rem; font-size:0.9rem; color:#0f172a;
                        box-sizing:border-box; outline:none; transition:border-color 0.15s;"
                 onfocus="this.style.borderColor='#3b82f6'"
                 onblur="this.style.borderColor='#d1d5db'">
        </div>
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:600; color:#374151;
                        margin-bottom:0.35rem; letter-spacing:0.02em;">Password</label>
          <input id="login-password" type="password" autocomplete="current-password"
                 placeholder="Enter your password"
                 style="width:100%; border:1px solid #d1d5db; border-radius:8px;
                        padding:0.6rem 0.8rem; font-size:0.9rem; color:#0f172a;
                        box-sizing:border-box; outline:none; transition:border-color 0.15s;"
                 onfocus="this.style.borderColor='#3b82f6'"
                 onblur="this.style.borderColor='#d1d5db'">
        </div>

        <button id="login-btn"
                onclick="_handleLoginSubmit()"
                style="margin-top:0.25rem; padding:0.7rem; border-radius:8px; border:none;
                       background:#2563eb; color:#fff; font-size:0.9rem; font-weight:700;
                       cursor:pointer; transition:background 0.15s; letter-spacing:0.01em;"
                onmouseover="this.style.background='#1d4ed8'"
                onmouseout="this.style.background='#2563eb'">
          Sign In
        </button>
      </div>

      <!-- Footer note -->
      <p style="text-align:center; font-size:0.75rem; color:#94a3b8; margin:1.5rem 0 0;">
        Contact your administrator if you need access.
      </p>
    </div>
  `;

  document.body.appendChild(screen);

  // Allow Enter key to submit
  screen.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleLoginSubmit();
  });

  // Focus username field
  setTimeout(() => document.getElementById('login-username')?.focus(), 100);
}

function _showLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) {
    screen.style.display = 'flex';
    setTimeout(() => document.getElementById('login-username')?.focus(), 100);
  }
}

function _hideLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.style.display = 'none';
}

/**
 * Returns a Promise that resolves only after a successful login.
 */
function _waitForLogin() {
  return new Promise(resolve => {
    window._loginSuccessCallback = resolve;
  });
}

async function _handleLoginSubmit() {
  const usernameEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');
  const btn        = document.getElementById('login-btn');
  const errorEl    = document.getElementById('login-error');

  const username = usernameEl?.value.trim();
  const password = passwordEl?.value;

  // Clear previous error
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

  if (!username || !password) {
    _showLoginError('Please enter both username and password.');
    return;
  }

  // Loading state
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

  const result = await Auth.login(username, password);

  if (result.ok) {
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
    // Resolve the waiting promise in main.js
    if (typeof window._loginSuccessCallback === 'function') {
      window._loginSuccessCallback();
      window._loginSuccessCallback = null;
    }
  } else {
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
    _showLoginError(result.error);
    if (passwordEl) { passwordEl.value = ''; passwordEl.focus(); }
  }
}

function _showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/* ============================================
   USER BADGE (shown in header after login)
   ============================================ */

function _updateUserBadge(user) {
  const badge = document.getElementById('user-badge');
  if (!badge || !user) return;
  const roleLabel = { admin: 'Admin', superuser: 'Superuser', user: 'User' }[user.role] || user.role;
  const roleColor = user.role === 'admin' ? '#dc2626' : '#0369a1';
  const roleBg    = user.role === 'admin' ? '#fef2f2' : '#e0f2fe';
  const roleBorder= user.role === 'admin' ? '#fecaca' : '#bae6fd';
  badge.innerHTML = `
    <span style="font-size:0.78rem; color:#475569; font-weight:500;">${user.username}</span>
    <span style="font-size:0.7rem; background:${roleBg}; color:${roleColor}; padding:0.1rem 0.5rem;
                 border-radius:9999px; font-weight:600; border:1px solid ${roleBorder};">${roleLabel}</span>
    <button onclick="Auth.logout()"
            style="font-size:0.75rem; padding:0.2rem 0.65rem; border-radius:6px; border:1px solid #e2e8f0;
                   background:#f8fafc; color:#64748b; cursor:pointer; font-weight:500;"
            onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
      Sign Out
    </button>
  `;
  badge.style.display = 'flex';
}

/* ============================================
   ADMIN TAB VISIBILITY
   ============================================ */

/**
 * Show or hide navigation tabs based on the current user's role.
 *
 * admin     → Admin Panel, Audit Logs only.
 * superuser → All routing/data tabs (Add, Lookup, Update, Manage, All Data).
 * user      → Look Up Routing and View All Data only.
 *
 * Call this after login and after role changes.
 */
function _refreshAdminTabs() {
  const user    = Auth.getUser();
  const role    = user ? user.role : '';
  const isAdmin = role === 'admin';
  const isUser  = role === 'user';

  // Per-tab visibility map  { tabId: visibleForRoles[] }
  const tabVisibility = {
    'tab-add':     ['superuser'],
    'tab-lookup':  ['superuser', 'user'],
    'tab-update':  ['superuser'],
    'tab-manage':  ['superuser'],
    'tab-alldata': ['superuser', 'user'],
    'tab-admin':   ['admin'],
    'tab-logs':    ['admin'],
  };

  Object.entries(tabVisibility).forEach(([id, allowedRoles]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = allowedRoles.includes(role) ? '' : 'none';
  });

  // Redirect if the user is on a tab their role doesn't allow
  const allowedStates = {
    admin:     [AppState.ADMIN, AppState.LOGS],
    superuser: [AppState.ADD, AppState.LOOKUP, AppState.UPDATE, AppState.MANAGE, AppState.ALLDATA],
    user:      [AppState.LOOKUP, AppState.ALLDATA],
  };

  const allowed = allowedStates[role] || allowedStates['superuser'];
  if (!allowed.includes(App.currentState)) {
    // Send each role to their default landing tab
    if (isAdmin) switchTab(AppState.ADMIN);
    else if (isUser) switchTab(AppState.LOOKUP);
    else switchTab(AppState.ADD);
  }
}

/* ============================================
   EXPOSE GLOBALLY
   ============================================ */
window.Auth               = Auth;
window._handleLoginSubmit = _handleLoginSubmit;
window._refreshAdminTabs  = _refreshAdminTabs;