import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMeetingStore } from '@/store/meetingStore';
import ParticipantsList from '@/components/ParticipantsList';

export default function ParticipantsPage(){
    const { meetingId } = useParams();
    const nav = useNavigate();
    const load = useMeetingStore(s=>s.loadMeeting);
    const meeting = useMeetingStore(s=>s.meeting);
    const organize = useMeetingStore(s=>s.organize);

    useEffect(()=>{ if (meetingId) load(meetingId); }, [meetingId, load]);
    useEffect(()=>{ if (meeting?.status==='organizing') nav(`/m/${meetingId}/map`); },[meeting?.status, meetingId, nav]);

    if (!meetingId || !meeting) return <div className="p-4">Загрузка…</div>;

    async function onOrganize(){
        await organize(meetingId!);
// сразу ведём на карту, чтобы не зависеть от эффекта
        nav(`/m/${meetingId}/map`);
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Лобби участников</h1>
                <Link to={`/m/${meetingId}`}>Редактировать мои данные</Link>
            </div>
            <ParticipantsList items={meeting.participants} />
            <div className="flex gap-2">
                <button className="btn-primary rounded-xl px-4 py-2" onClick={onOrganize} aria-label="Организовать встречу">Организовать встречу</button>
                <Link to={`/m/${meetingId}/map`} className="btn-secondary rounded-xl px-4 py-2">Открыть карту</Link>
            </div>
        </div>
    );
}