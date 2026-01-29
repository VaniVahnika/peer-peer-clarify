import clsx from 'clsx';
import './Input.css';

const Input = ({
    label,
    error,
    className,
    id,
    type = 'text',
    icon,
    helperText,
    ...props
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={clsx('input-group', className)}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type={type}
                className={clsx('input-field', error && 'input-error')}
                {...props}
            />
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
};

export default Input;
