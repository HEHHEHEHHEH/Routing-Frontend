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

  async confirmLogout() {
    if (typeof showModal !== 'function') {
      this.logout();
      return;
    }

    const result = await showModal({
      icon: 'warn',
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      type: 'confirm',
      confirmStyle: 'danger',
      confirmLabel: 'Log Out',
    });

    if (result.confirmed) this.logout();
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
  if (document.getElementById('login-screen')) return;

  const screen = document.createElement('div');
  screen.id = 'login-screen';
  screen.className = 'login-screen';

  screen.innerHTML = `
    <div class="login-screen__hero">
      <div class="login-screen__hero-overlay"></div>
      <div class="login-screen__hero-content">
        <h2 class="login-screen__headline">Routing Headquarters</h2>
        <div class="login-screen__logo-wrap">
          <svg viewBox="0 0 1150 120" xmlns="http://www.w3.org/2000/svg" class="login-screen__logo" aria-hidden="true">
            <path d="M 0 5 L 360 5 C 450 5 450 105 360 105 L 0 105 Z" fill="#da291c" />
            <g transform="skewX(-16)">
              <text x="80" y="86" fill="#ffffff" style="font-family:'Arial Black',Impact,system-ui,sans-serif;font-weight:900;font-size:96px;letter-spacing:-2px">
                <tspan style="font-size:96px">P</tspan><tspan style="font-size:74px;letter-spacing:-1px" dy="-4">ioneer</tspan>
              </text>
            </g>
            <g transform="translate(480, 0)">
              <text x="0" y="86" fill="#ffffff" style="font-family:'Arial Black',Impact,system-ui,sans-serif;font-weight:900;font-size:76px;letter-spacing:-2.5px;font-style:italic">Adhesives, Inc.</text>
              <path d="M -10 100 L 590 100 Q 620 100 640 80 Q 620 112 590 112 L -10 112 Z" fill="#94a3b8" />
            </g>
          </svg>
        </div>
      </div>
    </div>

    <div class="login-screen__form-area">
      <div class="login-screen__form-wrap">
        <div class="login-form">
          <div class="login-form__row">
            <label class="login-form__label" for="login-username">Username</label>
            <input id="login-username" type="text" autocomplete="username"
                   class="login-form__input"
                   placeholder="Enter username">
          </div>

          <div class="login-form__row">
            <label class="login-form__label" for="login-password">Password</label>
            <input id="login-password" type="password" autocomplete="current-password"
                   class="login-form__input"
                   placeholder="Enter password">
          </div>

          <div id="login-error" class="login-form__error hidden"></div>

          <div class="login-form__submit-wrap">
            <button id="login-btn" type="button" onclick="_handleLoginSubmit()" class="login-form__submit">
              Login
            </button>
          </div>

          <p class="login-form__footer">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(screen);

  screen.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleLoginSubmit();
  });

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
  if (errorEl) { errorEl.classList.add('hidden'); errorEl.textContent = ''; }

  if (!username || !password) {
    _showLoginError('Please enter both username and password.');
    return;
  }

  // Loading state
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

  const result = await Auth.login(username, password);

  if (result.ok) {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    // Resolve the waiting promise in main.js
    if (typeof window._loginSuccessCallback === 'function') {
      window._loginSuccessCallback();
      window._loginSuccessCallback = null;
    }
  } else {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    _showLoginError(result.error);
    if (passwordEl) { passwordEl.value = ''; passwordEl.focus(); }
  }
}

function _showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function _getInitials(username) {
  if (!username) return '?';
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function _updateUserBadge(user) {
  const badge = document.getElementById('user-badge');
  const logoutBtn = document.getElementById('header-logout-btn');
  const roleBadge = document.getElementById('role-badge');
  if (!badge || !user) return;

  const roleLabel = { admin: 'Admin', superuser: 'Super User', user: 'User' }[user.role] || user.role;
  const displayName = user.full_name || user.username || 'User';

  badge.innerHTML = `
    <div class="user-profile-pill">
      <div class="user-avatar"><span id="user-initials">${_getInitials(displayName)}</span></div>
      <div class="user-profile-info">
        <p id="user-name" class="user-profile-name">${displayName}</p>
        <p id="user-role-text" class="user-profile-role">${roleLabel}</p>
      </div>
    </div>
  `;
  badge.style.display = 'block';

  if (logoutBtn) logoutBtn.classList.remove('hidden');

  if (roleBadge) {
    if (user.role === 'admin') {
      roleBadge.classList.remove('hidden');
    } else {
      roleBadge.classList.add('hidden');
    }
  }
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
    if (el) el.style.display = allowedRoles.includes(role) ? 'inline-flex' : 'none';
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
