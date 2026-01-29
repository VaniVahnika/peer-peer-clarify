import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, User, Mail, Briefcase, AlertTriangle, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getAllInstructors, deleteInstructor } from '../../api/admin';
import { useAlert } from '../../context/AlertContext';

const ManageInstructors = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            const data = await getAllInstructors();
            setInstructors(data);
        } catch (err) {
            console.error("Failed to fetch instructors:", err);
            showAlert("Failed to load instructors.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id, name) => {
        showAlert(
            `Are you sure you want to remove ${name}? This action cannot be undone.`,
            'confirm',
            async () => {
                try {
                    await deleteInstructor(id);
                    setInstructors(instructors.filter(inst => inst._id !== id));
                    showAlert("Instructor removed successfully.", "success");
                } catch (err) {
                    console.error("Failed to remove instructor:", err);
                    showAlert("Failed to remove instructor.", "error");
                }
            }
        );
    };

    return (
        <div className="manage-instructors-container">
            <div className="header-row">
                <Button variant="ghost" onClick={() => navigate('/admin')}>
                    <ArrowLeft size={20} /> Back
                </Button>
                <div>
                    <h1 className="page-title">Manage Instructors</h1>
                    <p className="page-subtitle">View and manage verified instructors</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading instructors...</div>
            ) : instructors.length > 0 ? (
                <div className="instructors-grid">
                    {instructors.map(inst => (
                        <Card key={inst._id} className="instructor-card">
                            <div className="card-header">
                                <div className="avatar">
                                    <User size={24} />
                                </div>
                                <div className="inst-info">
                                    <h3>{inst.name}</h3>
                                    <span className="email"><Mail size={12} /> {inst.email}</span>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <Briefcase size={16} />
                                    <span>{inst.domains?.join(', ') || 'No Domain'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Exp: {inst.experience || 0} Years</span>
                                </div>
                                <div className="rating-badge">
                                    Creating Impact: {inst.totalRatings || 0} Ratings
                                </div>
                            </div>

                            <div className="card-actions">
                                <Button
                                    variant="danger"
                                    className="delete-btn"
                                    onClick={() => handleDelete(inst._id, inst.name)}
                                >
                                    <Trash2 size={16} /> Remove User
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <User size={48} />
                    <p>No verified instructors found.</p>
                </div>
            )}

            <style>{`
                .manage-instructors-container {
                    padding: 1rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .header-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .instructors-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .instructor-card {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid var(--border-subtle);
                    padding-bottom: 1rem;
                }
                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--bg-surface-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                }
                .inst-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: var(--text-primary);
                }
                .email {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    flex: 1;
                }
                .detail-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                .delete-btn {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    color: var(--text-muted);
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
};

export default ManageInstructors;
