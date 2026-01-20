// Customers Management with Supabase

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Using demo mode.');
        return;
    }
    
    // Load customers data on page load
    loadCustomers();
});

// Load customers from Supabase
async function loadCustomers() {
    const supabase = initSupabase();
    if (!supabase) {
        return;
    }
    
    try {
        // Query customers with order statistics
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select(`
                id,
                email,
                phone,
                created_at,
                user_id
            `)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (customersError) throw customersError;
        
        // Get order statistics for each customer
        const customersWithStats = await Promise.all(
            customers.map(async (customer) => {
                // Get orders for this customer
                const { data: orders } = await supabase
                    .from('orders')
                    .select('id, total_amount')
                    .eq('customer_id', customer.id);
                
                const orderCount = orders?.length || 0;
                const totalSpent = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0;
                
                // Get customer name from profile if linked
                let fullName = '';
                if (customer.user_id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', customer.user_id)
                        .single();
                    
                    fullName = profile?.full_name || '';
                }
                
                // Generate initials
                const initials = fullName 
                    ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : customer.email.substring(0, 2).toUpperCase();
                
                const joinedDate = new Date(customer.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                return {
                    ...customer,
                    name: fullName || customer.email.split('@')[0],
                    initials: initials,
                    order_count: orderCount,
                    total_spent: totalSpent,
                    joined_date: joinedDate,
                    status: orderCount > 0 ? 'active' : 'active' // Default to active
                };
            })
        );
        
        // Update the table with data from database
        updateCustomersTable(customersWithStats);
        updateCustomerStats(customersWithStats);
        
    } catch (err) {
        console.error('Error loading customers:', err);
        showNotification('Failed to load customers: ' + err.message, 'error');
    }
}

// Update customers table with database data
function updateCustomersTable(customersData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    customersData.forEach(customer => {
        const statusBadgeClass = customer.status === 'active' ? 'status-active' : 'status-inactive';
        const customerId = `CUST-${customer.id.substring(0, 6).toUpperCase()}`;
        
        const row = document.createElement('tr');
        row.dataset.id = customer.id;
        
        row.innerHTML = `
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${customer.initials}</div>
                    <div>
                        <strong>${customer.name}</strong>
                        <span class="customer-id">ID: ${customerId}</span>
                    </div>
                </div>
            </td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.order_count}</td>
            <td><strong>$${parseFloat(customer.total_spent).toFixed(2)}</strong></td>
            <td>${customer.joined_date}</td>
            <td>
                <span class="status-badge ${statusBadgeClass}">Active</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="View Details" data-customer-id="${customer.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Edit" data-customer-id="${customer.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-attach event listeners
    attachCustomerButtonListeners();
}

// Update customer statistics
function updateCustomerStats(customersData) {
    const totalCustomers = customersData.length;
    const newThisMonth = customersData.filter(c => {
        const created = new Date(c.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const activeCustomers = customersData.filter(c => c.order_count > 0).length;
    const avgRating = 4.8; // Would need reviews table
    
    // Update stat cards
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues[0].textContent = totalCustomers;
        statValues[1].textContent = newThisMonth;
        statValues[2].textContent = activeCustomers;
        statValues[3].textContent = avgRating;
    }
}

// Attach customer button listeners
function attachCustomerButtonListeners() {
    // View buttons
    const viewButtons = document.querySelectorAll('.view-btn[data-customer-id]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.customerId;
            viewCustomerDetails(customerId);
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn[data-customer-id]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.customerId;
            showNotification('Edit customer functionality coming soon', 'info');
        });
    });
}

// View customer details (future functionality)
function viewCustomerDetails(customerId) {
    showNotification('Customer details view coming soon', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    alert(message);
}
