// Global state
let tableData = {
    selectedTable: null,
    tables: {}
};

// Initialize tables with 10 tables
for (let i = 1; i <= 10; i++) {
    tableData.tables[i] = {
        id: i,
        status: 'available',
        order: null
    };
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tables
    renderTables();
    
    // Load saved state from session storage
    loadStateFromSessionStorage();
    
    // Category filter functionality
    const categoryButtons = document.querySelectorAll('#menu-categories button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterMenuItems(category);
            
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Add to order button functionality
    const addButtons = document.querySelectorAll('.add-to-order-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!tableData.selectedTable) {
                // Show warning to select a table first
                alert('Please select a table first!');
                // Switch to tables tab
                document.getElementById('tables-tab').click();
                return;
            }
            
            const itemId = e.currentTarget.dataset.id;
            const itemName = e.currentTarget.dataset.name;
            const price = parseFloat(e.currentTarget.dataset.price);
            addToOrder(itemId, itemName, price);
        });
    });
    
    // Tab change event to update UI accordingly
    const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            if (e.target.id === 'order-tab') {
                updateOrderTabUI();
            }
        });
    });
    
    // Set up modals and buttons
    setupTableSelectionModal();
    
    // Place order button
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
    
    // Clear cart button
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
});

// Render the table cards in the tables container
function renderTables() {
    const tablesContainer = document.getElementById('tables-container');
    tablesContainer.innerHTML = '';
    
    const row = document.createElement('div');
    row.className = 'row';
    
    for (let i = 1; i <= 10; i++) {
        const table = tableData.tables[i] || { id: i, status: 'available' };
        
        // Create table card
        const col = document.createElement('div');
        col.className = 'col-md-2 col-sm-4 mb-4';
        
        const statusClass = table.status === 'available' ? 'available' : 'occupied';
        const isSelected = tableData.selectedTable === i;
        
        col.innerHTML = `
            <div class="card table-card ${statusClass} ${isSelected ? 'selected' : ''}" data-table-id="${i}">
                <div class="card-body text-center">
                    <i class="fas fa-utensils table-icon"></i>
                    <div class="table-number">${i}</div>
                </div>
            </div>
        `;
        
        row.appendChild(col);
    }
    
    tablesContainer.appendChild(row);
    
    // Add click event to table cards
    const tableCards = document.querySelectorAll('.table-card');
    tableCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const tableId = parseInt(e.currentTarget.dataset.tableId);
            showTableSelectionModal(tableId);
        });
    });
}

// Filter menu items by category
function filterMenuItems(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Show table selection modal
function showTableSelectionModal(tableId) {
    const table = tableData.tables[tableId];
    const modal = new bootstrap.Modal(document.getElementById('tableSelectionModal'));
    
    // Set table number in modal
    document.getElementById('modalTableNumber').textContent = tableId;
    
    // Handle different table states
    const availableContent = document.getElementById('tableAvailableContent');
    const occupiedContent = document.getElementById('tableOccupiedContent');
    const selectTableBtn = document.getElementById('selectTableBtn');
    const viewOrderBtn = document.getElementById('viewOrderBtn');
    const markAvailableBtn = document.getElementById('markAvailableBtn');
    
    if (table.status === 'available') {
        availableContent.classList.remove('d-none');
        occupiedContent.classList.add('d-none');
        selectTableBtn.classList.remove('d-none');
        viewOrderBtn.classList.add('d-none');
        markAvailableBtn.classList.add('d-none');
    } else {
        availableContent.classList.add('d-none');
        occupiedContent.classList.remove('d-none');
        selectTableBtn.classList.add('d-none');
        viewOrderBtn.classList.remove('d-none');
        markAvailableBtn.classList.remove('d-none');
        
        // Display current order
        const modalOrderItems = document.getElementById('modalOrderItems');
        modalOrderItems.innerHTML = '';
        
        if (table.order && table.order.items.length > 0) {
            table.order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.price).toFixed(2)}</td>
                `;
                modalOrderItems.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" class="text-center">No items in order</td>`;
            modalOrderItems.appendChild(row);
        }
    }
    
    modal.show();
}

// Setup the table selection modal buttons
function setupTableSelectionModal() {
    const selectTableBtn = document.getElementById('selectTableBtn');
    const viewOrderBtn = document.getElementById('viewOrderBtn');
    const markAvailableBtn = document.getElementById('markAvailableBtn');
    
    // Select table button
    selectTableBtn.addEventListener('click', () => {
        const tableId = parseInt(document.getElementById('modalTableNumber').textContent);
        selectTable(tableId);
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('tableSelectionModal')).hide();
        
        // Switch to Order tab
        document.getElementById('order-tab').click();
    });
    
    // View order button
    viewOrderBtn.addEventListener('click', () => {
        const tableId = parseInt(document.getElementById('modalTableNumber').textContent);
        selectTable(tableId);
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('tableSelectionModal')).hide();
        
        // Switch to Order tab
        document.getElementById('order-tab').click();
    });
    
    // Mark available button
    markAvailableBtn.addEventListener('click', () => {
        const tableId = parseInt(document.getElementById('modalTableNumber').textContent);
        markTableAvailable(tableId);
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('tableSelectionModal')).hide();
    });
}

