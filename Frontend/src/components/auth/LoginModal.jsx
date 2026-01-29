import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import './Auth.css';

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
    const navigate = useNavigate();
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);

            sessionStorage.setItem('showWelcome', 'login');
            onClose(); // Close modal on success

            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'instructor') {
                navigate('/instructor');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome Back" className="auth-modal">
            <div className="auth-header">
                <h1 className="auth-title"><span className="auth-highlight">Clarify</span></h1>
                <p className="auth-subtitle">Please login to continue.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button
                    variant="primary"
                    type="submit"
                    className="w-full mt-4"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </form>

            <div className="auth-footer">
                <p>Don't have an account? <span className="link-text" onClick={onSwitchToRegister}>Sign up</span></p>
            </div>
        </Modal>
    );
};

export default LoginModal;
