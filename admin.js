// Admin Portal JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
        // Prevent body scroll when sidebar is open on mobile
        if (window.innerWidth <= 768) {
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = sidebarToggle && sidebarToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        }
    });
    
    // Close sidebar when clicking nav items on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                // Small delay to allow navigation
                setTimeout(closeSidebar, 100);
            }
        });
    });
    
    // Modal Functions
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Product Modal
    const addProductBtn = document.getElementById('addProductBtn');
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeModal');
    const cancelProductBtn = document.getElementById('cancelBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) modalTitle.textContent = 'Add New Product';
            openModal('productModal');
        });
    }
    
    if (closeProductModal) {
        closeProductModal.addEventListener('click', function() {
            closeModal('productModal');
        });
    }
    
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', function() {
            closeModal('productModal');
        });
    }
    
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Here you would normally save the product via API
            alert('Product saved successfully! (This is a UI demo)');
            closeModal('productModal');
        });
    }
    
    // Edit Product Buttons
    const editProductBtns = document.querySelectorAll('.edit-btn');
    editProductBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) modalTitle.textContent = 'Edit Product';
            openModal('productModal');
        });
    });
    
    // Order Modal
    const viewOrderBtns = document.querySelectorAll('.view-btn');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    
    viewOrderBtns.forEach(btn => {
        if (btn.closest('tr')) {
            btn.addEventListener('click', function() {
                openModal('orderModal');
            });
        }
    });
    
    if (closeOrderModal) {
        closeOrderModal.addEventListener('click', function() {
            closeModal('orderModal');
        });
    }
    
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', function() {
            closeModal('orderModal');
        });
    }
    
    // Stock Modal
    const stockModal = document.getElementById('stockModal');
    const closeStockModal = document.getElementById('closeStockModal');
    const cancelStockBtn = document.getElementById('cancelStockBtn');
    const updateStockBtn = document.getElementById('updateStockBtn');
    
    const editStockBtns = document.querySelectorAll('.edit-btn');
    editStockBtns.forEach(btn => {
        if (btn.closest('tr') && document.getElementById('stockModal')) {
            btn.addEventListener('click', function() {
                openModal('stockModal');
            });
        }
    });
    
    if (closeStockModal) {
        closeStockModal.addEventListener('click', function() {
            closeModal('stockModal');
        });
    }
    
    if (cancelStockBtn) {
        cancelStockBtn.addEventListener('click', function() {
            closeModal('stockModal');
        });
    }
    
    if (updateStockBtn) {
        updateStockBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Stock updated successfully! (This is a UI demo)');
            closeModal('stockModal');
        });
    }
    
    // Settings Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const settingsContents = document.querySelectorAll('.settings-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(tab => tab.classList.remove('active'));
            settingsContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Save Settings
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            alert('Settings saved successfully! (This is a UI demo)');
        });
    }
    
    // Form Validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Form validation would go here
            alert('Form submitted! (This is a UI demo)');
        });
    });
    
    // Image Preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = input.closest('.image-upload').querySelector('.preview-image');
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    });
    
    // Status Select Change Handler
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Remove all status classes
            this.classList.remove('status-pending', 'status-processing', 'status-shipped', 'status-delivered');
            
            // Add appropriate class based on selected value
            const value = this.value.toLowerCase();
            if (value === 'pending') {
                this.classList.add('status-pending');
            } else if (value === 'processing') {
                this.classList.add('status-processing');
            } else if (value === 'shipped') {
                this.classList.add('status-shipped');
            } else if (value === 'delivered') {
                this.classList.add('status-delivered');
            }
            
            // In a real app, this would update the order status via API
            console.log('Status updated to:', value);
        });
    });
    
    // Delete Confirmation
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                // In a real app, this would delete the item via API
                alert('Item deleted! (This is a UI demo)');
                // Optionally remove the row from the table
                // this.closest('tr').remove();
            }
        });
    });
    
    // Search Functionality (Basic)
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.content-wrapper').querySelector('.data-table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    });
    
    // Filter Functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // In a real app, this would filter the data via API
            console.log('Filter changed:', this.value);
        });
    });
    
    // Pagination
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled && !this.classList.contains('active')) {
                // Remove active class from all buttons
                paginationBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // In a real app, this would load the page data via API
                console.log('Page changed');
            }
        });
    });
    
    // Toggle Switches
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            // In a real app, this would update the setting via API
            console.log('Toggle changed:', this.checked);
        });
    });
    
    // Checkbox Groups
    const checkboxGroups = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxGroups.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // In a real app, this would update the setting via API
            console.log('Checkbox changed:', this.checked);
        });
    });
    
    // Responsive Sidebar
    function handleResize() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Convert tables to mobile cards
    function convertTablesToMobile() {
        if (window.innerWidth <= 768) {
            const tables = document.querySelectorAll('.data-table');
            tables.forEach(table => {
                const tableCard = table.closest('.table-card');
                if (tableCard && !tableCard.querySelector('.table-card-mobile')) {
                    const thead = table.querySelector('thead');
                    const tbody = table.querySelector('tbody');
                    
                    if (!thead || !tbody) return;
                    
                    const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent.trim());
                    const rows = tbody.querySelectorAll('tr');
                    
                    const mobileContainer = document.createElement('div');
                    mobileContainer.className = 'table-card-mobile';
                    
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length === 0) return;
                        
                        const card = document.createElement('div');
                        card.className = 'mobile-table-card';
                        
                        // Get main title (usually first column)
                        const mainTitle = cells[0].textContent.trim();
                        const cardHeader = document.createElement('div');
                        cardHeader.className = 'mobile-table-card-header';
                        cardHeader.innerHTML = `<div class="mobile-table-card-title">${mainTitle}</div>`;
                        card.appendChild(cardHeader);
                        
                        const cardBody = document.createElement('div');
                        cardBody.className = 'mobile-table-card-body';
                        
                        // Add each column as a row
                        for (let i = 1; i < cells.length && i < headers.length; i++) {
                            const label = headers[i];
                            const value = cells[i].cloneNode(true);
                            
                            // Skip action columns - they'll be added separately
                            if (label.toLowerCase().includes('action') || value.querySelector('.action-buttons')) {
                                continue;
                            }
                            
                            const row = document.createElement('div');
                            row.className = 'mobile-table-row';
                            
                            const labelEl = document.createElement('div');
                            labelEl.className = 'mobile-table-label';
                            labelEl.textContent = label;
                            
                            const valueEl = document.createElement('div');
                            valueEl.className = 'mobile-table-value';
                            
                            // Copy inner HTML but clean up
                            valueEl.innerHTML = value.innerHTML;
                            
                            row.appendChild(labelEl);
                            row.appendChild(valueEl);
                            cardBody.appendChild(row);
                        }
                        
                        // Add action buttons if they exist
                        const actionCell = Array.from(cells).find(cell => cell.querySelector('.action-buttons'));
                        if (actionCell) {
                            const actions = actionCell.querySelector('.action-buttons');
                            if (actions) {
                                const actionsRow = document.createElement('div');
                                actionsRow.className = 'mobile-table-actions';
                                actionsRow.innerHTML = actions.innerHTML;
                                cardBody.appendChild(actionsRow);
                            }
                        }
                        
                        card.appendChild(cardBody);
                        mobileContainer.appendChild(card);
                    });
                    
                    tableCard.appendChild(mobileContainer);
                }
            });
        } else {
            // Remove mobile cards on larger screens
            const mobileCards = document.querySelectorAll('.table-card-mobile');
            mobileCards.forEach(card => card.remove());
        }
    }
    
    // Convert tables on load and resize
    convertTablesToMobile();
    window.addEventListener('resize', convertTablesToMobile);
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        // Close modals with Escape key
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
    
    // Initialize tooltips (if you add a tooltip library)
    // This is a placeholder for tooltip initialization
    
    // Main Site URL Management
    function getMainSiteUrl() {
        return localStorage.getItem('mainSiteUrl') || '';
    }
    
    function setMainSiteUrl(url) {
        localStorage.setItem('mainSiteUrl', url);
        updateMainSiteLinks();
    }
    
    function updateMainSiteLinks() {
        const url = getMainSiteUrl();
        const mainSiteLinks = document.querySelectorAll('#mainSiteLink');
        mainSiteLinks.forEach(link => {
            if (url) {
                link.href = url;
                link.style.display = 'flex';
            } else {
                link.href = '#';
                link.style.display = 'none';
            }
        });
    }
    
    // Initialize main site links
    updateMainSiteLinks();
    
    // Load main site URL into settings form if it exists
    const mainSiteUrlInput = document.getElementById('mainSiteUrl');
    if (mainSiteUrlInput) {
        const savedUrl = getMainSiteUrl();
        if (savedUrl) {
            mainSiteUrlInput.value = savedUrl;
        }
        
        // Save main site URL when changed in settings
        mainSiteUrlInput.addEventListener('change', function() {
            if (this.value) {
                setMainSiteUrl(this.value);
            }
        });
        
        mainSiteUrlInput.addEventListener('blur', function() {
            if (this.value) {
                setMainSiteUrl(this.value);
            }
        });
    }
    
    // Save settings handler - also saves main site URL
    if (saveSettingsBtn) {
        const originalSaveHandler = saveSettingsBtn.onclick;
        saveSettingsBtn.addEventListener('click', function() {
            if (mainSiteUrlInput && mainSiteUrlInput.value) {
                setMainSiteUrl(mainSiteUrlInput.value);
            }
            if (originalSaveHandler) {
                originalSaveHandler();
            } else {
                alert('Settings saved successfully! (This is a UI demo)');
            }
        });
    }
    
    console.log('Admin Portal initialized');
});


