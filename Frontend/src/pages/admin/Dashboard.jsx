import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, AlertTriangle, TrendingUp, Search, User as UserIcon, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getDashboardStats, getPendingInstructors } from '../../api/admin';
import './Dashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalInstructors: 0,
        pendingVerifications: 0
    });
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, pendingData] = await Promise.all([
                    getDashboardStats(),
                    getPendingInstructors()
                ]);
                setStats(statsData);
                // Take only first 3 for the preview list
                setPendingList(pendingData.slice(0, 3));
            } catch (err) {
                console.error("Failed to load admin dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <div>
                    <h1 className="page-title">Admin Console</h1>
                    <p className="page-subtitle">Platform overview and management</p>
                </div>
                <div className="admin-actions">
                    <Button variant="outline" size="sm">Download Report</Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <Card className="metric-card">
                    <div className="metric-icon bg-blue-subtle">
                        <Users className="text-cyan" size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Total Users</span>
                        <span className="metric-value">{loading ? '...' : stats.totalStudents}</span>
                        <span className="metric-trend positive">Active Learners</span>
                    </div>
                </Card>

                <Card className="metric-card" onClick={() => navigate('/admin/instructors')} style={{ cursor: 'pointer' }}>
                    <div className="metric-icon bg-green-subtle">
                        <Shield className="text-secondary" style={{ color: 'var(--success-mint)' }} size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Verified Instructors</span>
                        <span className="metric-value">{loading ? '...' : stats.totalInstructors}</span>
                        <span className="metric-trend positive">Manage &rarr;</span>
                    </div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-icon bg-gold-subtle">
                        <AlertTriangle style={{ color: 'var(--warning-gold)' }} size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Pending Verifications</span>
                        <span className="metric-value">{loading ? '...' : stats.pendingVerifications}</span>
                        <span className="metric-trend negative">Requires Action</span>
                    </div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-icon bg-purple-subtle">
                        <TrendingUp style={{ color: '#A78BFA' }} size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Platform Engagement</span>
                        <span className="metric-value">-</span>
                        <span className="metric-trend neutral">Coming Soon</span>
                    </div>
                </Card>
            </div>

            {/* Main Sections */}
            <div className="admin-content-grid">
                {/* Pending Verifications */}
                <div className="section-col">
                    <div className="section-header-row">
                        <h2 className="section-title">Instructor Verifications</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/verification')}>View All</Button>
                    </div>
                    <div className="list-stack">
                        {loading ? (
                            <p className="text-secondary">Loading...</p>
                        ) : pendingList.length > 0 ? (
                            pendingList.map(user => (
                                <Card key={user._id} className="verification-item">
                                    <div className="user-row">
                                        <div className="avatar-small">
                                            <UserIcon size={16} />
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-role">Exp: {user.experience} years • {user.domains && user.domains[0]}</span>
                                        </div>
                                    </div>
                                    <div className="action-row">
                                        <Button variant="primary" size="sm" onClick={() => navigate('/admin/verification')}>Review</Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="empty-state-small">
                                <CheckCircle size={24} className="text-muted" />
                                <span>All caught up!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Moderation */}
                <div className="section-col">
                    <div className="section-header-row">
                        <h2 className="section-title">Recent Flags</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/moderation')}>View All</Button>
                    </div>
                    <div className="list-stack">
                        <Card className="flag-item">
                            <div className="flag-header">
                                <Badge variant="neutral">System</Badge>
                                <span className="flag-time">Now</span>
                            </div>
                            <p className="flag-desc">Moderation features are currently under development.</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
