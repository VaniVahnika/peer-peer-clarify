import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import '../student/SessionFeedback.css';

const InstructorFeedback = () => {
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            navigate('/instructor');
        }, 2000);
    };

    if (submitted) {
        return (
            <div className="feedback-container">
                <Card className="success-message-card">
                    <CheckCircle size={64} className="success-icon" />
                    <h2>Feedback Submitted</h2>
                    <p>Thanks for contributing to the community!</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <Card className="feedback-card">
                <div className="feedback-header">
                    <h1 className="page-title">Session Summary</h1>
                    <p className="page-subtitle">Rate the session with Alex Johnson</p>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="rating-section">
                        <label className="section-label">Student Engagement</label>
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
                    </div>

                    <div className="text-feedback-section">
                        <label className="section-label">Private Notes (Optional)</label>
                        <textarea
                            className="feedback-textarea"
                            placeholder="Any notes about the student's progress..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="submit-feedback-btn"
                        disabled={rating === 0}
                    >
                        Submit Summary
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default InstructorFeedback;
