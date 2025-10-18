// src/store/meetingStore.ts
import { create } from 'zustand';
import type { Meeting, Participant, PoiCategory, TransportMode } from '@/types';
import * as api from '@/api/client';

// Храним clientId в localStorage (один раз на устройство/браузер)
const ME_ID_KEY = 'fairmeet_me_id';
function ensureMeId(): string {
    let id = localStorage.getItem(ME_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ME_ID_KEY, id);
    }
    return id;
}

type State = {
    meId: string;
    meeting?: Meeting;
    loading: boolean;
    error?: string;

    // житейские флаги, если понадобятся в UI
    isOrganizing: boolean;

    // actions
    reset: () => void;
    setError: (msg?: string) => void;

    createMeeting: (input: { title?: string; category: PoiCategory }) => Promise<Meeting>;
    loadMeeting: (id: string) => Promise<void>;
    upsertParticipant: (meetingId: string, p: Participant) => Promise<void>;
    organize: (meetingId: string) => Promise<void>;
    recalc: (meetingId: string, category: PoiCategory, mode: TransportMode) => Promise<void>;

    // внутреннее — управление SSE
    _subscribe: (id: string) => void;
    _unsubscribe: () => void;
};

let sseUnsub: (() => void) | null = null;

export const useMeetingStore = create<State>((set, get) => ({
    meId: ensureMeId(),
    meeting: undefined,
    loading: false,
    error: undefined,
    isOrganizing: false,

    reset: () => {
        // очищаем только состояние в памяти; meId сохраняем
        set({ meeting: undefined, loading: false, error: undefined, isOrganizing: false });
        get()._unsubscribe();
    },

    setError: (msg) => set({ error: msg }),

    async createMeeting(input) {
        set({ loading: true, error: undefined });
        try {
            const m = await api.createMeeting(input);
            // после создания просто кладём сущность; подписка появится при loadMeeting
            set({ meeting: m, loading: false });
            return m;
        } catch (e: any) {
            const msg = e?.message || 'Ошибка создания встречи';
            set({ loading: false, error: msg });
            throw e;
        }
    },

    async loadMeeting(id: string) {
        set({ loading: true, error: undefined });
        try {
            // 1) разовый снэпшот
            const m = await api.getMeeting(id);
            set({ meeting: m, loading: false });

            // 2) подписка на обновления
            get()._unsubscribe();
            get()._subscribe(id);
        } catch (e: any) {
            const msg = e?.message || 'Встреча не найдена';
            set({ loading: false, error: msg });
            // при ошибке подписку не ставим
        }
    },

    async upsertParticipant(meetingId: string, p: Participant) {
        set({ loading: true, error: undefined });
        try {
            // ВАЖНО: координаты в формате [lon, lat]
            // Убедимся, что приходят в правильном порядке
            const fixed: Participant = {
                ...p,
                origin: {
                    ...p.origin,
                    coords: [p.origin.coords[0], p.origin.coords[1]], // без свопа, лишь явное копирование
                },
            };

            const m = await api.upsertParticipant(meetingId, {
                nickname: fixed.nickname,
                origin: { address: fixed.origin.address, coords: fixed.origin.coords },
                departAt: fixed.departAt,
            });

            set({ meeting: m, loading: false, error: undefined });
            // если подписка по каким-то причинам отсутствует — поставим
            if (!sseUnsub) get()._subscribe(meetingId);
        } catch (e: any) {
            const msg = e?.message || 'Не удалось сохранить участника';
            set({ loading: false, error: msg });
            throw e;
        }
    },

    async organize(meetingId: string) {
        set({ isOrganizing: true, error: undefined });
        try {
            await api.organize(meetingId);
            // ответ 202 — расчёт идёт в фоне; ждём SSE
            set({ isOrganizing: false });
        } catch (e: any) {
            const msg = e?.message || 'Не удалось запустить организацию';
            set({ isOrganizing: false, error: msg });
            throw e;
        }
    },

    async recalc(meetingId: string, category: PoiCategory, mode: TransportMode) {
        set({ isOrganizing: true, error: undefined });
        try {
            await api.recalc(meetingId, { category, mode });
            // дальше ждём SSE со свежим Meeting
            set({ isOrganizing: false });
        } catch (e: any) {
            const msg = e?.message || 'Не удалось пересчитать встречу';
            set({ isOrganizing: false, error: msg });
            throw e;
        }
    },

    _subscribe(id: string) {
        sseUnsub = api.subscribeMeeting(id, (incoming: Meeting) => {
            // Везде ожидаем формат координат [lon, lat]; сервер уже присылает корректно
            set({ meeting: incoming });
        });
    },

    _unsubscribe() {
        if (sseUnsub) {
            try { sseUnsub(); } catch {}
            sseUnsub = null;
        }
    },
}));

// На всякий случай корректно закрываем SSE при уходе со страницы
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        try { sseUnsub?.(); } catch {}
    });
}
