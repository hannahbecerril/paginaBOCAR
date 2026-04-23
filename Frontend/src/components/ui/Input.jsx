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
    options = [], // for select variant
    className = "",
    rows = 4, // for textarea variant
}) => {
    const baseStyles = `
        w-full border border-gray-200 bg-gray-50
        px-3 py-2 text-sm text-gray-800
        placeholder:text-gray-400
        focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        transition-all outline-none
    `;

    const labelStyles = `
        block text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1.5
    `;

    // SEARCH VARIANT
    if (variant === "search") {
        return (
            <div className={className}>
                {label && <label className={labelStyles}>{label}</label>}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <option value="">Selecciona una opción</option>
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