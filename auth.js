// Simple Supabase-based auth for admin portal

let authSupabase = null;

document.addEventListener('DOMContentLoaded', async function () {
  authSupabase = initSupabase();
  if (!authSupabase) {
    console.error('Supabase not initialized for auth');
    return;
  }

  const path = window.location.pathname;

  // If we are on the login page, set up login handlers only
  if (path.endsWith('login.html')) {
    setupLoginPage();
    return;
  }

  // On all other admin pages, require authentication
  await requireAuth();
  setupLogoutButton();
});

// Redirect to login page if not authenticated
async function requireAuth() {
  try {
    const { data, error } = await authSupabase.auth.getSession();
    if (error) {
      console.error('Error getting session', error);
    }

    const session = data?.session || null;

    if (!session) {
      const redirectTo = window.location.pathname + window.location.search;
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectTo)}`;
    }
  } catch (err) {
    console.error('Auth check failed', err);
    const redirectTo = window.location.pathname + window.location.search;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectTo)}`;
  }
}

// Set up login form on login.html
function setupLoginPage() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const errorBox = document.getElementById('loginError');

  if (!form || !emailInput || !passwordInput) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError('Please enter email and password');
      return;
    }

    try {
      const { data, error } = await authSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error', error);
        showLoginError(error.message || 'Invalid email or password');
        return;
      }

      // On success, redirect back to requested page or dashboard
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || 'index.html';
      window.location.href = redirect;
    } catch (err) {
      console.error('Unexpected login error', err);
      showLoginError('Unexpected error during login');
    }
  });

  function showLoginError(message) {
    if (!errorBox) {
      alert(message);
      return;
    }
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }
}

// Attach logout handler to sidebar "Logout" button
function setupLogoutButton() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    try {
      await authSupabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out', err);
    } finally {
      // Clear any local data and go to login page
      localStorage.clear();
      window.location.href = 'login.html';
    }
  });
}

