import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import JoinForm from '@/components/JoinForm';
import ShareLinkCard from '@/components/ShareLinkCard';
import { useMeetingStore } from '@/store/meetingStore';

export default function JoinPage(){
    const { meetingId } = useParams();
    const nav = useNavigate();
    const load = useMeetingStore(s=>s.loadMeeting);
    const meeting = useMeetingStore(s=>s.meeting);

    useEffect(()=>{ if (meetingId) load(meetingId); }, [meetingId, load]);
    useEffect(()=>{ if (meeting?.status==='organizing') nav(`/m/${meetingId}/map`); },[meeting?.status, meetingId, nav]);

    if (!meetingId || !meeting) return <div className="p-4">Загрузка…</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Присоединиться к «{meeting.title ?? 'FairMeet'}»</h1>
                <Link to={`/m/${meetingId}/participants`} className="underline">Лобби</Link>
            </div>
            <ShareLinkCard meetingId={meetingId} />
            <JoinForm meetingId={meetingId} />
        </div>
    );
}