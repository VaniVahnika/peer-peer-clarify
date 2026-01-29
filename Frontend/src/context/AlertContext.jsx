import { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '../components/ui/AlertModal';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        message: '',
        type: 'info', // 'info', 'success', 'error'
        onConfirm: null
    });

    const showAlert = useCallback((message, type = 'info', onConfirm = null) => {
        setAlertState({
            isOpen: true,
            message,
            type,
            onConfirm
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (alertState.onConfirm) {
            alertState.onConfirm();
        }
        hideAlert();
    }, [alertState, hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={hideAlert}
                onConfirm={handleConfirm}
                message={alertState.message}
                type={alertState.type}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
