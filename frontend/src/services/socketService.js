import io from 'socket.io-client';

// Log socket connection status
let socketConnected = false;

// Get token from session storage
const getToken = () => sessionStorage.getItem('token');

// Create socket connection
const socket = io('http://localhost:8000', {
    auth: {
        token: getToken()
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling']
});

// Connection event handlers
socket.on('connect', () => {
    console.log('Socket.IO connected successfully');
    socketConnected = true;
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
    socketConnected = false;
});

socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    socketConnected = false;
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
    socketConnected = true;
    
    // Update auth token on reconnection
    socket.auth = { token: getToken() };
});

socket.on('reconnect_error', (error) => {
    console.error('Socket.IO reconnection error:', error.message);
});

// Socket service
export const socketService = {
    // Check if socket is connected
    isConnected: () => socketConnected,
    
    // Reconnect socket manually
    reconnect: () => {
        if (!socketConnected) {
            socket.auth = { token: getToken() };
            socket.connect();
        }
    },
    
    // Subscribe to order updates
    subscribeToOrders: (callback) => {
        socket.on('order_update', callback);
    },
    
    // Unsubscribe from order updates
    unsubscribeFromOrders: () => {
        socket.off('order_update');
    },

    // Subscribe to table updates
    subscribeToTableUpdates: (callback) => {
        socket.on('table_update', callback);
    },

    // Unsubscribe from table updates
    unsubscribeFromTableUpdates: () => {
        socket.off('table_update');
    },
    
    // Subscribe to menu updates
    subscribeToMenuUpdates: (callback) => {
        socket.on('menu_update', callback);
    },

    // Unsubscribe from menu updates
    unsubscribeFromMenuUpdates: () => {
        socket.off('menu_update');
    },
    
    // Emit order update
    emitOrderUpdate: (orderData) => {
        if (!socketConnected) {
            console.warn('Socket not connected. Attempting to reconnect...');
            socket.connect();
        }
        
        console.log('Emitting order update via WebSocket:', orderData);
        
        // Support both simple status updates and new order notifications
        if (orderData.type === 'new_order') {
            // This is a new order notification
            socket.emit('order_update', {
                type: 'new_order',
                order_id: orderData.order_id,
                table_id: orderData.table_id,
                status: orderData.status || 'pending',
                items: orderData.items,
                timestamp: new Date().toISOString()
            });
        } else {
            // This is a simple status update
            socket.emit('order_update', { 
                orderId: orderData.orderId || orderData.order_id, 
                status: orderData.status 
            });
        }
    },

    // Emit table update
    emitTableUpdate: (tableData) => {
        if (!socketConnected) {
            console.warn('Socket not connected. Attempting to reconnect...');
            socket.connect();
        }
        
        console.log('Emitting table update via WebSocket:', tableData);
        socket.emit('table_update', {
            table_id: tableData.tableId,
            status: tableData.status,
            timestamp: new Date().toISOString()
        });
    },
    
    // Emit menu update
    emitMenuUpdate: (menuItem) => {
        if (!socketConnected) {
            console.warn('Socket not connected. Attempting to reconnect...');
            socket.connect();
        }
        socket.emit('menu_update', menuItem);
    },
    
    // Send order to kitchen
    sendOrderToKitchen: (orderData) => {
        if (!socketConnected) {
            console.warn('Socket not connected. Attempting to reconnect...');
            socket.connect();
        }
        
        const token = getToken();
        const enrichedData = {
            ...orderData,
            token: token,
            timestamp: new Date().toISOString()
        };
        
        console.log('Sending order data via WebSocket:', enrichedData);
        
        return new Promise((resolve, reject) => {
            // Set a timeout in case the server doesn't respond
            const timeoutId = setTimeout(() => {
                reject({ message: 'Timeout: No response from server after 10 seconds' });
            }, 10000);
            
            socket.emit('new_order', enrichedData, (response) => {
                clearTimeout(timeoutId); // Clear timeout on response
                
                console.log('Socket order response:', response);
                
                if (response && response.status === 'success') {
                    resolve(response);
                } else {
                    const errorMsg = response?.message || 'Failed to send order to kitchen';
                    console.error('Socket order error:', errorMsg);
                    reject({ message: errorMsg });
                }
            });
        });
    },
    
    // Subscribe to notifications
    subscribeToNotifications: (callback) => {
        socket.on('notification', callback);
    },
    
    // Unsubscribe from notifications
    unsubscribeFromNotifications: () => {
        socket.off('notification');
    }
};

