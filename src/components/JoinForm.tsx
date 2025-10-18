import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from './AddressAutocomplete';
import TimePicker from './TimePicker';
import { useMeetingStore } from '@/store/meetingStore';
import type { Participant } from '@/types';
import { loadLastLocalProfile } from '@/api/apiAdapter';

export default function JoinForm({ meetingId }:{ meetingId: string }){
    const meId = useMeetingStore(s=>s.meId);
    const upsert = useMeetingStore(s=>s.upsertParticipant);
    const meeting = useMeetingStore(s=>s.meeting);
    const nav = useNavigate();
    const [nickname, setNickname] = useState('');
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<[number,number] | null>(null);
    const [departAt, setDepartAt] = useState('18:00');

    useEffect(()=>{
        const last = loadLastLocalProfile();
        if (last.nickname) setNickname(last.nickname);
        if (last.address) setAddress(last.address);
    },[]);
    function onSelect(addr: { address: string; coords:[number,number] }){ setAddress(addr.address); setCoords(addr.coords); }

    async function submit(e: React.FormEvent){
        e.preventDefault();
        if (!coords) return;
        const p: Participant = { id: meId, nickname, origin: { address, coords }, departAt };
        await upsert(meetingId, p);
// после успешного апдейта переходим в лобби
        nav(`/m/${meetingId}/participants`);
    }
    const canEdit = meeting?.status !== 'organizing';
    return (
        <form onSubmit={submit} className="card space-y-4" aria-label="Join form">
            <div>
                <label className="label" htmlFor="n">Ник</label>
                <input id="n" className="input w-full" value={nickname} onChange={e=>setNickname(e.target.value)} disabled={!canEdit} required />
            </div>
            <div>
                <label className="label">Адрес</label>
                <AddressAutocomplete value={address} onSelect={onSelect} />
            </div>
            <div>
                <label className="label">Время выхода</label>
                <TimePicker value={departAt} onChange={setDepartAt} />
            </div>
            <button className="btn-primary rounded-xl px-4 py-2" disabled={!coords || !canEdit} aria-label="Принять встречу">Принять встречу</button>
        </form>
    );
}