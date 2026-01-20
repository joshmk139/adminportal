// Inventory Management with Supabase

let currentEditingId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Using demo mode.');
        return;
    }
    
    // Load inventory data on page load
    loadInventory();
    
    // Set up form handlers
    setupInventoryHandlers(supabase);
});

// Load inventory from Supabase using new schema (products → product_variants → inventory)
async function loadInventory() {
    const supabase = initSupabase();
    if (!supabase) {
        // Demo mode - show existing HTML data
        return;
    }
    
    try {
        // Query with joins to get product info, variant info, and inventory
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                id,
                quantity,
                reserved_quantity,
                variant_id,
                product_variants (
                    id,
                    sku,
                    price,
                    product_id,
                    products (
                        id,
                        name,
                        category
                    )
                )
            `)
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error loading inventory:', error);
            showNotification('Error loading inventory: ' + error.message, 'error');
            return;
        }
        
        // Transform data to match expected format
        const transformedData = data.map(item => {
            const variant = item.product_variants;
            const product = variant?.products;
            const availableStock = item.quantity - item.reserved_quantity;
            const lowStockAlert = 10; // Default, could be stored in variant or config
            
            return {
                id: item.id,
                variant_id: item.variant_id,
                sku: variant?.sku || 'N/A',
                product_name: product?.name || 'Unknown Product',
                category: product?.category || 'N/A',
                current_stock: item.quantity,
                reserved_quantity: item.reserved_quantity,
                available_stock: availableStock,
                low_stock_alert: lowStockAlert,
                unit_value: parseFloat(variant?.price || 0),
                total_value: item.quantity * parseFloat(variant?.price || 0),
                status: availableStock === 0 ? 'out_of_stock' : 
                       (availableStock <= lowStockAlert ? 'low_stock' : 'in_stock')
            };
        });
        
        // Sort by product name
        transformedData.sort((a, b) => a.product_name.localeCompare(b.product_name));
        
        // Update the table with data from database
        updateInventoryTable(transformedData);
        updateInventoryStats(transformedData);
    } catch (err) {
        console.error('Error:', err);
        showNotification('Failed to load inventory', 'error');
    }
}

// Update inventory table with database data
function updateInventoryTable(inventoryData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    inventoryData.forEach(item => {
        const statusClass = getStatusClass(item.status);
        const stockBadgeClass = getStockBadgeClass(item.current_stock, item.low_stock_alert);
        const stockBadgeText = getStockBadgeText(item.current_stock, item.low_stock_alert);
        
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    ${item.product_image_url ? 
                        `<img src="${item.product_image_url}" alt="${item.product_name}" class="product-img">` :
                        '<div class="product-img" style="background: linear-gradient(135deg, #E8B4A8, #D4A574); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${item.product_name.charAt(0)}</div>'
                    }
                    <div>
                        <strong>${item.product_name}</strong>
                        <span class="product-id">Category: ${item.category || 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td>${item.sku}</td>
            <td>
                <div class="stock-info">
                    <span class="stock-value">${item.current_stock}</span>
                    <span class="stock-unit">units</span>
                </div>
            </td>
            <td>${item.low_stock_alert} units</td>
            <td>$${parseFloat(item.unit_value).toFixed(2)}</td>
            <td><strong>$${parseFloat(item.total_value || item.current_stock * item.unit_value).toFixed(2)}</strong></td>
            <td>
                <span class="stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Update Stock" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn view-btn" title="View History">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-attach event listeners for edit buttons
    attachEditButtonListeners();
}

// Update inventory statistics
function updateInventoryStats(inventoryData) {
    const totalUnits = inventoryData.reduce((sum, item) => sum + item.current_stock, 0);
    const lowStock = inventoryData.filter(item => item.current_stock > 0 && item.current_stock <= item.low_stock_alert).length;
    const outOfStock = inventoryData.filter(item => item.current_stock === 0).length;
    const totalValue = inventoryData.reduce((sum, item) => sum + parseFloat(item.total_value || item.current_stock * item.unit_value), 0);
    
    // Update stat cards if they exist
    const stats = {
        'Total Units': totalUnits,
        'Low Stock': lowStock,
        'Out of Stock': outOfStock,
        'Inventory Value': '$' + totalValue.toFixed(0)
    };
    
    // Update stat values (if stat cards exist with these labels)
    document.querySelectorAll('.stat-value').forEach(stat => {
        const label = stat.nextElementSibling?.textContent?.trim();
        if (label && stats[label]) {
            stat.textContent = stats[label];
        }
    });
}

// Get status class for CSS styling
function getStatusClass(status) {
    const statusMap = {
        'in_stock': 'stock-high',
        'low_stock': 'stock-low',
        'out_of_stock': 'stock-out'
    };
    return statusMap[status] || 'stock-medium';
}

// Get stock badge class based on stock level
function getStockBadgeClass(currentStock, lowStockAlert) {
    if (currentStock === 0) return 'stock-out';
    if (currentStock <= lowStockAlert) return 'stock-low';
    if (currentStock <= lowStockAlert * 2) return 'stock-medium';
    return 'stock-high';
}

// Get stock badge text
function getStockBadgeText(currentStock, lowStockAlert) {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= lowStockAlert) return 'Low Stock';
    return 'In Stock';
}

// Setup form handlers
function setupInventoryHandlers(supabase) {
    const addStockBtn = document.querySelector('.btn-primary');
    const stockModal = document.getElementById('stockModal');
    const updateStockBtn = document.getElementById('updateStockBtn');
    const cancelStockBtn = document.getElementById('cancelStockBtn');
    const closeStockModal = document.getElementById('closeStockModal');
    const stockForm = document.querySelector('.stock-form');
    
    // Add stock button
    if (addStockBtn && addStockBtn.textContent.includes('Add Stock')) {
        addStockBtn.addEventListener('click', function() {
            currentEditingId = null;
            openAddStockModal();
        });
    }
    
    // Update stock button
    if (updateStockBtn) {
        updateStockBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await saveStockUpdate(supabase);
        });
    }
    
    // Cancel/Close handlers
    if (cancelStockBtn) {
        cancelStockBtn.addEventListener('click', () => closeModal('stockModal'));
    }
    
    if (closeStockModal) {
        closeStockModal.addEventListener('click', () => closeModal('stockModal'));
    }
}

// Attach edit button listeners
function attachEditButtonListeners() {
    const editButtons = document.querySelectorAll('.edit-btn[data-id]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            openEditStockModal(id);
        });
    });
}

// Open edit stock modal
async function openEditStockModal(id) {
    const supabase = initSupabase();
    if (!supabase) return;
    
    try {
        // Query with joins to get product info
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                id,
                quantity,
                reserved_quantity,
                variant_id,
                product_variants (
                    id,
                    sku,
                    price,
                    product_id,
                    products (
                        id,
                        name,
                        category
                    )
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        currentEditingId = id;
        
        // Extract product name from nested structure
        const productName = data.product_variants?.products?.name || 'Unknown Product';
        const currentStock = data.quantity || 0;
        
        // Populate form
        const productNameInput = document.getElementById('stockProductName');
        const currentStockInput = document.getElementById('stockCurrentStock');
        const quantityInput = document.getElementById('stockQuantity');
        const reasonInput = document.getElementById('stockReason');
        
        if (productNameInput) productNameInput.value = productName;
        if (currentStockInput) currentStockInput.value = currentStock;
        if (quantityInput) quantityInput.value = '';
        if (reasonInput) reasonInput.value = '';
        
        // Update modal title
        const modalTitle = document.querySelector('#stockModal h2');
        if (modalTitle) {
            modalTitle.textContent = 'Update Stock - ' + productName;
        }
        
        openModal('stockModal');
    } catch (error) {
        console.error('Error loading item:', error);
        showNotification('Error loading item details', 'error');
    }
}

// Open add stock modal (for new products - would need a different form)
function openAddStockModal() {
    showNotification('To add a new product, use the Products page first.', 'info');
}

// Save stock update
async function saveStockUpdate(supabase) {
    if (!supabase || !currentEditingId) {
        showNotification('Invalid operation', 'error');
        return;
    }
    
    const form = document.querySelector('.stock-form');
    if (!form) return;
    
    const adjustmentType = document.getElementById('stockAdjustmentType')?.value;
    const quantityInput = document.getElementById('stockQuantity');
    const reasonInput = document.getElementById('stockReason');
    
    const quantity = quantityInput ? parseInt(quantityInput.value) : 0;
    const reason = reasonInput ? reasonInput.value : '';
    
    if (!quantity || quantity <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }
    
    try {
        // Get current stock (use 'quantity' field in new schema)
        const { data: currentData, error: fetchError } = await supabase
            .from('inventory')
            .select('quantity, reserved_quantity')
            .eq('id', currentEditingId)
            .single();
        
        if (fetchError) throw fetchError;
        
        let newStock;
        switch(adjustmentType) {
            case 'Add Stock':
                newStock = (currentData.quantity || 0) + quantity;
                break;
            case 'Remove Stock':
                newStock = Math.max(0, (currentData.quantity || 0) - quantity);
                // Ensure reserved_quantity doesn't exceed new quantity
                const reserved = currentData.reserved_quantity || 0;
                if (reserved > newStock) {
                    newStock = Math.max(newStock, reserved);
                }
                break;
            case 'Set Stock':
                newStock = quantity;
                // Ensure reserved_quantity doesn't exceed new quantity
                if ((currentData.reserved_quantity || 0) > newStock) {
                    newStock = Math.max(newStock, currentData.reserved_quantity || 0);
                }
                break;
            default:
                newStock = currentData.quantity || 0;
        }
        
        // Update stock (use 'quantity' field in new schema)
        const { error: updateError } = await supabase
            .from('inventory')
            .update({ 
                quantity: newStock,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentEditingId);
        
        if (updateError) throw updateError;
        
        showNotification('Stock updated successfully!', 'success');
        closeModal('stockModal');
        loadInventory(); // Reload data
        
    } catch (error) {
        console.error('Error updating stock:', error);
        showNotification('Error updating stock: ' + error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with a toast notification system
    alert(message);
}

// Helper function to open modal (from admin.js)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Helper function to close modal (from admin.js)
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
