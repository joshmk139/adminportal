// Products Management with Supabase

let currentEditingId = null;
let isEditMode = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    const supabase = initSupabase();
    
    if (!supabase) {
        console.warn('Supabase not initialized. Using demo mode.');
        // Still setup handlers for demo
        setupProductHandlers(null);
        return;
    }
    
    // Load products data on page load
    loadProducts();
    
    // Set up form handlers
    setupProductHandlers(supabase);
    
    // Setup search and filters
    setupSearchAndFilters();
});

// Load products from Supabase
async function loadProducts() {
    const supabase = initSupabase();
    if (!supabase) {
        // Demo mode - keep existing HTML data
        return;
    }
    
    try {
        // Query products with their variants and inventory
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        
        // Get variants for each product
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {
                const { data: variants, error: variantsError } = await supabase
                    .from('product_variants')
                    .select(`
                        id,
                        sku,
                        price,
                        inventory (quantity, reserved_quantity)
                    `)
                    .eq('product_id', product.id);
                
                if (variantsError) {
                    console.error('Error loading variants:', variantsError);
                    return { ...product, variants: [] };
                }
                
                // Get first variant for display (or aggregate)
                const firstVariant = variants[0];
                const totalStock = variants.reduce((sum, v) => sum + (v.inventory?.[0]?.quantity || 0), 0);
                const sales = 0; // Would need order_items to calculate
                
                return {
                    ...product,
                    variant_id: firstVariant?.id,
                    sku: firstVariant?.sku || 'N/A',
                    price: firstVariant?.price || 0,
                    stock: totalStock,
                    sales: sales
                };
            })
        );
        
        // Update the table with data from database
        updateProductsTable(productsWithVariants);
        
    } catch (err) {
        console.error('Error loading products:', err);
        showNotification('Failed to load products: ' + err.message, 'error');
    }
}

