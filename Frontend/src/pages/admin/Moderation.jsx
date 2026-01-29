import { useState } from 'react';
import { AlertTriangle, Trash2, CheckSquare, Eye } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import './Moderation.css';

const MOCK_FLAGS = [
    {
        id: 1,
        type: 'comment',
        reason: 'Harassment',
        content: 'You are so stupid, why ask this?',
        author: 'User_404',
        reportedBy: 'User_101',
        time: '2 hours ago',
        severity: 'high'
    },
    {
        id: 2,
        type: 'post',
        reason: 'Spam',
        content: 'Cheap assignment help! Click here...',
        author: 'Bot_99',
        reportedBy: 'Alex Johnson',
        time: '5 hours ago',
        severity: 'medium'
    },
    {
        id: 3,
        type: 'post',
        reason: 'Irrelevant',
        content: 'Selling my old bike...',
        author: 'Random_Guy',
        reportedBy: 'Sarah Smith',
        time: '1 day ago',
        severity: 'low'
    }
];

const Moderation = () => {
    const { showAlert } = useAlert();
    const [flags, setFlags] = useState(MOCK_FLAGS);

    const handleDismiss = (id) => {
        setFlags(flags.filter(f => f.id !== id));
    };

    const handleDelete = (id) => {
        showAlert(
            'Delete this content and warn user?',
            'confirm',
            () => {
                setFlags(flags.filter(f => f.id !== id));
                showAlert("Content deleted and user warned.", "info");
            }
        );
    };

    return (
        <div className="moderation-container">
            <div className="moderation-header">
                <h1 className="page-title">Content Moderation</h1>
                <p className="page-subtitle">Manage reported content and enforce guidelines</p>
            </div>

            <div className="flags-list">
                {flags.length > 0 ? (
                    flags.map(flag => (
                        <Card key={flag.id} className={`flag-card severity-${flag.severity}`}>
                            <div className="flag-content-wrapper">
                                <div className="flag-info">
                                    <div className="flag-meta">
                                        <Badge variant={flag.severity === 'high' ? 'error' : 'warning'}>
                                            {flag.reason}
                                        </Badge>
                                        <span className="flag-time">{flag.time}</span>
                                        <span className="flag-type">{flag.type.toUpperCase()}</span>
                                    </div>
                                    <p className="flagged-text">"{flag.content}"</p>
                                    <div className="user-details">
                                        <span>Author: <strong>{flag.author}</strong></span>
                                        <span className="separator">•</span>
                                        <span>Reported by: {flag.reportedBy}</span>
                                    </div>
                                </div>
                                <div className="flag-actions">
                                    <Button variant="outline" size="sm" title="View Context">
                                        <Eye size={18} />
                                    </Button>
                                    <Button variant="ghost" className="btn-dismiss" title="Dismiss" onClick={() => handleDismiss(flag.id)}>
                                        <CheckSquare size={18} />
                                        Dismiss
                                    </Button>
                                    <Button variant="danger" className="btn-delete" title="Delete Content" onClick={() => handleDelete(flag.id)}>
                                        <Trash2 size={18} />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="empty-state">
                        <AlertTriangle size={48} className="text-secondary" />
                        <p>No active flags. Platform is clean!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Moderation;
