import { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import Card from './Card';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, className }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <Card
                className={clsx('modal-content', className)}
                onClick={(e) => e.stopPropagation()}
                noPadding
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </Card>
        </div>
    );
};

export default Modal;
