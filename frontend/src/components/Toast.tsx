import { useEffect, useState } from 'react';

export function Toast({ message, onClose }:{ message: string; onClose: ()=>void }){
    const [open, setOpen] = useState(true);
    useEffect(()=>{ const t=setTimeout(()=>{ setOpen(false); onClose(); }, 3500); return ()=>clearTimeout(t); },[onClose]);
    if (!open) return null;
    return (
        <div role="status" aria-live="polite" className="fixed bottom-4 right-4 bg-red-600 text-white rounded-xl px-4 py-3 shadow-lg">
            <span className="font-semibold mr-2">Ошибка:</span>{message}
        </div>
    );
}