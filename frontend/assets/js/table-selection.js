// Add at the top after DOMContentLoaded
let currentAction = '';
let currentTableId = '';

// Remove the event listeners from DOMContentLoaded and modify showTableConfirmation
document.addEventListener('DOMContentLoaded', function() {
    loadTables();
    document.getElementById('refreshButton').addEventListener('click', loadTables);
});

function showTableConfirmation(tableId, action) {
    const modal = new bootstrap.Modal(document.getElementById('tableModal'));
    document.getElementById('selectedTableNumber').textContent = tableId;
    const confirmBtn = document.getElementById('confirmTableButton');
    const cancelBtn = document.getElementById('cancelTableButton');
    const modalMessage = document.getElementById('modalMessage');

    // Clear any existing event listeners
    const modalElement = document.getElementById('tableModal');
    const newModalElement = modalElement.cloneNode(true);
    modalElement.parentNode.replaceChild(newModalElement, modalElement);

    // Get fresh references
    const newConfirmBtn = newModalElement.querySelector('#confirmTableButton');
    const newCancelBtn = newModalElement.querySelector('#cancelTableButton');
    
    if (action === 'occupy') {
        modalMessage.textContent = `Are you sure you want to select Table ${tableId}?`;
        newConfirmBtn.style.display = 'block';
        newCancelBtn.style.display = 'none';
        
        newConfirmBtn.onclick = function() {
            assignTable(tableId);
            bootstrap.Modal.getInstance(newModalElement).hide();
            loadTables();
        };
    } else if (action === 'cancel') {
        modalMessage.textContent = `Do you want to cancel Table ${tableId}?`;
        newConfirmBtn.style.display = 'none';
        newCancelBtn.style.display = 'block';
        
        newCancelBtn.onclick = function() {
            cancelTable(tableId);
            bootstrap.Modal.getInstance(newModalElement).hide();
            loadTables();
        };
    }

    // Add modal hidden event
    newModalElement.addEventListener('hidden.bs.modal', function () {
        loadTables();
    });

    const newModal = new bootstrap.Modal(newModalElement);
    newModal.show();
}

// Modify assignTable and cancelTable to remove loadTables() call
function assignTable(tableId) {
    const requestBody = {
        table_status: 'occupied'
    };

    fetch(`http://localhost:8002/orders/tables/${tableId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to assign table');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        showMessage('Table assigned successfully!', 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage(`Failed to assign table: ${error.message}`, 'error');
    });
}

// Similar modification for cancelTable
function cancelTable(tableId) {
    const requestBody = {
        table_status: 'available'
    };

    fetch(`http://localhost:8002/orders/tables/${tableId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to cancel table');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        showMessage('Table cancelled successfully!', 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage(`Failed to cancel table: ${error.message}`, 'error');
    });
}

function loadTables() {
    showMessage('Attempting to fetch tables...', 'info');
    
    fetch('http://localhost:8002/orders/tables', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(async response => {
            if (!response.ok) {
                // Get the error details from response
                const errorData = await response.json();
                throw new Error(`Server returned error: ${response.status} - ${response.statusText}\nDetails: ${JSON.stringify(errorData)}`);
            }
            showMessage('Successfully connected to server', 'success');
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            const tableGrid = document.getElementById('tableGrid');
            
            if (!tableGrid) {
                throw new Error('Table grid element not found in the document');
            }
            
            tableGrid.innerHTML = '';
            
            if (!data) {
                throw new Error('No data received from server');
            }
            
            if (!data.tables) {
                throw new Error('Response missing tables property');
            }
            
            if (!Array.isArray(data.tables)) {
                throw new Error('Tables data is not an array');
            }
            
            if (data.tables.length === 0) {
                showMessage('No tables found in the database', 'warning');
                return;
            }
            
            showMessage(`Loading ${data.tables.length} tables...`, 'info');
            
            data.tables.forEach(table => {
                const tableElement = createTableElement(table);
                tableGrid.appendChild(tableElement);
            });
            
            showMessage('Tables loaded successfully', 'success');
        })
        .catch(error => {
            console.error('Error loading tables:', error);
            showMessage(`Error: ${error.message}`, 'error');
        });
}

function createTableElement(table) {
    const div = document.createElement('div');
    div.className = `table-item ${getTableStatusClass(table.table_status)}`;
    
    const tableContent = `
        <div class="table-header">
            <span class="table-name">Table ${table.table_id}</span>
        </div>
        <div class="table-info">
            <span class="status-badge">${(table.table_status || 'available').toUpperCase()}</span>
        </div>
    `;
    
    div.innerHTML = tableContent;
    
    div.addEventListener('click', () => {
        if (table.table_status === 'available') {
            showTableConfirmation(table.table_id, 'occupy');
        } else if (table.table_status === 'occupied') {
            showTableConfirmation(table.table_id, 'cancel');
        } else {
            showMessage(`Table ${table.table_id} is ${table.table_status}`, 'warning');
        }
    });
    
    return div;
}

function getTableStatusClass(status) {
    switch(status) {
        case 'available':
            return 'table-available';
        case 'occupied':
            return 'table-occupied';
        case 'reserved':
            return 'table-reserved';
        default:
            return 'table-available';
    }
}

function showMessage(message, type = 'info') {
    const alertClass = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass[type]} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}