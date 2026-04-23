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
        <div className={`bg-white border border-gray-200 ${noPadding ? '' : 'p-6'} ${className}`} {...props}>
            {(title || subtitle) && (
                <div className={`${noPadding ? 'px-6 pt-6 pb-4' : 'mb-4'}`}>
                    {title && (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-600 mt-1">
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