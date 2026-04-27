// components/ui/Badge.jsx
export default function Badge({ children, variant = "default" }) {
    const variants = {
        default: "bg-surface-hover text-text-secondary",
        status: {
            active: "bg-status-active/10 text-status-active",
            inactive: "bg-surface-disabled text-text-tertiary",
            pending: "bg-status-pending/10 text-status-pending",
            completed: "bg-status-completed/10 text-status-completed",
            cancelled: "bg-status-cancelled/10 text-status-cancelled",
        },
        priority: {
            high: "bg-priority-high/10 text-priority-high",
            medium: "bg-priority-medium/10 text-priority-medium",
            low: "bg-priority-low/10 text-priority-low",
        }
    };

    let style = variants.default;
    const lowerChildren = String(children).toLowerCase();

    if (variant === "status") {
        style = variants.status[lowerChildren] || variants.default;
    }

    if (variant === "priority") {
        style = variants.priority[lowerChildren] || variants.default;
    }

    return (
        <span className={`px-2 py-1 text-xs font-medium ${style}`}>
            {children}
        </span>
    );
}