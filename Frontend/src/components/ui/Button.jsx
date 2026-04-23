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
        transition-all
        focus:outline-none focus:ring-2 focus:ring-blue-500/20
    `;

    const variants = {
        primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
        outline: 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50',
        ghost: 'border-transparent text-gray-600 hover:bg-gray-100',
        danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
        success: 'bg-green-600 text-white border-green-600 hover:bg-green-700',
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