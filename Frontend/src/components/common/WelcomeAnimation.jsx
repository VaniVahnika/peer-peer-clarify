import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import './WelcomeAnimation.css';

const WelcomeAnimation = ({ onComplete, type }) => {
    const [isVisible, setIsVisible] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        // Animation duration total is ~4.5s
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    const isLogin = type === 'login';

    // Line 1 Text
    const headingText = isLogin ? "Welcome Back" : "Welcome To";

    // Line 2 Text (Brand or User Name)
    // Fallback to "User" if name missing during login, though unlikely if auth succeeded
    const secondLineText = isLogin ? (user?.name || "User") : "Clarify";

    // Helper to determine animation class
    const getAnimationClass = (index, totalLength) => {
        if (!isLogin) return 'brand-letter'; // Default "Rise" animation

        // "Converge" animation logic
        // First half from left, Second half from right
        const middle = totalLength / 2;
        return index < middle ? 'converge-left' : 'converge-right';
    };

    return (
        <div className="welcome-overlay">
            <div className="welcome-text-container">
                <h1 className="welcome-line">{headingText}</h1>
                <h2 className="welcome-line brand-name">
                    {secondLineText.split('').map((char, index) => (
                        <span
                            key={index}
                            style={{ '--i': index }}
                            className={getAnimationClass(index, secondLineText.length)}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </h2>
            </div>
        </div>
    );
};

export default WelcomeAnimation;
