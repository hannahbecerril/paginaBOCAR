// components/ui/Button.jsx
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    iconOnly = false,
    ...props
}) => {
    const base = `
        inline-flex items-center justify-center gap-2
        border text-sm font-medium
        transition-all duration-fast
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
    `;

    const variants = {
        primary: 'bg-brand-primary text-white border-brand-primary hover:bg-brand-primary-dark',
        outline: 'border-border-default bg-surface text-text-primary hover:bg-surface-hover',
        ghost: 'border-transparent text-text-secondary hover:bg-surface-hover',
        danger: 'bg-brand-danger text-white border-brand-danger hover:bg-brand-danger/90',
        success: 'bg-brand-success text-white border-brand-success hover:bg-brand-success/90',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2',
        lg: 'px-5 py-2.5',
        icon: 'p-2',
    };

    const finalSize = iconOnly ? 'icon' : size;

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[finalSize]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;