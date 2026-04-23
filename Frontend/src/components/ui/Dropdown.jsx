// components/ui/Dropdown.jsx
import { useState, useRef, useEffect } from 'react';

export default function Dropdown({ trigger, children }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setOpen(!open)} className="cursor-pointer">
                {trigger}
            </div>

            {open && (
                <div className="
                    absolute right-0 mt-2 w-48
                    bg-white border border-gray-200 rounded-lg shadow-sm
                    py-1 z-50
                ">
                    {children}
                </div>
            )}
        </div>
    );
}