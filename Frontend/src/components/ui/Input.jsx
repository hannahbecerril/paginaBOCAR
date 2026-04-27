// components/ui/Input.jsx
import { Search, X } from 'lucide-react';

const Input = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    variant = "default", // default | search | textarea | select
    options = [],
    className = "",
    rows = 4,
}) => {
    const baseStyles = `
        w-full border border-border-default bg-surface
        px-3 py-2 text-sm text-text-primary
        placeholder:text-text-tertiary
        focus:border-ring focus:ring-2 focus:ring-ring/20
        transition-all duration-fast outline-none
    `;

    const labelStyles = `
        block text-[11px] font-semibold tracking-wider uppercase mb-1.5
        text-text-tertiary
    `;

    // SEARCH VARIANT
    if (variant === "search") {
        return (
            <div className={className}>
                {label && <label className={labelStyles}>{label}</label>}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`${baseStyles} pl-9 pr-9`}
                    />
                    {value && (
                        <button
                            onClick={() => onChange({ target: { value: "" } })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-fast"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // TEXTAREA VARIANT
    if (variant === "textarea") {
        return (
            <div className={className}>
                {label && <label className={labelStyles}>{label}</label>}
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    rows={rows}
                    className={`${baseStyles} resize-none`}
                />
            </div>
        );
    }

    // SELECT VARIANT
    if (variant === "select") {
        return (
            <div className={className}>
                {label && <label className={labelStyles}>{label}</label>}
                <select
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`${baseStyles} cursor-pointer`}
                >
                    <option value="">Select an option</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    // DEFAULT INPUT
    return (
        <div className={className}>
            {label && <label className={labelStyles}>{label}</label>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={baseStyles}
            />
        </div>
    );
};

export default Input;