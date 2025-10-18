import * as api from './apiAdapter';
import type { Meeting } from '@/types';

export function startMeetingPolling(meetingId: string, onTick: (m: Meeting) => void) {
    let stopped = false;
    async function loop() {
        while (!stopped) {
            try { const m = await api.snapshot(meetingId); onTick(m); }
            catch { /* swallow, UI покажет через store.error */ }
        }
    }
    loop();
    return () => { stopped = true; };
}