// Site Settings Management for allthingsgirlie.store
// This manages settings that affect the main website (allthingsgirlie.store)

let siteSettings = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Settings will not be saved.');
        return;
    }
    
    // Load settings on page load
    loadSiteSettings();
    
    // Setup save handler
    setupSettingsSaveHandler();
});

// Load site settings from database
async function loadSiteSettings() {
    const supabase = initSupabase();
    if (!supabase) return;
    
    try {
        // Try to get site settings (create if doesn't exist)
        let { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // Settings don't exist, create default
            const defaultSettings = getDefaultSettings();
            const { data: newData, error: createError } = await supabase
                .from('site_settings')
                .insert([{ id: 1, ...defaultSettings }])
                .select()
                .single();
            
            if (createError) throw createError;
            data = newData;
        } else if (error) {
            throw error;
        }
        
        siteSettings = data;
        populateSettingsForm(data);
        
    } catch (err) {
        console.error('Error loading site settings:', err);
        // Use default settings if database fails
        siteSettings = getDefaultSettings();
        populateSettingsForm(siteSettings);
    }
}

// Get default settings structure
function getDefaultSettings() {
    return {
        // Store Information
        store_name: 'All things girlie',
        store_tagline: 'Soft beauty, made for you',
        store_description: 'Discover our carefully curated collection of lip products and personalized beauty experiences.',
        store_logo_url: 'IMG_2357.PNG',
        main_site_url: 'https://allthingsgirlie.store',
        
        // Contact Information
        email: 'hello@allthingsgirlie.com',
        phone: '+1 (555) 123-4567',
        address: '',
        city: '',
        country: '',
        
        // Social Media
        instagram_url: 'https://instagram.com/allthingsgirlie',
        tiktok_url: 'https://tiktok.com/@allthingsgirlie',
        facebook_url: '',
        
        // Payment Settings
        payment_provider: 'paystack',
        paystack_public_key: '',
        paystack_secret_key: '',
        currency: 'USD',
        currency_conversion_rate: 1450,
        
        // Shipping Settings
        default_shipping_rate: 5.00,
        free_shipping_threshold: 100.00,
        processing_time_days: 1,
        
        // Email Settings
        smtp_host: '',
        smtp_port: 587,
        smtp_encryption: 'TLS',
        email_address: 'noreply@allthingsgirlie.com',
        
        updated_at: new Date().toISOString()
    };
}

// Populate settings form with data
function populateSettingsForm(settings) {
    // General Settings
    const storeNameInput = document.querySelector('input[value="All things girlie"]');
    if (storeNameInput) storeNameInput.value = settings.store_name || 'All things girlie';
    
    const taglineInput = document.querySelector('input[value="Soft beauty, made for you"]');
    if (taglineInput) taglineInput.value = settings.store_tagline || 'Soft beauty, made for you';
    
    const descriptionTextarea = document.querySelector('.settings-form textarea');
    if (descriptionTextarea && !descriptionTextarea.value) {
        descriptionTextarea.value = settings.store_description || '';
    }
    
    const mainSiteUrlInput = document.getElementById('mainSiteUrl');
    if (mainSiteUrlInput) {
        mainSiteUrlInput.value = settings.main_site_url || 'https://allthingsgirlie.store';
    }
    
    // Contact Information
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        if (input.value === 'hello@allthingsgirlie.com' || !input.value) {
            input.value = settings.email || 'hello@allthingsgirlie.com';
        }
    });
    
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        if (input.value === '+1 (555) 123-4567' || !input.value) {
            input.value = settings.phone || '+1 (555) 123-4567';
        }
    });
    
    // Social Media
    const instagramInput = Array.from(document.querySelectorAll('input[type="url"]')).find(
        input => input.placeholder.includes('instagram')
    );
    if (instagramInput) instagramInput.value = settings.instagram_url || '';
    
    const tiktokInput = Array.from(document.querySelectorAll('input[type="url"]')).find(
        input => input.placeholder.includes('tiktok')
    );
    if (tiktokInput) tiktokInput.value = settings.tiktok_url || '';
    
    const facebookInput = Array.from(document.querySelectorAll('input[type="url"]')).find(
        input => input.placeholder.includes('facebook')
    );
    if (facebookInput) facebookInput.value = settings.facebook_url || '';
    
    // Payment Settings
    const paymentProviderSelect = document.querySelector('select option[selected]');
    if (paymentProviderSelect && paymentProviderSelect.parentElement) {
        paymentProviderSelect.parentElement.value = settings.payment_provider || 'paystack';
    }
    
    // Update main site link in sidebar
    updateMainSiteLink(settings.main_site_url);
}

