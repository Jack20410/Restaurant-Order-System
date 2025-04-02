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

        // Update the label text
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

// Function to submit new menu item
async function submitNewItem() {
    const form = document.getElementById('addItemForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/kitchen/menu/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to add menu item');
        }

        // Close modal and reload page
        const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        modal.hide();
        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add menu item. Please try again.');
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

        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete menu item. Please try again.');
    }
}

// Function to edit menu item
function editItem(itemId) {
    // TODO: Implement edit functionality
    alert('Edit functionality will be implemented soon.');
} 