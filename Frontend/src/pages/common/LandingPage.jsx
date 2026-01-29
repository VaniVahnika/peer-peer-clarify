import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, MessageSquare, Award, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import LoginModal from '../../components/auth/LoginModal';
import RegisterModal from '../../components/auth/RegisterModal';
import './LandingPage.css';

const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    const openLogin = () => {
        setIsRegisterOpen(false);
        setIsLoginOpen(true);
    };

    const openRegister = () => {
        setIsLoginOpen(false);
        setIsRegisterOpen(true);
    };

    return (
        <div className="landing-container">
            {/* Background Effects */}
            <div className="floating-blob blob-1"></div>
            <div className="floating-blob blob-2"></div>

            {/* Navbar */}
            <nav className="landing-nav">
                <Link to="/" className="landing-logo">
                    <img src="/logo.png" alt="Clarify Logo" className="logo-icon" />
                    <span>Clarify</span>
                </Link>
                <div className="nav-links">
                    <button className="icon-btn" onClick={toggleTheme} style={{ marginRight: '1rem', color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="nav-link-btn" onClick={openLogin}>Sign In</button>
                    <button className="btn-glass" onClick={openRegister} style={{ padding: '0.5rem 1.5rem', borderRadius: '2rem' }}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">
                    🚀 The Future of Collaborative Learning
                </div>
                <h1 className="hero-title">
                    Master Concepts with <br />
                    <span className="gradient-text">Clarify</span>
                </h1>
                <p className="hero-description">
                    Connect with peers, ask doubts in real-time, and host live sessions.
                    Earn reputation by helping others and level up your skills together.
                </p>
                <div className="hero-actions">
                    <button className="btn-large btn-primary-glow" onClick={openRegister}>
                        Join Platform <ArrowRight size={20} style={{ display: 'inline', marginLeft: '0.5rem' }} />
                    </button>
                    <Link to="/explore" className="btn-large btn-glass">
                        Explore Feeds
                    </Link>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="feature-title">Real-time Doubts</h3>
                        <p className="feature-desc">
                            Post specific coding queries and get instant help from peers and instructors in your domain.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Users size={32} />
                        </div>
                        <h3 className="feature-title">Live 1:1 Sessions</h3>
                        <p className="feature-desc">
                            Connect via video for deep-dive explanations. Teach others and solidify your own understanding.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Award size={32} />
                        </div>
                        <h3 className="feature-title">Reputation System</h3>
                        <p className="feature-desc">
                            Earn badges and points for every contribution. Build a profile that showcases your expertise.
                        </p>
                    </div>
                </div>
            </section>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToRegister={openRegister}
            />

            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToLogin={openLogin}
            />
        </div>
    );
};

export default LandingPage;
