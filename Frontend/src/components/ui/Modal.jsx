import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'lg' }) {
    if (!open) return null;
    const maxW = size === 'xl' ? '60rem' : size === 'lg' ? '44rem' : '32rem';
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-14">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            <div className="relative z-10 w-full flex flex-col shadow-2xl"
                style={{ maxWidth: maxW, backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)' }}>
                <div
                    className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
                    style={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border-default)' }}
                >
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose}
                        className="p-1.5 transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                        <X size={16} />
                    </button>
                </div>
                <div className="overflow-y-auto p-5 flex-1" style={{ maxHeight: 'calc(90vh - 8rem)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
