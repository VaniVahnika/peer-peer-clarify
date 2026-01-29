import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User, BookOpen } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import { io } from 'socket.io-client';
import './RequestSessionModal.css';

const CS_SUBJECTS = [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Software Engineering',
    'Digital Logic Design',
    'Theory of Computation',
    'Artificial Intelligence',
    'Compiler Design',
    'Full Stack Development'
];

// MOCK_INSTRUCTORS removed. Using API.

import { getInstructors, createSessionRequest } from '../../api/instructors';

const RequestSessionModal = ({ isOpen, onClose, doubt }) => {
    const { showAlert } = useAlert();
    const [selectedInstructorId, setSelectedInstructorId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableInstructors, setAvailableInstructors] = useState([]);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSubject(doubt?.domain || '');
            setSelectedInstructorId('');
            setMessage('');
            setAvailableInstructors([]);
        }
    }, [isOpen, doubt]);



    // ...

    // Socket.io for Real-time Updates
    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });

        socket.on('instructor-status-change', ({ instructorId, status, name, domain }) => {
            // If the modal is open and a subject is selected, re-fetch the list
            // We can optimize this by checking if the instructor's domain matches selectedSubject
            // But strict checking might miss if domains are arrays. Re-fetching is safer.
            if (selectedSubject) {
                // Trigger re-fetch
                // Since fetchInstructors is defined inside another useEffect, we can't call it directly easily
                // unless we move it out or use a trigger state.
                // Alternative: Just duplicate the fetch call or rely on a dependency change?
                // Dependency change: `availableInstructors` is local.

                // Let's copy the fetch logic here for simplicity or define it outside.
                // Better: Define fetchInstructors outside the useEffect or use a callback.

                // Quick fix: Set a timestamp trigger
                setRefreshTrigger(Date.now());
            }
        });

        return () => socket.disconnect();
    }, [selectedSubject]);

    // Add refreshTrigger state
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch instructors when subject changes OR trigger updates
    useEffect(() => {
        const fetchInstructors = async () => {
            if (!selectedSubject) {
                setAvailableInstructors([]);
                return;
            }

            setLoadingInstructors(true);
            try {
                const data = await getInstructors(selectedSubject);
                setAvailableInstructors(Array.isArray(data) ? data : (data.instructors || []));
            } catch (err) {
                console.error("Failed to fetch instructors:", err);
            } finally {
                setLoadingInstructors(false);
            }
        };

        fetchInstructors();
    }, [selectedSubject, refreshTrigger]);

    const handleSubmit = async () => {
        if (!selectedInstructorId) return;

        setIsSubmitting(true);
        try {
            await createSessionRequest({
                instructorId: selectedInstructorId,
                doubtId: doubt?._id || doubt?.id, // Ensure we get the ID
                subject: selectedSubject,
                message
            });
            showAlert("Request sent to instructor!", "success");
            onClose();
        } catch (err) {
            console.error("Failed to requests session:", err);
            showAlert("Failed to send request. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'var(--success-mint)';
            case 'busy': return 'var(--warning-gold)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Live Session"
            className="session-request-modal"
        >
            <div className="modal-content-wrapper">
                {/* Doubt Context */}
                {doubt && (
                    <div className="doubt-context-simple">
                        <span className="context-label">Doubt Context:</span>
                        <span className="context-title-inline">{doubt.title}</span>
                    </div>
                )}

                {/* Subject Selection */}
                <div className="form-section">
                    <label className="section-label">Select Core Subject</label>
                    <div className="domain-select-wrapper">
                        <BookOpen size={18} className="select-icon" />
                        <select
                            className="input-field select-field with-icon"
                            value={selectedSubject}
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setSelectedInstructorId('');
                            }}
                        >
                            <option value="">-- Select CS/Engineering Subject --</option>
                            {CS_SUBJECTS.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Instructor Selection */}
                <div className="form-section">
                    <label className="section-label">
                        Available Instructors
                        {selectedSubject && <span className="label-count">({availableInstructors.length})</span>}
                    </label>

                    {!selectedSubject ? (
                        <div className="empty-state-small">
                            <p>Select a subject to view available instructors.</p>
                        </div>
                    ) : availableInstructors.length > 0 ? (
                        <div className="instructors-list">
                            {availableInstructors.map(inst => (
                                <div
                                    key={inst._id}
                                    className={`instructor-card ${selectedInstructorId === inst._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedInstructorId(inst._id)}
                                >
                                    <div className="inst-avatar">
                                        <User size={18} />
                                        <span className="status-dot-avatar" style={{ backgroundColor: getStatusColor(inst.statusForSession) }}></span>
                                    </div>
                                    <div className="inst-info">
                                        <div className="inst-name">{inst.name}</div>
                                        <div className="inst-meta">
                                            <span className="inst-rating">⭐ {inst.rating}</span>
                                            <span className="separator">•</span>
                                            <span className="inst-status" style={{ color: getStatusColor(inst.statusForSession) }}>
                                                {inst.statusForSession === 'online' ? 'Active Now' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="inst-action">
                                        <div className={`radio-circle ${selectedInstructorId === inst._id ? 'checked' : ''}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-small">
                            <p>No active instructors found for {selectedSubject}.</p>
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className="form-section">
                    <Input
                        label="Message (Optional)"
                        placeholder="Brief description of your query..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!selectedInstructorId || isSubmitting}
                    >
                        {isSubmitting ? 'Requesting...' : 'Request Session'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RequestSessionModal;
