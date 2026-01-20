// Dashboard Data Loading with Supabase

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Using static data.');
        return;
    }
    
    // Load dashboard data
    loadDashboardData();
});

// Load dashboard data from database
async function loadDashboardData() {
    const supabase = initSupabase();
    if (!supabase) {
        return;
    }
    
    try {
        // Load statistics in parallel
        const [revenueStats, orderStats, customerStats, productStats, recentOrders, topProducts, recentActivity] = await Promise.all([
            getRevenueStats(supabase),
            getOrderStats(supabase),
            getCustomerStats(supabase),
            getProductStats(supabase),
            getRecentOrders(supabase),
            getTopProducts(supabase),
            getRecentActivity(supabase)
        ]);
        
        // Update dashboard UI
        updateDashboardStats(revenueStats, orderStats, customerStats, productStats);
        updateRecentOrders(recentOrders);
        updateTopProducts(topProducts);
        updateRecentActivity(recentActivity);
        updateRevenueChart(revenueStats);
        
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// Get revenue statistics
async function getRevenueStats(supabase) {
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'delivered')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0;
    
    // Calculate growth (simplified - would need previous period comparison)
    const previousPeriod = 11000; // Would query previous 30 days
    const growth = previousPeriod > 0 ? ((totalRevenue - previousPeriod) / previousPeriod * 100).toFixed(1) : 12.5;
    
    return {
        total: totalRevenue,
        growth: growth
    };
}

// Get order statistics
async function getOrderStats(supabase) {
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
    
    return {
        total: count || 0,
        growth: 8.2 // Would calculate from previous period
    };
}

// Get customer statistics
async function getCustomerStats(supabase) {
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
    
    return {
        total: count || 0,
        growth: 5.1
    };
}

// Get product statistics
async function getProductStats(supabase) {
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null);
    
    return {
        total: count || 0,
        growth: 0
    };
}

// Get recent orders
async function getRecentOrders(supabase) {
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            id,
            total_amount,
            status,
            created_at,
            customers (email)
        `)
        .order('created_at', { ascending: false })
        .limit(4);
    
    return orders || [];
}

// Get top products
async function getTopProducts(supabase) {
    // Get products with sales count from order_items
    const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
            quantity,
            variant_id,
            product_variants (
                id,
                price,
                product_id,
                products (
                    id,
                    name,
                    category
                )
            )
        `)
        .limit(1000); // Would need proper aggregation
    
    // Aggregate sales by product
    const productSales = {};
    orderItems?.forEach(item => {
        const productId = item.product_variants?.product_id;
        const productName = item.product_variants?.products?.name;
        const price = parseFloat(item.product_variants?.price || 0);
        const quantity = item.quantity || 0;
        
        if (productId) {
            if (!productSales[productId]) {
                productSales[productId] = {
                    name: productName,
                    sales: 0,
                    revenue: 0
                };
            }
            productSales[productId].sales += quantity;
            productSales[productId].revenue += quantity * price;
        }
    });
    
    // Sort by sales and take top 4
    return Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 4);
}

// Update dashboard statistics
function updateDashboardStats(revenue, orders, customers, products) {
    const statCards = document.querySelectorAll('.stat-value');
    
    if (statCards.length >= 4) {
        statCards[0].textContent = `$${parseFloat(revenue.total).toLocaleString()}`;
        statCards[1].textContent = orders.total;
        statCards[2].textContent = customers.total;
        statCards[3].textContent = products.total;
    }
}

// Update recent orders list
function updateRecentOrders(orders) {
    const ordersList = document.getElementById('recentOrdersList') || document.querySelector('.orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                <i class="fas fa-shopping-bag" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No orders yet</p>
            </div>
        `;
        return;
    }
    
    orders.forEach(order => {
        const orderId = `#ORD-${order.id.substring(0, 8).toUpperCase()}`;
        const customerName = order.customers?.email || 'Guest';
        const statusClass = `status-${order.status}`;
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        orderItem.innerHTML = `
            <div class="order-info">
                <span class="order-id">${orderId}</span>
                <span class="order-customer">${customerName}</span>
            </div>
            <div class="order-details">
                <span class="order-amount">$${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                <span class="order-status ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
        `;
        
        ordersList.appendChild(orderItem);
    });
}

// Update top products list
function updateTopProducts(products) {
    const productsList = document.getElementById('topProductsList') || document.querySelector('.products-list');
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
    if (!products || products.length === 0) {
        productsList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                <i class="fas fa-box" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No products yet</p>
            </div>
        `;
        return;
    }
    
    products.forEach((product, index) => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        
        productItem.innerHTML = `
            <div class="product-thumb" style="background: linear-gradient(135deg, #E8B4A8, #D4A574); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                ${product.name.charAt(0).toUpperCase()}
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.sales} sales</p>
            </div>
            <span class="product-revenue">$${parseFloat(product.revenue).toLocaleString()}</span>
        `;
        
        productsList.appendChild(productItem);
    });
}

// Load recent activity from activity_logs
async function getRecentActivity(supabase) {
    try {
        const { data: activities, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);
        
        if (error) throw error;
        return activities || [];
    } catch (err) {
        console.error('Error loading activity:', err);
        return [];
    }
}

// Update recent activity list
function updateRecentActivity(activities) {
    const activityList = document.getElementById('recentActivityList') || document.querySelector('.activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconMap = {
            'product.created': 'fa-box',
            'product.updated': 'fa-box',
            'order.created': 'fa-shopping-bag',
            'order.updated': 'fa-shopping-bag',
            'order.shipped': 'fa-truck',
            'customer.created': 'fa-user-plus',
            'settings.updated': 'fa-cog',
            'inventory.updated': 'fa-warehouse'
        };
        
        const icon = iconMap[activity.action] || 'fa-circle';
        const timeAgo = getTimeAgo(activity.created_at);
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-content">
                <p><strong>${formatActivityAction(activity.action)}</strong> ${formatActivityEntity(activity.entity, activity.metadata)}</p>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// Format activity action
function formatActivityAction(action) {
    const actionMap = {
        'product.created': 'Product created',
        'product.updated': 'Product updated',
        'order.created': 'New order',
        'order.updated': 'Order updated',
        'order.shipped': 'Order shipped',
        'customer.created': 'New customer',
        'settings.updated': 'Settings updated',
        'inventory.updated': 'Inventory updated'
    };
    return actionMap[action] || action;
}

// Format activity entity
function formatActivityEntity(entity, metadata) {
    if (metadata && metadata.name) {
        return metadata.name;
    }
    return entity;
}

// Get time ago string
function getTimeAgo(dateString) {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Update revenue chart
function updateRevenueChart(revenueStats) {
    const chartBars = document.getElementById('chartBars');
    const chartLabels = document.getElementById('chartLabels');
    
    if (!chartBars || !chartLabels) return;
    
    // For now, show placeholder bars
    // In production, you'd fetch daily revenue data
    chartBars.innerHTML = '';
    chartLabels.innerHTML = '';
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heights = [60, 80, 45, 90, 70, 85, 75]; // Placeholder heights
    
    days.forEach((day, index) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${heights[index]}%`;
        chartBars.appendChild(bar);
        
        const label = document.createElement('span');
        label.textContent = day;
        chartLabels.appendChild(label);
    });
}
