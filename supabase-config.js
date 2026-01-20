// Supabase Configuration - Production Mode
// The anon key is safe to expose in client-side code (it's designed for public use).
// Row Level Security (RLS) policies in Supabase protect your data.

const SUPABASE_CONFIG = {
    url: 'https://ovooqbrkefhhfqngjcic.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b29xYnJrZWZoaGZxbmdqY2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTIxNTUsImV4cCI6MjA4NDQ2ODE1NX0.WncfXDAm8PUL_qtsLJuJJfUVm5hG_2a-y70i2yXmIEw'
};

// Initialize Supabase client
// Make sure to include the Supabase JS library in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Please include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    if (!SUPABASE_CONFIG.url) {
        console.warn('Supabase URL not configured.');
        return null;
    }
    
    if (!SUPABASE_CONFIG.anonKey) {
        console.warn('Supabase anon key not configured.');
        return null;
    }
    
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabaseClient;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSupabase, SUPABASE_CONFIG };
}
