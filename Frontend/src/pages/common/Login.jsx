import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import './Login.css';

const Login = () => {
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
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <h1 className="logo-text-large">P2P <span className="highlight">Learning</span></h1>
                    <p className="subtitle">Welcome back! Please login to continue.</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
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

                <div className="login-footer">
                    <p>Don't have an account? <Link to="/register" className="link-text">Sign up</Link></p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
