import type { Meeting, Participant, PoiCategory, TransportMode } from '@/types';
import { computeZoneAndCandidates } from '@/services/geoUtils';

const DB_KEY = 'fairmeet_db_v1';
const POLL_KEY = 'fairmeet_last_address';

type DB = { meetings: Record<string, Meeting> };
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function readDB(): DB {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) as DB : { meetings: {} };
}
function writeDB(db: DB) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

export async function createMeeting(input: { category: PoiCategory; title?: string }): Promise<Meeting> {
    await delay(200);
    const id = Math.random().toString(36).slice(2, 8);
    const meeting: Meeting = { id, title: input.title, category: input.category, participants: [], status: 'collecting' };
    const db = readDB();
    db.meetings[id] = meeting;
    writeDB(db);
    return meeting;
}

export async function getMeeting(id: string): Promise<Meeting> {
    await delay(120);
    const db = readDB();
    const m = db.meetings[id];
    if (!m) throw new Error('Meeting not found');
    return m;
}

export async function upsertParticipant(id: string, p: Participant): Promise<Meeting> {
    await delay(120);
    const db = readDB();
    const m = db.meetings[id];
    if (!m) throw new Error('Meeting not found');
    const idx = m.participants.findIndex(x => x.id === p.id);
    if (idx >= 0) m.participants[idx] = p; else m.participants.push(p);
    writeDB(db);
    localStorage.setItem(POLL_KEY, JSON.stringify({ nickname: p.nickname, address: p.origin.address }));
    return m;
}

export async function organize(id: string): Promise<Meeting> {
    await delay(300);
    const db = readDB();
    const m = db.meetings[id];
    if (!m) throw new Error('Meeting not found');
    m.status = 'organizing';
// Обновляем зону/кандидатов синтетически (реальные ETA — через yandexRouting в UI)
    const { zone, candidates } = await computeZoneAndCandidates(m.participants, m.category);
    m.zone = zone; m.candidates = candidates;
    writeDB(db);
    return m;
}

export async function snapshot(id: string): Promise<Meeting> {
// имитация long-poll
    await delay(Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 3000));
    return getMeeting(id);
}

export async function recalculate(id: string, input: { category: PoiCategory; mode: TransportMode }): Promise<Meeting> {
    await delay(250);
    const db = readDB();
    const m = db.meetings[id];
    if (!m) throw new Error('Meeting not found');
    m.category = input.category;
    const { zone, candidates } = await computeZoneAndCandidates(m.participants, m.category);
    m.zone = zone; m.candidates = candidates;
    writeDB(db);
    return m;
}

export function loadLastLocalProfile(): { nickname?: string; address?: string } {
    try { return JSON.parse(localStorage.getItem(POLL_KEY) || '{}'); } catch { return {}; }
}