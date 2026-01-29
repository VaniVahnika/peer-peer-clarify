import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import { submitFeedback } from '../../api/feedback';
import { useAlert } from '../../context/AlertContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './SessionFeedback.css';

const SessionFeedback = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const location = useLocation();
    const [stateSessionId, setStateSessionId] = useState(location.state?.sessionId);
    const [stateInstructorId, setStateInstructorId] = useState(location.state?.instructorId);

    // Fetch session details if instructorId is missing but we have sessionId
    useEffect(() => {
        const fetchDetails = async () => {
            if (stateSessionId && !stateInstructorId) {
                try {
                    // Import client dynamically or assume it's available. 
                    // Better to import axios or reuse a fetch utility.
                    // We can use the existing client.js
                    const { default: client } = await import('../../api/client');
                    const res = await client.get(`/session-requests/${stateSessionId}`);
                    if (res.data && res.data.instructorId) {
                        setStateInstructorId(res.data.instructorId._id || res.data.instructorId);
                    }
                } catch (err) {
                    console.error("Failed to fetch session details for feedback:", err);
                    showAlert("Could not retrieve session information.", "error");
                }
            }
        };
        fetchDetails();
    }, [stateSessionId, stateInstructorId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stateSessionId || !stateInstructorId) {
            console.error("Missing session info for feedback:", { sessionId: stateSessionId, instructorId: stateInstructorId });
            showAlert("Missing session information. Cannot submit.", "error");
            return;
        }

        try {
            await submitFeedback({
                sessionId: stateSessionId,
                toUserId: stateInstructorId,
                ratings: {
                    clarity: rating,
                    interaction: rating, // Simplify for now, or expand UI
                    satisfaction: rating
                },
                message: feedback
            });
            setSubmitted(true);
            setTimeout(() => {
                navigate('/student');
            }, 2000);
        } catch (err) {
            console.error("Feedback submission failed:", err);
            showAlert("Failed to submit feedback.", "error");
            // setSubmitted(true); // Fallback to success screen or handle error UI
        }
    };

    if (submitted) {
        return (
            <div className="feedback-container">
                <Card className="success-message-card">
                    <CheckCircle size={64} className="success-icon" />
                    <h2>Thank you!</h2>
                    <p>Your feedback helps us improve the learning experience.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <Card className="feedback-card">
                <div className="feedback-header">
                    <h1 className="page-title">Session Feedback</h1>
                    <p className="page-subtitle">How was your session with Sarah?</p>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="rating-section">
                        <label className="section-label">Rate your experience</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star size={32} fill={star <= (hoverRating || rating) ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <span className="rating-text">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent"}
                        </span>
                    </div>

                    <div className="questions-section">
                        <div className="feedback-question">
                            <label>Clarity of explanation</label>
                            {/* Simple radio or another star rating could go here, keeping it simple for now */}
                        </div>
                    </div>

                    <div className="text-feedback-section">
                        <label className="section-label">Additional Feedback (Required)</label>
                        <textarea
                            className="feedback-textarea"
                            placeholder="What went well? What could be improved?"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            required
                            rows={4}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="submit-feedback-btn"
                        disabled={rating === 0 || feedback.trim().length === 0}
                    >
                        Submit Feedback
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default SessionFeedback;
