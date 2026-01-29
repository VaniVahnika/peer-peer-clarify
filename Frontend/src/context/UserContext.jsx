import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getCurrentUser } from '../api/auth';

const UserContext = createContext({
    user: null,
    updateProfile: () => { },
    login: () => { },
    logout: () => { },
    loading: true
});

export const useUser = () => useContext(UserContext);

import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL;

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loginStatus, setLoginStatus] = useState(false);

    // Check auth status on mount (similar to checkAuthStatus in reference)
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // api instance already has withCredentials: true
                const user = await getCurrentUser(); // Hits /auth/me
                if (user) {
                    setUser(user);
                    setLoginStatus(true);
                } else {
                    setUser(null);
                    setLoginStatus(false);
                }
            } catch (err) {
                console.log("Session check failed:", err);
                setUser(null);
                setLoginStatus(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        setError('');
        try {
            const data = await loginUser(email, password);
            // data.user contains the payload
            setUser(data.user);
            setLoginStatus(true);
            return data.user;
        } catch (err) {
            console.error("Login failed:", err);
            const msg = err.response?.data?.msg || err.message || 'Login failed';
            setError(msg);
            setLoginStatus(false);
            throw err; // Re-throw so Login component can handle UI feedack if needed
        }
    };

    const logout = async () => {
        try {
            if (user && user.role === 'instructor') {
                // Best effort to mark offline
                import('../api/instructors').then(module =>
                    module.updateInstructorStatus('offline').catch(() => { })
                );
            }
            await logoutUser(); // Calls /api/auth/logout
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            setLoginStatus(false);
            setError('');
            // Optional: Force reload to clear any memory states
            window.location.href = '/';
        }
    };

    const updateProfile = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    return (
        <UserContext.Provider value={{ user, loginStatus, error, login, logout, updateProfile, loading }}>
            {children}
        </UserContext.Provider>
    );
};
