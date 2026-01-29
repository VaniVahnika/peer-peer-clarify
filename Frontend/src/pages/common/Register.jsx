import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { registerUser } from '../../api/auth'; // Ensure this exists
import './Login.css'; // Reusing Login styles for consistency

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

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        domains: '',
        experience: '',
        bio: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const payload = { ...formData };
            // Validate instructor fields
            if (payload.role === 'instructor') {
                if (!payload.domains) {
                    setError('Please select your primary domain/expertise');
                    setIsLoading(false);
                    return;
                }

                // Format domains as array if instructor
                // Ensure domains is an array (even if single selection from dropdown)
                if (payload.domains && !Array.isArray(payload.domains)) {
                    payload.domains = [payload.domains];
                }
                payload.experience = Number(payload.experience);
            }

            await registerUser(payload);

            // Set flag to show welcome animation on next load
            sessionStorage.setItem('showWelcome', 'register');

            // On success, redirect to login with a success message (or auto-login)
            // For now, redirect to login
            navigate('/login');
        } catch (err) {
            console.error("Registration Error Details:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <h2 className="login-title">Create Account</h2>
                    <p className="login-subtitle">Join the community of learners</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        label="Full Name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        icon={User}
                    />

                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="john@university.edu"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        icon={Mail}
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="********"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        icon={Lock}
                    />

                    <div className="input-group">
                        <label className="input-label">I am a...</label>
                        <div className="role-selector">
                            <label className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={formData.role === 'student'}
                                    onChange={handleChange}
                                />
                                <User size={16} /> Student
                            </label>
                            <label className={`role-option ${formData.role === 'instructor' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="instructor"
                                    checked={formData.role === 'instructor'}
                                    onChange={handleChange}
                                />
                                <Briefcase size={16} /> Instructor
                            </label>
                        </div>
                    </div>

                    {formData.role === 'instructor' && (
                        <>
                            <div className="input-group" style={{ position: 'relative', zIndex: 10 }}>
                                <label className="input-label">Primary Domain / Expertise</label>
                                <div
                                    className={`custom-select-wrapper ${isDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="select-value-container">
                                        <span className={!formData.domains ? 'placeholder-text' : 'selected-text'}>
                                            {formData.domains || "Select your primary domain"}
                                        </span>
                                    </div>
                                    <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} />
                                </div>

                                {isDropdownOpen && (
                                    <div className="custom-dropdown-options">
                                        {CS_SUBJECTS.map(subject => (
                                            <div
                                                key={subject}
                                                className={`custom-option ${formData.domains === subject ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, domains: subject });
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {subject}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Input
                                label="Years of Experience"
                                name="experience"
                                type="number"
                                placeholder="e.g. 5"
                                value={formData.experience || ''}
                                onChange={handleChange}
                                required
                                icon={Briefcase}
                            />
                            <Input
                                label="Bio / Introduction"
                                name="bio"
                                type="text"
                                placeholder="Brief summary of your expertise..."
                                value={formData.bio || ''}
                                onChange={handleChange}
                                required
                                icon={User}
                            />
                        </>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                        <ArrowRight size={18} />
                    </Button>
                </form>

                <div className="login-footer">
                    <p>Already have an account? <Link to="/login" className="link-text">Login</Link></p>
                </div>
            </Card>

            <style>{`
                .role-selector {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }
                .role-option {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border: 1px solid var(--glass-border);
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .role-option.selected {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: var(--primary-violet);
                    color: white;
                }
                .role-option input {
                    display: none;
                }

                /* Custom Dropdown Styles */
                .custom-select-wrapper {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s;
                    user-select: none;
                    gap: 1rem;
                }

                .custom-select-wrapper:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .custom-select-wrapper.active {
                    border-color: var(--primary-violet);
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
                    background: rgba(255, 255, 255, 0.1);
                }

                .select-value-container {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    min-width: 0;
                }

                .placeholder-text {
                    color: var(--text-secondary);
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .selected-text {
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .dropdown-arrow {
                    color: var(--text-secondary);
                    transition: transform 0.2s;
                    flex-shrink: 0;
                }

                .dropdown-arrow.rotated {
                    transform: rotate(180deg);
                }

                .custom-dropdown-options {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    right: 0;
                    background: var(--bg-card); /* Solid background to obscure content behind */
                    border: 1px solid var(--glass-border);
                    border-radius: 0.5rem;
                    max-height: 200px;
                    overflow-y: auto;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                    z-index: 50;
                }

                .custom-option {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
                }

                .custom-option:last-child {
                    border-bottom: none;
                }

                .custom-option:hover {
                    background: rgba(139, 92, 246, 0.1);
                    color: white;
                }

                .custom-option.selected {
                    background: var(--brand-gradient);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Register;
