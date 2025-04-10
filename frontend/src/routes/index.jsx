import { Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth';
import { UserList } from '../features/manager';
import { WaiterDashboard, MenuPage } from '../features/waiter';
import { KitchenDashboard } from '../features/kitchen';

export const routes = [
    {
        path: '/',
        element: <LoginPage />,
        public: true
    },
    {
        path: '/dashboard',
        element: <UserList />,
        roles: ['manager']
    },
    {
        path: '/waiter',
        element: <WaiterDashboard />,
        roles: ['waiter']
    },
    {
        path: '/waiter/menu/:tableId',
        element: <MenuPage />,
        roles: ['waiter']
    },
    {
        path: '/kitchen',
        element: <KitchenDashboard />,
        roles: ['kitchen']
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]; 