import clsx from 'clsx';
import './Card.css';

const Card = ({ children, className, noPadding = false, ...props }) => {
    return (
        <div className={clsx('card', noPadding && 'card-no-padding', className)} {...props}>
            {children}
        </div>
    );
};

export default Card;
