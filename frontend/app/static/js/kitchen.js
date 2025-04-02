// Store menu items
let menuItems = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
    loadOrders();
});

// Function to load menu items
async function loadMenuItems() {
    try {
        const response = await fetch('/kitchen/menu');
        if (!response.ok) {
            throw new Error('Failed to fetch menu items');
        }
        menuItems = await response.json();
        displayMenuItems();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load menu items. Please refresh the page.');
    }
}

// Function to display menu items
function displayMenuItems() {
    const container = document.getElementById('menuItemsContainer');
    container.innerHTML = '';

    menuItems.forEach(item => {
        container.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">${item.description}</p>
                        <p class="card-text">
                            <strong>Price:</strong> $${item.price.toFixed(2)}<br>
                            <strong>Category:</strong> ${item.category}<br>
                            <strong>Prep Time:</strong> ${item.preparation_time} mins
                        </p>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="status-${item.id}"
                                ${item.availability === 'available' ? 'checked' : ''}
                                onchange="updateItemAvailability('${item.id}', this.checked)">
                            <label class="form-check-label" for="status-${item.id}">
                                ${item.availability === 'available' ? 'Available' : 'Unavailable'}
                            </label>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm" onclick="editItem('${item.id}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Function to submit new menu item
async function submitNewItem() {
    const form = document.getElementById('addItemForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/kitchen/menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to add menu item');
        }

        // Close modal and reload menu items
        const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        modal.hide();
        form.reset();
        await loadMenuItems();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add menu item. Please try again.');
    }
}

// Function to edit menu item
function editItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const form = document.getElementById('editItemForm');
    form.id.value = item.id;
    form.name.value = item.name;
    form.description.value = item.description;
    form.price.value = item.price;
    form.category.value = item.category;
    form.preparation_time.value = item.preparation_time;

    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
}

// Function to update menu item
async function updateItem() {
    const form = document.getElementById('editItemForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const itemId = data.id;

    try {
        const response = await fetch(`/kitchen/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update menu item');
        }

        // Close modal and reload menu items
        const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
        modal.hide();
        await loadMenuItems();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update menu item. Please try again.');
    }
}

// Function to delete menu item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`/kitchen/menu/${itemId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete menu item');
        }

        await loadMenuItems();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete menu item. Please try again.');
    }
}

// Function to update item availability
async function updateItemAvailability(itemId, isAvailable) {
    try {
        const response = await fetch(`/kitchen/menu/${itemId}/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                availability: isAvailable ? 'available' : 'unavailable'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update item availability');
        }

        // Update label text
        const label = document.querySelector(`label[for="status-${itemId}"]`);
        label.textContent = isAvailable ? 'Available' : 'Unavailable';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update item availability. Please try again.');
        // Revert the checkbox state
        const checkbox = document.getElementById(`status-${itemId}`);
        checkbox.checked = !checkbox.checked;
    }
}

// Function to load orders
async function loadOrders() {
    try {
        const response = await fetch('/kitchen/orders');
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        const orders = await response.json();
        
        // Group orders by status
        const newOrders = orders.filter(order => order.status === 'pending');
        const inProgressOrders = orders.filter(order => order.status === 'preparing');
        const readyOrders = orders.filter(order => order.status === 'completed');
        
        // Display orders in their respective containers
        displayOrders('newOrdersContainer', newOrders, 'preparing', 'Start Preparing');
        displayOrders('inProgressOrdersContainer', inProgressOrders, 'completed', 'Mark as Ready');
        displayOrders('readyOrdersContainer', readyOrders);
    } catch (error) {
        console.error('Error:', error);
        console.log('Failed to load orders.');
    }
}

// Function to display orders
function displayOrders(containerId, orders, nextStatus, actionButtonText) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    orders.forEach(order => {
        let actionButton = '';
        if (nextStatus) {
            actionButton = `
                <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order.id}', '${nextStatus}')">
                    ${actionButtonText}
                </button>
            `;
        }
        
        container.innerHTML += `
            <div class="card mb-3 order-card" data-order-id="${order.id}">
                <div class="card-body">
                    <h6 class="card-title">Table ${order.table_number}</h6>
                    <p class="card-text">Order #${order.id}</p>
                    <ul class="list-unstyled">
                        ${order.items.map(item => `
                            <li>${item.quantity}x ${item.name}</li>
                        `).join('')}
                    </ul>
                    <small class="text-muted">Ordered at: ${new Date(order.created_at).toLocaleString()}</small>
                    <div class="mt-2">
                        ${actionButton}
                        ${nextStatus === 'preparing' ? `
                            <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

// Function to update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/kitchen/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Failed to update order status');
        }

        // Reload orders
        await loadOrders();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update order status. Please try again.');
    }
}

// Refresh orders periodically
setInterval(loadOrders, 30000); 