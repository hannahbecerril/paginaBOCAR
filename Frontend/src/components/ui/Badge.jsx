// components/ui/Badge.jsx

export default function Badge({ children, variant = "default" }) {

    const variants = {
        default: "bg-gray-100 text-gray-700",
        status: {
            activo: "bg-green-50 text-green-600",
            inactivo: "bg-gray-100 text-gray-500",
        },
        priority: {
            alta: "bg-red-50 text-red-600",
            media: "bg-yellow-50 text-yellow-600",
            baja: "bg-blue-50 text-blue-600",
        }
    };

    let style = variants.default;

    if (variant === "status") {
        style = variants.status[children] || variants.default;
    }

    if (variant === "priority") {
        style = variants.priority[children] || variants.default;
    }

    return (
        <span className={`px-2 py-1 text-xs rounded-md font-medium ${style}`}>
            {children}
        </span>
    );
}