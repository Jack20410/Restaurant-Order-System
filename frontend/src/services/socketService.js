import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
    auth: {
        token: localStorage.getItem('token')
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
});

socket.on('connect', () => {
    console.log('Socket.IO connected successfully');
});

export const socketService = {
    subscribeToOrders: (callback) => {
        socket.on('order_update', callback);
    },
    unsubscribeFromOrders: () => {
        socket.off('order_update');
    },
    subscribeToMenuUpdates: (callback) => {
        socket.on('menu_update', callback);
    },
    emitOrderUpdate: (orderId, status) => {
        socket.emit('update_order', { orderId, status });
    },
    emitMenuUpdate: (menuItem) => {
        socket.emit('update_menu', menuItem);
    }
};