// Setup save handler for settings
function setupSettingsSaveHandler() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', async function() {
        await saveSiteSettings();
    });
}

// Save site settings to database
async function saveSiteSettings() {
    const supabase = initSupabase();
    if (!supabase) {
        alert('Error: Supabase not initialized. Settings cannot be saved.');
        return;
    }
    
    try {
        // Collect all form data
        const settings = {
            id: 1,
            // Store Information
            store_name: getFormValue('input[value*="All things girlie"], input[placeholder*="Store Name"]') || 'All things girlie',
            store_tagline: getFormValue('input[value*="Soft beauty"]') || 'Soft beauty, made for you',
            store_description: getFormValue('.settings-form textarea') || '',
            main_site_url: document.getElementById('mainSiteUrl')?.value || 'https://allthingsgirlie.store',
            
            // Contact Information
            email: getFormValue('input[type="email"]') || '',
            phone: getFormValue('input[type="tel"]') || '',
            address: getFormValue('textarea[placeholder*="address"]') || '',
            city: getFormValue('input[placeholder*="City"]') || '',
            country: getFormValue('input[placeholder*="Country"]') || '',
            
            // Social Media
            instagram_url: getFormValue('input[placeholder*="instagram"]') || '',
            tiktok_url: getFormValue('input[placeholder*="tiktok"]') || '',
            facebook_url: getFormValue('input[placeholder*="facebook"]') || '',
            
            // Payment Settings
            payment_provider: getFormValue('select[required]') || 'paystack',
            paystack_public_key: getFormValue('input[placeholder*="pk_"]') || '',
            currency: getFormValue('select option[value="USD"]')?.parentElement?.value || 'USD',
            currency_conversion_rate: parseFloat(getFormValue('input[value="1450"]') || '1450'),
            
            // Shipping Settings
            default_shipping_rate: parseFloat(getFormValue('input[value="5.00"]') || '5.00'),
            free_shipping_threshold: parseFloat(getFormValue('input[value="100.00"]') || '100.00'),
            processing_time_days: parseInt(getFormValue('input[value="1"]') || '1'),
            
            updated_at: new Date().toISOString()
        };
        
        // Upsert settings (insert or update)
        const { data, error } = await supabase
            .from('site_settings')
            .upsert(settings, { onConflict: 'id' })
            .select()
            .single();
        
        if (error) throw error;
        
        siteSettings = data;
        
        // Update main site link
        updateMainSiteLink(settings.main_site_url);
        
        // Show success message
        showNotification('Settings saved successfully!', 'success');
        
        // Log activity
        logActivity('settings.updated', 'site_settings', 1, { settings: Object.keys(settings) });
        
    } catch (err) {
        console.error('Error saving site settings:', err);
        showNotification('Failed to save settings: ' + err.message, 'error');
    }
}

// Helper function to get form value
function getFormValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value : null;
}

// Update main site link in sidebar
function updateMainSiteLink(url) {
    const mainSiteLink = document.getElementById('mainSiteLink');
    if (mainSiteLink && url) {
        mainSiteLink.href = url;
        mainSiteLink.style.display = 'flex';
        
        // Also save to localStorage for admin.js compatibility
        localStorage.setItem('mainSiteUrl', url);
    }
}

// Log activity to activity_logs table
async function logActivity(action, entity, entityId, metadata = {}) {
    const supabase = initSupabase();
    if (!supabase) return;
    
    try {
        // Get current user from auth (if available)
        const { data: { user } } = await supabase.auth.getUser();
        const actorId = user?.id || null;
        
        await supabase
            .from('activity_logs')
            .insert([{
                actor_id: actorId,
                action: action,
                entity: entity,
                entity_id: entityId,
                metadata: metadata
            }]);
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
