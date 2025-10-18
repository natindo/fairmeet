import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Meeting, Participant, PoiCategory, TransportMode } from '@/types';
import * as api from '@/api/apiAdapter';

interface MeetingState {
    meId: string; // client id (persisted)
    meeting?: Meeting;
    transport: TransportMode;
    loading: boolean;
    error?: string;
    setTransport: (m: TransportMode) => void;
    createMeeting: (category: PoiCategory, title?: string) => Promise<string>;
    loadMeeting: (id: string) => Promise<void>;
    upsertParticipant: (mId: string, p: Participant) => Promise<void>;
    organize: (mId: string) => Promise<void>;
    recalc: (mId: string, category: PoiCategory, mode: TransportMode) => Promise<void>;
}

const ME_KEY = 'fairmeet_me_id';
function ensureClientId(): string {
    let id = localStorage.getItem(ME_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(ME_KEY, id); }
    return id;
}

export const useMeetingStore = create<MeetingState>()(devtools((set, get) => ({
    meId: ensureClientId(),
    meeting: undefined,
    transport: 'pedestrian',
    loading: false,
    error: undefined,

    setTransport: (m) => set({ transport: m }),

    createMeeting: async (category, title) => {
        set({ loading: true, error: undefined });
        try {
            const res = await api.createMeeting({ category, title });
            set({ meeting: res, loading: false });
            return res.id;
        } catch (e: any) {
            set({ error: e?.message ?? 'API error', loading: false });
            throw e;
        }
    },

    loadMeeting: async (id) => {
        set({ loading: true, error: undefined });
        try {
            const m = await api.getMeeting(id);
            set({ meeting: m, loading: false });
        } catch (e: any) {
            set({ error: e?.message ?? 'API error', loading: false });
        }
    },

    upsertParticipant: async (mId, p) => {
        set({ loading: true, error: undefined });
        try {
            const m = await api.upsertParticipant(mId, p);
            set({ meeting: m, loading: false });
        } catch (e: any) { set({ error: e?.message ?? 'API error', loading: false }); }
    },

    organize: async (mId) => {
        set({ loading: true, error: undefined });
        try {
            const m = await api.organize(mId);
            set({ meeting: m, loading: false });
        } catch (e: any) { set({ error: e?.message ?? 'API error', loading: false }); }
    },

    recalc: async (mId, category, mode) => {
        set({ loading: true, error: undefined });
        try {
            const m = await api.recalculate(mId, { category, mode });
            set({ meeting: m, loading: false });
        } catch (e: any) { set({ error: e?.message ?? 'API error', loading: false }); }
    },
})));