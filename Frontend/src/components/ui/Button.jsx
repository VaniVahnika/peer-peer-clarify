import clsx from 'clsx';
import './Button.css'; // We will define specific styles here to keep it modular or use utility classes if preferred, but for now let's use a mix or just inline basics with strict classes.

// Actually, let's use the global CSS variables and some inline styles or a module. 
// Given the requirement for "Vanilla CSS", I will creaate a companion CSS file or just use the global classes I might define.
// To keep it clean, I will use a simple BEM-like approach or utility classes defined in index.css? 
// No, component-specific CSS is better for maintainability.

const Button = ({
    children,
    variant = 'primary', // primary, share, outline, ghost, danger
    size = 'md', // sm, md, lg
    className,
    ...props
}) => {
    return (
        <button
            className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
