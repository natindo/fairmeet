import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/meetingStore';
import type { PoiCategory } from '@/types';
import { t } from '@/i18n';

export default function CreateMeetingForm(){
    const nav = useNavigate();
    const create = useMeetingStore(s=>s.createMeeting);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<PoiCategory>('coffee');
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        try {
            setBusy(true);
            const id = await create(category, title || undefined);
            nav(`/m/${id}`);
        } finally { setBusy(false); }
    }

    return (
        <form onSubmit={onSubmit} className="card space-y-4" aria-label="{t.createMeeting}">
            <div>
                <label className="label" htmlFor="title">{t.meetingTitle}</label>
                <input id="title" className="input w-full" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div>
                <label className="label" htmlFor="cat">{t.category}</label>
                <select id="cat" className="input w-full" value={category} onChange={e=>setCategory(e.target.value as PoiCategory)}>
                    <option value="coffee">Кофейни</option>
                    <option value="pizza">Пицца</option>
                    <option value="restaurant">Рестораны</option>
                </select>
            </div>
            <button className="btn-primary px-4 py-2 rounded-xl" disabled={busy} aria-label="{t.createMeeting}">{busy? '...' : t.createMeeting}</button>
        </form>
    );
}