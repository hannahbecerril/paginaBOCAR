// components/ui/ChartCard.jsx
import Card from './Card';

export default function ChartCard({ title, children, className = "" }) {
    return (
        <Card className={className}>
            <div className="flex flex-col h-full">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {title}
                </h3>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </Card>
    );
}