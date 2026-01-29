import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const AlertModal = ({ isOpen, onClose, onConfirm, message, type = 'info' }) => {

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-500" size={32} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={32} />;
            case 'confirm':
                return <Info className="text-blue-500" size={32} />;
            default:
                return <Info className="text-blue-500" size={32} />;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'confirm': return 'Confirm';
            default: return 'Notice';
        }
    };

    const isConfirm = type === 'confirm';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            className="max-w-sm"
        >
            <div className="flex flex-col items-center text-center p-4">
                <div className="mb-4">
                    {getIcon()}
                </div>
                <p className="text-gray-700 mb-6 text-lg">
                    {message}
                </p>
                <div className="flex gap-3 w-full">
                    {isConfirm && (
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        variant={type === 'error' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        className="flex-1"
                    >
                        {isConfirm ? 'Confirm' : 'OK'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertModal;
