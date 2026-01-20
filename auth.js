// Simple Supabase-based auth for admin portal

let authSupabase = null;
let currentUserProfile = null;

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
  const isAuthenticated = await requireAuth();
  if (!isAuthenticated) {
    return; // Will redirect to login, so exit early
  }
  
  // Load and display user profile
  await loadUserProfile();
  updateUserProfileDisplay();
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
      return false;
    }
    return true;
  } catch (err) {
    console.error('Auth check failed', err);
    const redirectTo = window.location.pathname + window.location.search;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectTo)}`;
    return false;
  }
}

// Load user profile from Supabase profiles table
async function loadUserProfile() {
  try {
    const { data: { user }, error: userError } = await authSupabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user', userError);
      return;
    }

    // Fetch profile from profiles table
    const { data: profile, error: profileError } = await authSupabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile', profileError);
      // Fallback to user email if profile not found
      currentUserProfile = {
        full_name: user.email?.split('@')[0] || 'User',
        role: 'user'
      };
      return;
    }

    currentUserProfile = {
      full_name: profile.full_name || user.email?.split('@')[0] || 'User',
      role: profile.role || 'user'
    };
  } catch (err) {
    console.error('Unexpected error loading profile', err);
    currentUserProfile = {
      full_name: 'User',
      role: 'user'
    };
  }
}

// Update the sidebar user profile display
function updateUserProfileDisplay() {
  if (!currentUserProfile) return;

  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');

  if (userNameEl) {
    userNameEl.textContent = currentUserProfile.full_name;
  }

  if (userRoleEl) {
    // Format role for display (e.g., 'store_manager' -> 'Store Manager')
    const roleDisplay = currentUserProfile.role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    userRoleEl.textContent = roleDisplay;
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

      // Load user profile after successful login
      await loadUserProfile();

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

