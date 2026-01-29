import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Download, User as UserIcon } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getPendingInstructors, verifyInstructor } from '../../api/admin';
import { useAlert } from '../../context/AlertContext';
import './Verification.css';

const Verification = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const data = await getPendingInstructors();
                setApplicants(data);
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicants();
    }, []);

    const handleApprove = async (id) => {
        showAlert(
            'Approve this instructor?',
            'confirm',
            async () => {
                try {
                    await verifyInstructor(id, 'approve');
                    setApplicants(applicants.filter(app => app._id !== id));
                    showAlert("Instructor approved!", "success");
                } catch (err) {
                    console.error("Failed to approve instructor:", err);
                    showAlert("Failed to approve instructor.", "error");
                }
            }
        );
    };

    const handleReject = async (id) => {
        showAlert(
            'Reject this application?',
            'confirm',
            async () => {
                try {
                    await verifyInstructor(id, 'reject');
                    setApplicants(applicants.filter(app => app._id !== id));
                    showAlert("Application rejected.", "info");
                } catch (err) {
                    console.error("Failed to reject instructor:", err);
                    showAlert("Failed to reject instructor.", "error");
                }
            }
        );
    };

    return (
        <div className="verification-container">
            <div className="verification-header">
                <div>
                    <h1 className="page-title">Instructor Verification</h1>
                    <p className="page-subtitle">Review pending applications for instructor roles</p>
                </div>
            </div>

            <div className="applicants-list">
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading applicants...</p>
                ) : applicants.length > 0 ? (
                    applicants.map(app => (
                        <Card key={app._id} className="applicant-card">
                            <div className="app-header">
                                <div className="app-info-wrapper">
                                    <div className="app-avatar">
                                        <UserIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="applicant-name">{app.name}</h3>
                                        <span className="applicant-email">{app.email}</span>
                                        <p className="applicant-date">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="app-actions">
                                    <Button variant="ghost" className="btn-reject" onClick={() => handleReject(app._id)}>
                                        <XCircle size={18} />
                                        Reject
                                    </Button>
                                    <Button variant="primary" className="btn-approve" onClick={() => handleApprove(app._id)}>
                                        <CheckCircle size={18} />
                                        Approve
                                    </Button>
                                </div>
                            </div>

                            {/* 
                                Placeholder for future extended details (Resume, Experience etc.)
                                Currently the backend only stores basic User info for registration.
                            */}
                            {app.experience && (
                                <div className="app-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Experience</span>
                                        <span className="detail-value">{app.experience}</span>
                                    </div>
                                    {/* Add more fields here when backend supports them */}
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <div className="empty-state">
                        <CheckCircle size={48} className="text-secondary" />
                        <p>All clear! No pending verifications.</p>
                    </div>
                )}
            </div>
            <style>{`
                .app-info-wrapper {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .app-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--surface-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                }
                .applicant-date {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }
            `}</style>
        </div>
    );
};

export default Verification;
