import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMeetingStore } from '@/store/meetingStore';
import MapView from '@/components/MapView';

export default function MapPage() {
    const { meetingId } = useParams();
    const load = useMeetingStore(s => s.loadMeeting);
    const meeting = useMeetingStore(s => s.meeting);
    const recalc = useMeetingStore(s => s.recalc);

    useEffect(() => { if (meetingId) load(meetingId); }, [meetingId, load]);

    if (!meetingId || !meeting) return <div className="p-4">Загрузка…</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            <h1 className="text-xl font-bold">Карта встречи</h1>
            <MapView
                meeting={meeting}
                onRecalc={(cat, mode) => recalc(meetingId!, cat, mode)}
            />
        </div>
    );
}
