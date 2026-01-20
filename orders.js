// Orders Management with Supabase

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Using demo mode.');
        return;
    }
    
    // Load orders data on page load
    loadOrders();
    
    // Setup status change handlers
    setupStatusHandlers(supabase);
});

// Load orders from Supabase
async function loadOrders() {
    const supabase = initSupabase();
    if (!supabase) {
        return;
    }
    
    try {
        // Query orders with customer and items
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                status,
                subtotal,
                discount_amount,
                tax_amount,
                total_amount,
                created_at,
                customer_id,
                customers (
                    id,
                    email
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (ordersError) throw ordersError;
        
        // Get order items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const { data: items } = await supabase
                    .from('order_items')
                    .select('id')
                    .eq('order_id', order.id);
                
                const customerName = order.customers?.full_name || order.customers?.email || 'Guest';
                const customerInitials = customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                return {
                    ...order,
                    customer_name: customerName,
                    customer_email: order.customers?.email || '',
                    customer_initials: customerInitials,
                    item_count: items?.length || 0
                };
            })
        );
        
        // Update the table with data from database
        updateOrdersTable(ordersWithItems);
        updateOrderStats(ordersWithItems);
        
    } catch (err) {
        console.error('Error loading orders:', err);
        showNotification('Failed to load orders: ' + err.message, 'error');
    }
}

// Update orders table with database data
function updateOrdersTable(ordersData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    ordersData.forEach(order => {
        const statusClass = `status-${order.status}`;
        const orderId = `#ORD-${order.id.substring(0, 8).toUpperCase()}`;
        const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const row = document.createElement('tr');
        row.dataset.id = order.id;
        
        row.innerHTML = `
            <td>
                <strong>${orderId}</strong>
            </td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${order.customer_initials}</div>
                    <div>
                        <strong>${order.customer_name}</strong>
                        <span class="customer-email">${order.customer_email}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="items-count">${order.item_count} ${order.item_count === 1 ? 'item' : 'items'}</span>
            </td>
            <td>
                <strong>$${parseFloat(order.total_amount || 0).toFixed(2)}</strong>
            </td>
            <td>${formattedDate}</td>
            <td>
                <select class="status-select ${statusClass}" data-order-id="${order.id}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option value="refunded" ${order.status === 'refunded' ? 'selected' : ''}>Refunded</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="View Details" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Edit" data-order-id="${order.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-attach event listeners
    attachOrderButtonListeners();
}

// Update order statistics
function updateOrderStats(ordersData) {
    const stats = {
        pending: ordersData.filter(o => o.status === 'pending').length,
        processing: ordersData.filter(o => o.status === 'paid').length,
        shipped: ordersData.filter(o => o.status === 'shipped').length,
        delivered: ordersData.filter(o => o.status === 'delivered').length
    };
    
    // Update stat cards
    document.querySelectorAll('.stat-value').forEach((stat, index) => {
        const values = [stats.pending, stats.processing, stats.shipped, stats.delivered];
        if (values[index] !== undefined) {
            stat.textContent = values[index];
        }
    });
}

// Setup status change handlers
function setupStatusHandlers(supabase) {
    // Status change is handled by admin.js, but we need to update it to save to database
    const statusSelects = document.querySelectorAll('.status-select[data-order-id]');
    statusSelects.forEach(select => {
        select.addEventListener('change', async function() {
            const orderId = this.dataset.orderId;
            const newStatus = this.value;
            
            await updateOrderStatus(supabase, orderId, newStatus);
        });
    });
}

// Update order status in database
async function updateOrderStatus(supabase, orderId, newStatus) {
    if (!supabase) {
        showNotification('Database not connected', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        
        if (error) throw error;
        
        // Update status class on select element
        const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
        if (select) {
            select.className = `status-select status-${newStatus}`;
        }
        
        // Reload to update stats
        loadOrders();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status: ' + error.message, 'error');
        // Reload to revert change
        loadOrders();
    }
}

// Attach order button listeners
function attachOrderButtonListeners() {
    // View buttons
    const viewButtons = document.querySelectorAll('.view-btn[data-order-id]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            viewOrderDetails(orderId);
        });
    });
    
    // Edit buttons (future functionality)
    const editButtons = document.querySelectorAll('.edit-btn[data-order-id]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            showNotification('Edit order functionality coming soon', 'info');
        });
    });
    
    // Status selects
    const statusSelects = document.querySelectorAll('.status-select[data-order-id]');
    statusSelects.forEach(select => {
        select.addEventListener('change', async function() {
            const orderId = this.dataset.orderId;
            const newStatus = this.value;
            const supabase = initSupabase();
            await updateOrderStatus(supabase, orderId, newStatus);
        });
    });
}

// View order details
async function viewOrderDetails(orderId) {
    const supabase = initSupabase();
    if (!supabase) {
        showNotification('Database not connected', 'error');
        return;
    }
    
    try {
        // Get order with customer and items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                customers (
                    id,
                    email,
                    phone
                )
            `)
            .eq('id', orderId)
            .single();
        
        if (orderError) throw orderError;
        
        // Get order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                *,
                product_variants (
                    id,
                    sku,
                    price,
                    products (
                        name,
                        category
                    )
                )
            `)
            .eq('order_id', orderId);
        
        if (itemsError) throw itemsError;
        
        // Populate order modal (if it exists)
        populateOrderModal(order, items);
        openModal('orderModal');
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Error loading order details: ' + error.message, 'error');
    }
}

// Populate order modal
function populateOrderModal(order, items) {
    // Update modal title
    const modalTitle = document.querySelector('#orderModal h2');
    if (modalTitle) {
        modalTitle.textContent = `Order Details - #ORD-${order.id.substring(0, 8).toUpperCase()}`;
    }
    
    // Update customer info
    const customerName = order.customers?.email || 'Guest';
    // Future: Update modal with order details
    
    // For now, just open the modal
}

// Show notification
function showNotification(message, type = 'info') {
    alert(message);
}

// Helper function to open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}
