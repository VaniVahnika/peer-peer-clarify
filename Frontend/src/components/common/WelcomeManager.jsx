import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import WelcomeAnimation from './WelcomeAnimation';

const WelcomeManager = () => {
    const location = useLocation();
    const [welcomeType, setWelcomeType] = useState(null);

    useEffect(() => {
        const checkWelcome = () => {
            const type = sessionStorage.getItem('showWelcome');
            if (type) {
                setWelcomeType(type);
            }
        };

        // Check on mount and location change
        checkWelcome();

        // Listen for custom event (for same-page updates)
        window.addEventListener('trigger-welcome-animation', checkWelcome);

        return () => {
            window.removeEventListener('trigger-welcome-animation', checkWelcome);
        };
    }, [location]);

    const handleAnimationComplete = () => {
        setWelcomeType(null);
        sessionStorage.removeItem('showWelcome');
    };

    if (!welcomeType) return null;

    return <WelcomeAnimation type={welcomeType} onComplete={handleAnimationComplete} />;
};

export default WelcomeManager;
