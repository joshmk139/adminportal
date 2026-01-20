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
        const [revenueStats, orderStats, customerStats, productStats, recentOrders, topProducts] = await Promise.all([
            getRevenueStats(supabase),
            getOrderStats(supabase),
            getCustomerStats(supabase),
            getProductStats(supabase),
            getRecentOrders(supabase),
            getTopProducts(supabase)
        ]);
        
        // Update dashboard UI
        updateDashboardStats(revenueStats, orderStats, customerStats, productStats);
        updateRecentOrders(recentOrders);
        updateTopProducts(topProducts);
        
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
    const ordersList = document.querySelector('.orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
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
    const productsList = document.querySelector('.products-list');
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
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
