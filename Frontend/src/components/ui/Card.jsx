// components/ui/Card.jsx
const Card = ({
    children,
    title,
    subtitle,
    className = "",
    noPadding = false,
    ...props
}) => {
    return (
        <div className={`bg-surface border border-border-default ${noPadding ? '' : 'p-6'} ${className}`} {...props}>
            {(title || subtitle) && (
                <div className={`${noPadding ? 'px-6 pt-6 pb-4' : 'mb-4'}`}>
                    {title && (
                        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;