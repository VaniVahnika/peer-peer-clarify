import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getSessionRequests, updateSessionRequest } from '../../api/sessionRequests';
import './SessionRequests.css';

const SessionRequests = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [history, setHistory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await getSessionRequests();
                const allRequests = Array.isArray(data) ? data : (data.requests || []);

                setRequests(allRequests.filter(r => r.status === 'pending'));
                setHistory(allRequests.filter(r => ['completed', 'rejected', 'timeout'].includes(r.status)));
            } catch (err) {
                console.error("Failed to fetch session requests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const handleAccept = async (id) => {
        try {
            await updateSessionRequest(id, { status: 'accepted' });
            setRequests(requests.filter(req => req._id !== id));
            navigate(`/instructor/session/${id}`);
        } catch (err) {
            console.error("Failed to accept request:", err);
        }
    };

    const handleReject = async (id) => {
        try {
            await updateSessionRequest(id, { status: 'rejected' });
            const rejectedReq = requests.find(req => req._id === id);
            setRequests(requests.filter(req => req._id !== id));
            if (rejectedReq) {
                setHistory(prev => [{ ...rejectedReq, status: 'rejected' }, ...prev]);
            }
        } catch (err) {
            console.error("Failed to reject request:", err);
        }
    };

    const displayList = activeTab === 'pending' ? requests : history;

    return (
        <div className="requests-container">
            <div className="requests-header">
                <div>
                    <h1 className="page-title">Session Requests</h1>
                    <p className="page-subtitle">Review and accept student doubt sessions</p>
                </div>
                <div className="req-tabs">
                    <button
                        className={`req-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({requests.length})
                    </button>
                    <button
                        className={`req-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History ({history.length})
                    </button>
                </div>
            </div>

            <div className="requests-grid">
                {loading ? (
                    <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-secondary)' }}>Loading requests...</p>
                ) : displayList.length > 0 ? (
                    displayList.map(req => (
                        <Card key={req._id || req.id} className={`request-card-full ${activeTab === 'history' ? 'history-card' : ''}`}>
                            <div className="req-card-header">
                                <div className="req-student-info">
                                    <div className="avatar-med">{(req.student?.name || 'S')[0]}</div>
                                    <div>
                                        <h3 className="student-name-large">{req.student?.name || 'Student'}</h3>
                                        <span className="req-time-ago">
                                            {activeTab === 'pending'
                                                ? new Date(req.createdAt).toLocaleTimeString()
                                                : `Ended: ${req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : 'N/A'}`
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <Badge variant="active">{req.subject || req.domain || 'General'}</Badge>
                                    {activeTab === 'history' && (
                                        <Badge variant={req.status === 'completed' ? 'success' : 'neutral'}>
                                            {req.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="req-details">
                                <div className="req-topic">
                                    <strong>Topic:</strong>
                                    <span
                                        className="doubt-link"
                                        onClick={() => navigate(`/student/feed?search=${req.doubtId?.title}`)}
                                        style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem' }}
                                    >
                                        {req.doubtId?.title || 'General Doubt'}
                                    </span>
                                </div>
                                <p className="req-message">
                                    <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem', opacity: 0.6 }} />
                                    "{req.message}"
                                </p>
                            </div>

                            {activeTab === 'pending' && (
                                <div className="req-footer">
                                    <div className="compatibility-score">
                                        <span className="com-label">Status</span>
                                        <span className="com-value" style={{ fontSize: '0.9rem' }}>{req.status}</span>
                                    </div>
                                    <div className="req-actions">
                                        <Button variant="ghost" className="action-btn-reject" onClick={() => handleReject(req._id || req.id)}>
                                            <XCircle size={20} />
                                            Reject
                                        </Button>
                                        <Button variant="primary" className="action-btn-accept-full" onClick={() => handleAccept(req._id || req.id)}>
                                            <CheckCircle size={20} />
                                            Accept & Join
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <p>No {activeTab} session requests.</p>
                    </div>
                )}
            </div>

            <style>{`
                .req-tabs {
                    display: flex;
                    gap: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.25rem;
                    border-radius: 0.5rem;
                }
                .req-tab-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .req-tab-btn.active {
                    background: var(--primary);
                    color: white;
                }
                .history-card {
                    opacity: 0.8;
                }
                .history-card:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default SessionRequests;
