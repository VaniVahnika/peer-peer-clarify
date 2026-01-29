import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Video, BookOpen, Star, MessageSquare, Clock, Award, TrendingUp, HelpCircle, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import CreateDoubtModal from '../../components/features/CreateDoubtModal';
import { useUser } from '../../context/UserContext';
import { getDoubts } from '../../api/doubts';
import { getSessionRequests } from '../../api/sessionRequests';
import './Dashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [recentDoubts, setRecentDoubts] = useState([]);
    const [totalDoubts, setTotalDoubts] = useState(0); // Add state for total count
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWaitModalOpen, setIsWaitModalOpen] = useState(false);
    const [upcomingSession, setUpcomingSession] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [doubtsData, requestsData] = await Promise.all([
                    getDoubts(),
                    getSessionRequests()
                ]);

                // Process Doubts
                const doubtsList = Array.isArray(doubtsData) ? doubtsData : (doubtsData.doubts || []);

                const myDoubts = doubtsList.filter(d => {
                    const doubtOwnerId = d.studentId?._id || d.studentId;
                    const currentUserId = user?.id || user?._id;
                    return doubtOwnerId === currentUserId;
                });

                setTotalDoubts(myDoubts.length); // Set total before slicing
                setRecentDoubts(myDoubts.slice(0, 3));

                // Process Sessions
                const requestsList = Array.isArray(requestsData) ? requestsData : (requestsData.requests || []);

                // Prioritize finding an accepted session, otherwise look for a pending one
                const acceptedSession = requestsList.find(r => r.status === 'accepted');
                const pendingSession = requestsList.find(r => r.status === 'pending');

                const nextSession = acceptedSession || pendingSession;
                setUpcomingSession(nextSession);

            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
            // Poll every 30 seconds
            const interval = setInterval(fetchDashboardData, 30000);
            return () => clearInterval(interval);
        }
    }, [user, refreshTrigger]);

    // Derive stats from user and recentDoubts to ensure reactivity
    const stats = [
        { label: 'Doubts Asked', value: totalDoubts, icon: HelpCircle, color: '#8b5cf6' }, // Use totalDoubts
        { label: 'Sessions Attended', value: user?.sessionsAttended || 0, icon: Video, color: '#a855f7' },
        { label: 'Roadmap Progress', value: '45%', icon: BookOpen, color: '#eab308' },

    ];

    // ...

    // Socket Notification Listener
    useEffect(() => {
        let socket;
        import('socket.io-client').then(({ io }) => {
            socket = io(import.meta.env.VITE_API_BASE_URL);

            socket.on('connect', () => {
                if (upcomingSession && upcomingSession._id) {
                    console.log(`Joining notification room: ${upcomingSession._id}`);
                    socket.emit('join-room', upcomingSession._id, 'observer-student');
                }
            });

            socket.on('instructor-started-stream', (data) => {
                console.log("Instructor started stream!", data);
                setUpcomingSession(prev => {
                    if (prev && prev._id === data.roomId) {
                        return { ...prev, isLive: true };
                    }
                    return prev;
                });
            });

            socket.on('end-session', (data) => {
                console.log("Session ended:", data);
                // Optimistically remove session
                setUpcomingSession(prev => {
                    if (prev && prev._id === data.roomId) {
                        return null;
                    }
                    return prev;
                });
                // Trigger immediate data refresh
                setRefreshTrigger(prev => prev + 1);
            });
        });

        // ... (socket listener code)

        return () => {
            if (socket) socket.disconnect();
        };
    }, [upcomingSession]);

    const handleJoinSession = (sessionId) => {
        // If it's live or accepted, we can try to join.
        // The LiveSession component will handle the "Waiting for instructor" state if not actually live yet.
        if (upcomingSession?.isLive || upcomingSession?.status === 'accepted') {
            navigate(`/student/session/${sessionId}`);
        } else {
            // Should technically be covered by disabled button, but good fallback
            setIsWaitModalOpen(true);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Welcome back, <span className="highlight-text">{user?.name || 'Student'}</span>! 👋</h1>
                    <p className="page-subtitle">Track your learning progress and sessions</p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    Post a Doubt
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <Card key={index} className="stat-card glass-panel" style={{ '--delay': `${index * 0.1}s` }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}20` }}>
                            <stat.icon size={24} style={{ color: stat.color }} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">{stat.value}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Recent Activity */}
                <div className="content-section">
                    <div className="section-header-row">
                        <h2 className="section-title"><Clock size={20} style={{ marginRight: '0.5rem' }} /> Recent Doubts</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/student/feed')}>View All</Button>
                    </div>

                    <div className="doubts-list">
                        {loading ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</p>
                        ) : recentDoubts.length > 0 ? (
                            recentDoubts.map(doubt => (
                                <Card key={doubt._id || doubt.id} className="doubt-item-card">
                                    <div className="doubt-header">
                                        <div className="badge-group">
                                            <span className="domain-badge">{doubt.domain}</span>
                                            <span className={`status-badge ${doubt.isResolved ? 'resolved' : 'pending'}`}>
                                                {doubt.isResolved ? 'Resolved' : 'Pending'}
                                            </span>
                                        </div>
                                        <span className="doubt-time">
                                            {new Date(doubt.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="doubt-title">{doubt.title}</h3>
                                    <p className="doubt-preview">{doubt.description?.substring(0, 100)}...</p>
                                    <div className="doubt-footer">
                                        <span className="comment-count">
                                            <MessageSquare size={14} style={{ marginRight: '4px' }} />
                                            {doubt.comments?.length || 0} Comments
                                        </span>
                                        <Button variant="ghost" size="sm">View Details</Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No doubts asked yet.</p>
                                <Link to="/student/create-doubt" onClick={(e) => { e.preventDefault(); setIsCreateModalOpen(true); }} className="link-text">Ask your first doubt</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="sidebar-section">
                    {upcomingSession ? (
                        <Card className="session-card-highlight">
                            <h3 className="card-heading">Next Live Session</h3>
                            <div className="session-details">
                                <div className="session-time">
                                    {new Date(upcomingSession.respondedAt || upcomingSession.createdAt || upcomingSession.updatedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                </div>
                                <div className="session-topic">{upcomingSession.subject || upcomingSession.doubtId?.title || 'General Session'}</div>
                                <div className="instructor-info">with {upcomingSession.instructorId?.name || 'Instructor'}</div>
                            </div>

                            {upcomingSession.isLive && (
                                <div className="live-badge-notification" style={{
                                    color: 'var(--error-coral)',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '1rem',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: 'currentColor'
                                    }}></span>
                                    Instructor is Live!
                                </div>
                            )}

                            <Button
                                variant={upcomingSession.isLive ? 'primary' : (upcomingSession.status === 'pending' ? 'outline' : 'primary')}
                                className="full-width-btn"
                                disabled={upcomingSession.status === 'pending' && !upcomingSession.isLive}
                                onClick={() => handleJoinSession(upcomingSession._id)}
                                style={upcomingSession.isLive ? { backgroundColor: 'var(--error-coral)', borderColor: 'var(--error-coral)' } : {}}
                            >
                                {upcomingSession.isLive ? 'JOIN LIVE NOW' : (upcomingSession.status === 'pending' ? 'Waiting for confirmation...' : 'Join Session')}
                            </Button>
                        </Card>
                    ) : (
                        <Card className="session-card-highlight empty-session">
                            <h3 className="card-heading">Next Live Session</h3>
                            <p className="empty-session-text">No upcoming sessions. Request one now!</p>
                            <Button variant="outline" className="full-width-btn" onClick={() => setIsCreateModalOpen(true)}>Request Session</Button>
                        </Card>
                    )}

                    <div className="roadmap-mini-view">
                        <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Full Stack Roadmap</h3>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: '45%' }}></div>
                        </div>
                        <p className="progress-text">Module 4 of 10 completed</p>
                    </div>
                </div>
            </div>

            <CreateDoubtModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <Modal
                isOpen={isWaitModalOpen}
                onClose={() => setIsWaitModalOpen(false)}
                title="Session Not Started"
            >
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        The instructor has not started the live session yet. <br />
                        Please check back in a few moments or wait for the notification.
                    </p>
                    <Button variant="primary" onClick={() => setIsWaitModalOpen(false)}>
                        Okay, I'll Wait
                    </Button>
                </div>
            </Modal>

            <style>{`
                .badge-group {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                .domain-badge {
                    background: rgba(139, 92, 246, 0.1);
                    color: #a78bfa;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                }
                .status-badge.pending {
                    background: rgba(234, 179, 8, 0.1);
                    color: #facc15;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                }
                .status-badge.resolved {
                    background: rgba(34, 197, 94, 0.1);
                    color: #4ade80;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                }
            `}</style>
        </div>
    );
};

export default StudentDashboard;
