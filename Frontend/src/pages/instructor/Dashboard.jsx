import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, Mic, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

import { getSessionRequests, updateSessionRequest, deleteSessionRequest } from '../../api/sessionRequests';
import { updateInstructorStatus, getInstructorStats } from '../../api/instructors';
import { useAlert } from '../../context/AlertContext';
import './Dashboard.css';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [status, setStatus] = useState('Online');
    const [acceptedSessionId, setAcceptedSessionId] = useState(null);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalHours: 0,
        avgRating: 0,
        recentFeedback: []
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [requestsData, statsData] = await Promise.all([
                getSessionRequests(),
                getInstructorStats()
            ]);
            const allRequests = Array.isArray(requestsData) ? requestsData : (requestsData.requests || []);
            setRequests(allRequests.filter(r => ['pending', 'accepted'].includes(r.status)));
            setStats(statsData);
            if (statsData.currentStatus) {
                // capitalize for state consistency with 'Online' default
                const backendStatus = statsData.currentStatus;
                setStatus(backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1));
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchDashboardData();

        // Socket connection for real-time updates
        let socket;
        import('socket.io-client').then(({ io }) => {
            socket = io(import.meta.env.VITE_API_BASE_URL);

            socket.on('connect', () => {
                // Join a room specific to this instructor to receive updates
                // Assuming backend emits to user:ID room or similar
                // For now, we can just listen for global events if relevant or room specific
            });

            // Listen for session end to refresh stats
            socket.on('end-session', () => {
                console.log("Session ended event received. Refreshing dashboard...");
                fetchDashboardData();
            });

            // Listen for new requests (if backend emits 'new-request')
            socket.on('new-notification', () => {
                fetchDashboardData();
            });
        });

        // Poll for new requests every 30 seconds as backup
        const interval = setInterval(fetchDashboardData, 30000);

        return () => {
            clearInterval(interval);
            if (socket) socket.disconnect();
        };
    }, []);

    const toggleStatus = async () => {
        const newStatus = status === 'Online' ? 'Offline' : 'Online';
        // Optimistic update
        setStatus(newStatus);
        try {
            await updateInstructorStatus(newStatus.toLowerCase()); // Backend expects lowercase 'online'/'offline'
        } catch (err) {
            console.error("Failed to update status:", err);
            // Revert on failure
            setStatus(status);
            showAlert("Failed to update status.", "error");
        }
    };

    const handleAcceptSession = async (id) => {
        try {
            await updateSessionRequest(id, { status: 'accepted' });
            setAcceptedSessionId(id);
            // Optionally refresh requests
            fetchDashboardData();
        } catch (err) {
            console.error("Failed to accept session:", err);
            showAlert("Failed to accept session. Please try again.", "error");
        }
    };

    const handleDeclineSession = async (id) => {
        showAlert(
            "Are you sure you want to decline this request?",
            "confirm",
            async () => {
                try {
                    await deleteSessionRequest(id);
                    fetchDashboardData(); // Refresh list immediately
                    showAlert("Request declined.", "info");
                } catch (err) {
                    console.error("Failed to decline session:", err);
                    showAlert("Failed to decline session.", "error");
                }
            }
        );
    };

    const handleGoLive = (sessionId) => {
        // Navigate to specific session room
        if (sessionId) {
            navigate(`/instructor/session/${sessionId}`, { state: { autoStart: true } });
        } else {
            navigate('/instructor/sessions', { state: { autoStart: true } });
        }
    };

    // Helper to format time relative to now
    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes < 1) return 'Just now';
        return `${minutes} mins ago`;
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Instructor Dashboard</h1>
                    <p className="page-subtitle">Manage your sessions and track your impact</p>
                </div>
                <div className="header-actions">
                    <div className="status-control">
                        <span className={`status-text ${status.toLowerCase()}`}>{status}</span>
                        <div
                            className={`toggle-switch ${status === 'Online' ? 'active' : ''}`}
                            onClick={toggleStatus}
                        >
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon-wrapper bg-blue-subtle">
                        <Users className="text-cyan" size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Sessions</span>
                        <span className="stat-value">{stats.totalSessions}</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon-wrapper bg-green-subtle">
                        <Star className="text-secondary" style={{ color: 'var(--success-mint)' }} size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Avg Rating</span>
                        <span className="stat-value">{stats.avgRating}</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon-wrapper bg-gold-subtle">
                        <Clock style={{ color: 'var(--warning-gold)' }} size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Hours Taught</span>
                        <span className="stat-value">{stats.totalHours}h</span>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <div className="dashboard-content-grid">
                {/* Pending Requests */}
                <div className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">Pending Session Requests</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/instructor/requests')}>View All</Button>
                    </div>

                    <div className="requests-list">
                        {loading ? (
                            <p className="text-secondary">Loading requests...</p>
                        ) : requests.length > 0 ? (
                            requests.map(req => (
                                <Card key={req._id} className="request-item-card">
                                    <div className="request-header">
                                        <div className="student-profile">
                                            <div className="avatar-small">{req.studentId?.name?.charAt(0) || 'S'}</div>
                                            <div className="student-info-col">
                                                <span className="student-name">{req.studentId?.name || 'Student'}</span>
                                                <span className="request-time">{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'Just now'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="request-domain-badge">
                                        <Badge variant="primary">{req.subject || req.doubtId?.domain || 'General'}</Badge>
                                    </div>
                                    {req.doubtId && (
                                        <div className="linked-context-badge">
                                            <BookOpen size={14} style={{ marginRight: '4px' }} />
                                            <span style={{ fontWeight: 500 }}>Context: {req.doubtId.title}</span>
                                        </div>
                                    )}
                                    <p className="request-msg">"{req.message || 'No message provided'}"</p>
                                    <div className="request-actions">
                                        {acceptedSessionId === req._id || req.status === 'accepted' ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="action-btn-accept"
                                                onClick={() => handleGoLive(req._id)}
                                                style={{ background: 'var(--error-coral)', borderColor: 'var(--error-coral)' }}
                                            >
                                                <Mic size={16} style={{ marginRight: '0.5rem' }} />
                                                Go Live Now
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="action-btn-accept"
                                                    onClick={() => handleAcceptSession(req._id)}
                                                    disabled={acceptedSessionId !== null}
                                                >
                                                    Accept Session
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={acceptedSessionId !== null}
                                                    onClick={() => handleDeclineSession(req._id || req.id)}
                                                >
                                                    Decline
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="empty-state-section">
                                <p className="text-secondary">No pending requests.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Upcoming / Recent */}
                <div className="sidebar-section">
                    <Card className="session-card-highlight">
                        <h3 className="card-heading">Active Session</h3>
                        <div className="empty-session-state">
                            <Mic size={32} className="text-secondary" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No active session right now.</p>
                            <p className="sub-text">Accept a request to start teaching!</p>
                        </div>
                    </Card>

                    <div className="recent-feedback-feed">
                        <h3 className="section-title" style={{ marginTop: '2rem' }}>Recent Feedback</h3>
                        {stats.recentFeedback.length > 0 ? (
                            stats.recentFeedback.map(fb => (
                                <Card key={fb.id || fb._id} className="feedback-mini-card">
                                    <div className="feedback-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < fb.rating ? "currentColor" : "none"}
                                                className={i < fb.rating ? "text-gold" : "text-secondary"}
                                            />
                                        ))}
                                    </div>
                                    <p className="feedback-text">"{fb.comment}"</p>
                                    <span className="feedback-author">- {fb.studentName}</span>
                                </Card>
                            ))
                        ) : (
                            <p className="text-secondary text-sm">No feedback yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
