import { useState } from 'react';

export default function ShareLinkCard({ meetingId }:{ meetingId: string }){
    const url = `${location.origin}/m/${meetingId}`;
    const [sent, setSent] = useState(false);
    const [copied, setCopied] = useState(false);

    async function copy(){
        await navigator.clipboard.writeText(url);
        setCopied(true); setTimeout(()=>setCopied(false),1000);
    }

    return (
        <div className="card space-y-2" aria-label="Share link">
            <p className="text-sm text-slate-600">Ссылка на встречу:</p>
            <div className="flex gap-2 items-center">
                <input className="input flex-1" value={url} readOnly aria-readonly />
                <button onClick={copy} className="btn-secondary px-3 py-2 rounded-xl" aria-label="Скопировать ссылку">Копировать</button>
                <button onClick={()=>setSent(true)} className="btn-primary px-3 py-2 rounded-xl" aria-label="Отправил">Отправил</button>
            </div>
            {copied && <div className="text-green-700 text-sm">Скопировано!</div>}
            {sent && <div className="text-slate-700 text-sm">Ок, считаем, что отправили 🙂</div>}
        </div>
    );
}