// Select a table to create/edit an order
function selectTable(tableId) {
    // Update the selected table
    tableData.selectedTable = tableId;
    
    // If table is available, mark it as selected
    if (tableData.tables[tableId].status === 'available') {
        tableData.tables[tableId].status = 'selected';
        // Initialize empty order
        tableData.tables[tableId].order = {
            table_id: tableId,
            items: [],
            notes: '',
            total: 0
        };
    }
    
    // Update UI
    renderTables();
    updateOrderTabUI();
    saveStateToSessionStorage();
}

// Mark a table as available
function markTableAvailable(tableId) {
    // Clear the order for this table
    tableData.tables[tableId].status = 'available';
    tableData.tables[tableId].order = null;
    
    // If this was the selected table, deselect it
    if (tableData.selectedTable === tableId) {
        tableData.selectedTable = null;
    }
    
    // Update UI
    renderTables();
    updateOrderTabUI();
    saveStateToSessionStorage();
}

// Update order tab UI when selected table changes
function updateOrderTabUI() {
    const selectedTableBanner = document.getElementById('selected-table-banner');
    const selectedTableNumber = document.getElementById('selected-table-number');
    const cartTableNumber = document.getElementById('cart-table-number');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (tableData.selectedTable) {
        // Show selected table banner
        selectedTableBanner.classList.remove('d-none');
        selectedTableNumber.textContent = tableData.selectedTable;
        cartTableNumber.textContent = tableData.selectedTable;
        
        // Update cart
        updateCart();
        
        // Enable/disable buttons based on cart contents
        const table = tableData.tables[tableData.selectedTable];
        if (table.order && table.order.items.length > 0) {
            placeOrderBtn.disabled = false;
            clearCartBtn.disabled = false;
            emptyCartMessage.classList.add('d-none');
        } else {
            placeOrderBtn.disabled = true;
            clearCartBtn.disabled = true;
            emptyCartMessage.classList.remove('d-none');
        }
    } else {
        // Hide selected table banner
        selectedTableBanner.classList.add('d-none');
        selectedTableNumber.textContent = '--';
        cartTableNumber.textContent = '--';
        
        // Clear cart
        document.getElementById('orderCart').innerHTML = `
            <div class="text-center text-muted py-4" id="empty-cart-message">
                <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        
        // Disable buttons
        placeOrderBtn.disabled = true;
        clearCartBtn.disabled = true;
    }
}

// Add an item to the order
function addToOrder(itemId, itemName, price) {
    if (!tableData.selectedTable) return;
    
    const table = tableData.tables[tableData.selectedTable];
    if (!table.order) {
        table.order = {
            table_id: tableData.selectedTable,
            items: [],
            notes: '',
            total: 0
        };
    }
    
    // Check if item already exists in the order
    const existingItemIndex = table.order.items.findIndex(item => item.id === itemId);
    
    if (existingItemIndex !== -1) {
        // Increment quantity
        table.order.items[existingItemIndex].quantity += 1;
        // Update total
        table.order.items[existingItemIndex].total = 
            table.order.items[existingItemIndex].quantity * table.order.items[existingItemIndex].price;
    } else {
        // Add new item
        table.order.items.push({
            id: itemId,
            name: itemName,
            price: price,
            quantity: 1,
            total: price
        });
    }
    
    // Calculate order total
    updateOrderTotal(table.order);
    
    // Update UI
    updateCart();
    document.getElementById('placeOrderBtn').disabled = false;
    document.getElementById('clearCartBtn').disabled = false;
    document.getElementById('empty-cart-message').classList.add('d-none');
    
    // Mark table as occupied
    table.status = 'occupied';
    
    // Save state
    saveStateToSessionStorage();
}

// Update the order total
function updateOrderTotal(order) {
    order.total = order.items.reduce((sum, item) => sum + item.total, 0);
}

// Update the cart UI
function updateCart() {
    if (!tableData.selectedTable) return;
    
    const table = tableData.tables[tableData.selectedTable];
    if (!table.order) return;
    
    const orderCart = document.getElementById('orderCart');
    const cartTotal = document.getElementById('cartTotal');
    
    // Clear cart content
    orderCart.innerHTML = '';
    
    // Add items to cart
    if (table.order.items.length > 0) {
        table.order.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item-row';
            cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">$${item.price.toFixed(2)} each</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="input-group input-group-sm me-2" style="width: 100px;">
                            <button class="btn btn-outline-secondary" type="button" data-item-id="${item.id}" data-action="decrease">-</button>
                            <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                            <button class="btn btn-outline-secondary" type="button" data-item-id="${item.id}" data-action="increase">+</button>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" type="button" data-item-id="${item.id}" data-action="remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <span>Subtotal:</span>
                    <span>$${item.total.toFixed(2)}</span>
                </div>
            `;
            orderCart.appendChild(cartItem);
        });
        
        // Add event listeners for quantity buttons
        orderCart.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleCartAction);
        });
    } else {
        orderCart.innerHTML = `
            <div class="text-center text-muted py-4" id="empty-cart-message">
                <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    }
    
    // Update total
    cartTotal.textContent = `$${table.order.total.toFixed(2)}`;
    
    // Update notes
    document.getElementById('orderNotes').value = table.order.notes || '';
}

// Handle cart item actions (increase, decrease, remove)
function handleCartAction(e) {
    if (!tableData.selectedTable) return;
    
    const table = tableData.tables[tableData.selectedTable];
    if (!table.order) return;
    
    const action = e.currentTarget.dataset.action;
    const itemId = e.currentTarget.dataset.itemId;
    const itemIndex = table.order.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;
    
    switch (action) {
        case 'increase':
            table.order.items[itemIndex].quantity += 1;
            table.order.items[itemIndex].total = 
                table.order.items[itemIndex].quantity * table.order.items[itemIndex].price;
            break;
        case 'decrease':
            if (table.order.items[itemIndex].quantity > 1) {
                table.order.items[itemIndex].quantity -= 1;
                table.order.items[itemIndex].total = 
                    table.order.items[itemIndex].quantity * table.order.items[itemIndex].price;
            }
            break;
        case 'remove':
            table.order.items.splice(itemIndex, 1);
            break;
    }
    
    // Update order total
    updateOrderTotal(table.order);
    
    // Update UI
    updateCart();
    
    // If cart is empty, disable place order button
    if (table.order.items.length === 0) {
        document.getElementById('placeOrderBtn').disabled = true;
        document.getElementById('clearCartBtn').disabled = true;
        document.getElementById('empty-cart-message').classList.remove('d-none');
    }
    
    // Save state
    saveStateToSessionStorage();
}

// Place an order
function placeOrder() {
    if (!tableData.selectedTable) return;
    
    const table = tableData.tables[tableData.selectedTable];
    if (!table.order || table.order.items.length === 0) return;
    
    // Get notes
    table.order.notes = document.getElementById('orderNotes').value;
    
    // Submit the order to the server
    submitOrderToServer(table.order)
        .then(response => {
            // Show success modal
            document.getElementById('successTableNumber').textContent = tableData.selectedTable;
            const successModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
            successModal.show();
            
            // Reset the cart but keep the table occupied
            table.status = 'occupied';
            table.order.submitted = true;
            
            // Update UI
            updateCart();
            renderTables();
            saveStateToSessionStorage();
        })
        .catch(error => {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        });
}

// Submit the order to the server
async function submitOrderToServer(order) {
    try {
        const response = await fetch('/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_id: 1, // Default customer ID
                employee_id: 1, // Default employee ID
                table_id: order.table_id,
                total_price: order.total,
                items: order.items.map(item => ({
                    food_id: parseInt(item.id) || 1,
                    quantity: item.quantity,
                    note: item.note || ""
                })),
                special_instructions: order.notes
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit order');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error submitting order:', error);
        throw error;
    }
}

// Clear the cart
function clearCart() {
    if (!tableData.selectedTable) return;
    
    const table = tableData.tables[tableData.selectedTable];
    if (!table.order) return;
    
    // Clear items and notes
    table.order.items = [];
    table.order.notes = '';
    table.order.total = 0;
    
    // Update UI
    updateCart();
    document.getElementById('placeOrderBtn').disabled = true;
    document.getElementById('clearCartBtn').disabled = true;
    document.getElementById('empty-cart-message').classList.remove('d-none');
    
    // Save state
    saveStateToSessionStorage();
}

// Save current state to session storage
function saveStateToSessionStorage() {
    sessionStorage.setItem('waiterTableData', JSON.stringify(tableData));
}

// Load saved state from session storage
function loadStateFromSessionStorage() {
    const savedData = sessionStorage.getItem('waiterTableData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            tableData = parsedData;
            renderTables();
            updateOrderTabUI();
        } catch (error) {
            console.error('Error parsing saved state:', error);
        }
    }
}

// Fetch available tables from server
async function fetchAvailableTables() {
    try {
        const response = await fetch('/api/tables/');
        if (!response.ok) {
            throw new Error('Failed to fetch tables');
        }
        
        const data = await response.json();
        return data.tables || [];
    } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
    }
}

// Initial fetch of tables (commented out for now since we're using static tables)
/*
(async function() {
    try {
        const tables = await fetchAvailableTables();
        // Initialize with fetched tables
        tables.forEach(table => {
            tableData.tables[table.table_id] = {
                id: table.table_id,
                status: table.status,
                order: null
            };
        });
        renderTables();
    } catch (error) {
        console.error('Error initializing tables:', error);
    }
})();
*/ 