// Update products table with database data
function updateProductsTable(productsData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    
    // Clear existing rows (keep checkbox column header)
    tbody.innerHTML = '';
    
    productsData.forEach(product => {
        const stockBadgeClass = getStockBadgeClass(product.stock);
        const stockBadgeText = getStockBadgeText(product.stock);
        const statusBadgeClass = product.is_active ? 'status-active' : 'status-inactive';
        const statusBadgeText = product.is_active ? 'Active' : 'Inactive';
        
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        row.dataset.variantId = product.variant_id || '';
        
        row.innerHTML = `
            <td><input type="checkbox"></td>
            <td>
                <div class="product-cell">
                    <div class="product-img" style="background: linear-gradient(135deg, #E8B4A8, #D4A574); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; width: 50px; height: 50px; border-radius: 12px;">
                        ${product.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong>${product.name}</strong>
                        <span class="product-id">ID: ${product.id.substring(0, 8)}</span>
                    </div>
                </div>
            </td>
            <td>${product.category}</td>
            <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
            <td>
                <span class="stock-badge ${stockBadgeClass}">${product.stock || 0} units</span>
            </td>
            <td>
                <span class="status-badge ${statusBadgeClass}">${statusBadgeText}</span>
            </td>
            <td>${product.sales || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-attach event listeners
    attachProductButtonListeners();
}

// Get stock badge class
function getStockBadgeClass(stock) {
    if (stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    if (stock <= 20) return 'stock-medium';
    return 'stock-high';
}

// Get stock badge text
function getStockBadgeText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
}

// Setup form handlers
function setupProductHandlers(supabase) {
    const addProductBtn = document.getElementById('addProductBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModal = document.getElementById('closeModal');
    const productModal = document.getElementById('productModal');
    const productForm = document.querySelector('.product-form');
    
    // Add product button
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            isEditMode = false;
            currentEditingId = null;
            resetProductForm();
            document.getElementById('modalTitle').textContent = 'Add New Product';
            openModal('productModal');
        });
    }
    
    // Save product button
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (isEditMode) {
                await updateProduct(supabase);
            } else {
                await saveProduct(supabase);
            }
        });
    }
    
    // Cancel/Close handlers
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModalHandler('productModal'));
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => closeModalHandler('productModal'));
    }
}

// Attach edit/delete button listeners
function attachProductButtonListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn[data-id]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            loadProductForEdit(id);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn[data-id]');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            deleteProduct(id);
        });
    });
}

// Load product for editing
async function loadProductForEdit(productId) {
    const supabase = initSupabase();
    if (!supabase) {
        showNotification('Database not connected', 'error');
        return;
    }
    
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        // Get first variant for default values
        const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .limit(1)
            .maybeSingle();
        
        // Populate form using IDs
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category || '';
        
        if (variants) {
            document.getElementById('productPrice').value = variants.price || '';
        }
        
        document.getElementById('productStatus').value = product.is_active ? 'active' : 'inactive';
        
        isEditMode = true;
        currentEditingId = productId;
        openModal('productModal');
        
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product: ' + error.message, 'error');
    }
}

// Save new product
async function saveProduct(supabase) {
    if (!supabase) {
        showNotification('Database not connected', 'error');
        return;
    }
    
    const form = document.querySelector('.product-form');
    if (!form) return;
    
    // Get form values using IDs
    const productName = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    const status = document.getElementById('productStatus').value || 'active';
    
    // Validate
    if (!productName || !category || !price || price <= 0) {
        showNotification('Please fill in all required fields correctly', 'error');
        return;
    }
    
    try {
        // Create product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert([{
                name: productName,
                description: description,
                category: category,
                is_active: status === 'active'
            }])
            .select()
            .single();
        
        if (productError) throw productError;
        
        // Generate SKU
        const sku = generateSKU(productName, category);
        
        // Create product variant
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .insert([{
                product_id: product.id,
                sku: sku,
                price: price
            }])
            .select()
            .single();
        
        if (variantError) throw variantError;
        
        // Inventory is auto-created by trigger, but we can update it
        const { error: inventoryError } = await supabase
            .from('inventory')
            .upsert([{
                variant_id: variant.id,
                quantity: stock,
                reserved_quantity: 0
            }], {
                onConflict: 'variant_id'
            });
        
        if (inventoryError) {
            console.warn('Inventory update warning:', inventoryError);
            // Continue anyway as trigger should have created it
        }
        
        showNotification('Product created successfully!', 'success');
        closeModalHandler('productModal');
        resetProductForm();
        loadProducts(); // Reload data
        
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product: ' + error.message, 'error');
    }
}

// Update existing product
async function updateProduct(supabase) {
    if (!supabase || !currentEditingId) {
        showNotification('Invalid operation', 'error');
        return;
    }
    
    const productName = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const status = document.getElementById('productStatus').value || 'active';
    
    if (!productName || !category || !price || price <= 0) {
        showNotification('Please fill in all required fields correctly', 'error');
        return;
    }
    
    try {
        // Update product
        const { error: productError } = await supabase
            .from('products')
            .update({
                name: productName,
                description: description,
                category: category,
                is_active: status === 'active'
            })
            .eq('id', currentEditingId);
        
        if (productError) throw productError;
        
        // Update variant price (get first variant)
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', currentEditingId)
            .limit(1);
        
        if (variants && variants.length > 0) {
            const { error: variantError } = await supabase
                .from('product_variants')
                .update({ price: price })
                .eq('id', variants[0].id);
            
            if (variantError) throw variantError;
        }
        
        showNotification('Product updated successfully!', 'success');
        closeModalHandler('productModal');
        resetProductForm();
        loadProducts(); // Reload data
        
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error updating product: ' + error.message, 'error');
    }
}

// Delete product (soft delete)
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    const supabase = initSupabase();
    if (!supabase) {
        showNotification('Database not connected', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', productId);
        
        if (error) throw error;
        
        showNotification('Product deleted successfully!', 'success');
        loadProducts(); // Reload data
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product: ' + error.message, 'error');
    }
}

// Generate SKU from product name and category
function generateSKU(productName, category) {
    const categoryCode = category.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const productCode = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${categoryCode}-${productCode}-${randomNum}`;
}

// Reset product form
function resetProductForm() {
    const form = document.querySelector('.product-form');
    if (form) {
        form.reset();
        // Clear preview image
        const previewImg = document.querySelector('.preview-image');
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
    }
    isEditMode = false;
    currentEditingId = null;
}

// Setup search and filters
function setupSearchAndFilters() {
    // Search functionality is handled by admin.js
    // Filters would filter the displayed data
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Future: Filter products based on selection
            console.log('Filter changed:', this.value);
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with toast notification system
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

// Helper function to close modal
function closeModalHandler(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    resetProductForm();
}
