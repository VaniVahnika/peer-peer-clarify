import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, AlertCircle, ChevronDown, Monitor, UploadCloud, FileText, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { registerUser } from '../../api/auth';
import { useAlert } from '../../context/AlertContext';
import './Auth.css';

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

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        domains: '',
        experience: '',
        bio: '',
        github: ''
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleChange = (e) => {
        if (e.target.name === 'resume') {
            setResumeFile(e.target.files[0]);
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const payload = new FormData();

            // Append common fields
            payload.append('name', formData.name);
            payload.append('email', formData.email);
            payload.append('password', formData.password);
            payload.append('role', formData.role);

            // Validate instructor fields
            if (formData.role === 'instructor') {
                if (!formData.domains) {
                    setError('Please select your primary domain/expertise');
                    setIsLoading(false);
                    return;
                }
                if (!formData.github) {
                    setError('Please enter your GitHub Profile URL');
                    setIsLoading(false);
                    return;
                }
                if (!resumeFile) {
                    setError('Please upload your Resume');
                    setIsLoading(false);
                    return;
                }

                // Append instructor fields
                payload.append('domains', Array.isArray(formData.domains) ? formData.domains : [formData.domains]);
                payload.append('experience', Number(formData.experience));
                payload.append('bio', formData.bio);
                payload.append('github', formData.github);
                payload.append('resume', resumeFile);
            }

            // registerUser will handle FormData automatically
            await registerUser(payload);

            sessionStorage.setItem('showWelcome', 'register');
            window.dispatchEvent(new Event('trigger-welcome-animation'));
            onClose(); // Close modal

            // Delay opening login modal to allow animation to play first "Welcome to Clarify"
            setTimeout(() => {
                onSwitchToLogin();
            }, 3500);

        } catch (err) {
            console.error("Registration Error Details:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Account" className="auth-modal">
            <div className="auth-header">
                <p className="auth-subtitle">Join the community of learners</p>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
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
                        <Input
                            label="GitHub Profile URL"
                            name="github"
                            type="url"
                            placeholder="https://github.com/..."
                            value={formData.github || ''}
                            onChange={handleChange}
                            required
                            icon={Monitor} // Reusing Monitor icon or similar
                        />
                        <div className="input-group">
                            <label className="input-label">Resume (PDF/Doc)</label>
                            <div className="file-upload-wrapper">
                                <input
                                    type="file"
                                    name="resume"
                                    id="resume-upload"
                                    onChange={handleChange}
                                    accept=".pdf,.doc,.docx"
                                    className="hidden-file-input"
                                    required={!resumeFile}
                                />
                                <label htmlFor="resume-upload" className={`file-upload-label ${resumeFile ? 'active' : ''}`}>
                                    {resumeFile ? (
                                        <>
                                            <FileText size={20} className="file-icon" />
                                            <span className="file-name">{resumeFile.name}</span>
                                            <div
                                                className="remove-file-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setResumeFile(null);
                                                }}
                                            >
                                                <X size={16} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={20} />
                                            <span>Click to Upload Resume</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-4"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                    <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                </Button>
            </form>

            <div className="auth-footer">
                <p>Already have an account? <span className="link-text" onClick={onSwitchToLogin}>Login</span></p>
            </div>
        </Modal>
    );
};

export default RegisterModal;
