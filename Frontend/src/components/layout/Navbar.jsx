import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, Search, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../ui/Button';
import clsx from 'clsx';
import './Navbar.css';

// import { fetchNotifications, markAllAsRead } from '../../api/notifications'; // Removed as context handles it

const Navbar = ({ role = 'student' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useUser() || {};
    const { theme, toggleTheme } = useTheme();

    // Use Context instead of local state
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    const isActive = (path) => location.pathname === path;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    // const [notifications, setNotifications] = useState([]); // Removed

    const profileMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);

    // Load logic moved to Context

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

    const handleLogout = () => {
        const role = user?.role;
        logout();
        setIsProfileOpen(false);
        if (role === 'admin') navigate('/admin/login');
        else if (role === 'instructor') navigate('/instructor/login'); // Optional if you have dedicated pages
        else navigate('/login');
    };



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const links = {
        student: [
            { label: 'Dashboard', path: '/student' },
            { label: 'Feed', path: '/student/feed' },
            { label: 'Roadmap', path: '/student/roadmap' },
        ],
        instructor: [
            { label: 'Dashboard', path: '/instructor' },
            { label: 'Public Feed', path: '/instructor/feed' },
            { label: 'Requests', path: '/instructor/requests' },
        ],
        admin: [
            { label: 'Dashboard', path: '/admin' },
            { label: 'Instructors', path: '/admin/verification' },
            { label: 'Moderation', path: '/admin/moderation' },
        ]
    };

    const effectiveRole = role && role !== 'student' ? role : (user?.role || 'student');
    const navLinks = links[effectiveRole] || links.student;

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                {/* Logo */}
                <Link to={`/${role}`} className="navbar-logo">
                    <img src="/logo.png" alt="Clarify" className="logo-icon" />
                    <span className="logo-text">Clarify</span>
                </Link>

                {/* Desktop Nav */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx('nav-link', isActive(link.path) && 'active')}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="navbar-actions">


                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search..." className="navbar-search" />
                    </div>

                    <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="notification-menu" ref={notificationMenuRef}>
                        <button
                            className="icon-btn"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            title="Notifications"
                        >
                            <Bell size={20} />
                            {notifications.some(n => !n.isRead) && <span className="notification-dot"></span>}
                        </button>

                        {isNotificationsOpen && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <span className="notif-title">Notifications</span>
                                    <span className="notif-count">{unreadCount} new</span>
                                </div>
                                <div className="notification-list">
                                    {notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <div key={notif._id} className={`notification-item ${!notif.isRead ? 'unread' : ''}`}>
                                                <div className="notif-text">{notif.message}</div>
                                                <div className="notif-time">{new Date(notif.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-notifications">
                                            <div className="no-notif-text">No new notifications</div>
                                        </div>
                                    )}
                                </div>
                                <div className="notification-footer">
                                    <button className="mark-read-btn" onClick={handleMarkAllAsRead}>Mark all as read</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="profile-menu" ref={profileMenuRef}>
                        <button
                            className="icon-btn profile-btn"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            {user && user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="nav-avatar" />
                            ) : (
                                <User size={20} />
                            )}
                        </button>

                        {isProfileOpen && (
                            <div className="profile-dropdown">
                                <Link
                                    to="/settings"
                                    className="dropdown-item"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Link>
                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn icon-btn">
                        <Menu size={24} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
