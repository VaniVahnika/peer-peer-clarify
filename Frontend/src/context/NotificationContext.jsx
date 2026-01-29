import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useUser } from './UserContext';
import { fetchNotifications, markAllAsRead as apiMarkAllAsRead, markAsRead as apiMarkAsRead } from '../api/notifications';

const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    markAsRead: () => { },
    markAllAsRead: () => { },
    loading: true
});

export const useNotifications = () => useContext(NotificationContext);

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL;

export const NotificationProvider = ({ children }) => {
    const { user } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Initial Fetch
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        const loadNotifications = async () => {
            try {
                const data = await fetchNotifications();
                if (Array.isArray(data)) {
                    setNotifications(data);
                } else {
                    console.error("Notifications data is not an array:", data);
                    setNotifications([]);
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [user]);

    // Socket Connection
    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_SERVER_URL, { withCredentials: true });

        newSocket.on('connect', () => {
            console.log("Connected to notification socket");
            newSocket.emit('join-user-room', user._id);
        });

        newSocket.on('new-notification', (notification) => {
            console.log("New notification received:", notification);
            // Add to top of list
            setNotifications(prev => Array.isArray(prev) ? [notification, ...prev] : [notification]);

            // Optional: Play sound or show toast
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };

    }, [user]);

    const markAsRead = async (id) => {
        try {
            await apiMarkAsRead(id);
            setNotifications(prev => Array.isArray(prev) ? prev.map(n => n._id === id ? { ...n, isRead: true } : n) : []);
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
            setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, isRead: true })) : []);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};
