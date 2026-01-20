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
  
  // Try to load profile from sessionStorage first for instant display
  try {
    const storedProfile = sessionStorage.getItem('userProfile');
    if (storedProfile) {
      currentUserProfile = JSON.parse(storedProfile);
      updateUserProfileDisplay(); // Show immediately
    }
  } catch (err) {
    console.warn('Could not load profile from sessionStorage:', err);
  }
  
  // Load fresh profile from database
  await loadUserProfile();
  
  // Update display with fresh data
  updateUserProfileDisplay();
  
  // Use setTimeout to ensure DOM is fully ready (fallback)
  setTimeout(() => {
    updateUserProfileDisplay();
  }, 100);
  
  // Also update when page becomes visible (handles tab switching)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUserProfile) {
      updateUserProfileDisplay();
    }
  });
  
  setupLogoutButton();
  
  // Re-update profile display periodically to ensure consistency
  // This helps if the profile loads after initial render
  const profileUpdateInterval = setInterval(() => {
    if (currentUserProfile) {
      updateUserProfileDisplay();
    }
  }, 1000);
  
  // Clear interval after 5 seconds (enough time for profile to load)
  setTimeout(() => clearInterval(profileUpdateInterval), 5000);
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
    
    // Store in sessionStorage for quick access across pages
    try {
      sessionStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
    } catch (err) {
      console.warn('Could not store profile in sessionStorage:', err);
    }
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
  if (!currentUserProfile) {
    // If profile not loaded yet, try to load it
    if (authSupabase) {
      loadUserProfile().then(() => {
        updateUserProfileDisplay();
      });
    }
    return;
  }

  // Try multiple selectors to find elements (in case of different page structures)
  const userNameEl = document.querySelector('.user-name') || 
                     document.querySelector('[class*="user-name"]') ||
                     document.querySelector('.user-info .user-name');
  const userRoleEl = document.querySelector('.user-role') || 
                     document.querySelector('[class*="user-role"]') ||
                     document.querySelector('.user-info .user-role');

  if (userNameEl) {
    userNameEl.textContent = currentUserProfile.full_name;
    // Also update title attribute for accessibility
    userNameEl.setAttribute('title', currentUserProfile.full_name);
  } else {
    console.warn('User name element not found');
  }

  if (userRoleEl) {
    // Format role for display (e.g., 'store_manager' -> 'Store Manager')
    const roleDisplay = currentUserProfile.role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    userRoleEl.textContent = roleDisplay;
    userRoleEl.setAttribute('title', roleDisplay);
  } else {
    console.warn('User role element not found');
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
  // Remove any existing event listeners by cloning the element
  const logoutBtns = document.querySelectorAll('.logout-btn');
  
  if (logoutBtns.length === 0) {
    console.warn('Logout button not found');
    // Retry after a short delay in case DOM isn't ready
    setTimeout(() => setupLogoutButton(), 500);
    return;
  }

  logoutBtns.forEach(logoutBtn => {
    // Remove existing listeners by cloning
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    
    // Add fresh event listener
    newLogoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Disable button to prevent double-clicks
      newLogoutBtn.style.pointerEvents = 'none';
      newLogoutBtn.style.opacity = '0.6';
      
      try {
        // Sign out from Supabase
        const { error } = await authSupabase.auth.signOut();
        if (error) {
          console.error('Error signing out:', error);
          // Continue with logout even if signOut fails
        }
      } catch (err) {
        console.error('Unexpected error during sign out:', err);
        // Continue with logout anyway
      }
      
      // Clear all local data
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Also clear the userProfile specifically
        sessionStorage.removeItem('userProfile');
      } catch (err) {
        console.warn('Error clearing storage:', err);
      }
      
      // Clear current user profile
      currentUserProfile = null;
      
      // Redirect to login page
      window.location.href = 'login.html';
    });
  });
}

