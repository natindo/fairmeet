export type PoiCategory = 'coffee' | 'pizza' | 'restaurant';

export type Participant = {
    id: string;
    nickname: string;
    origin: { address: string; coords: [number, number] };
    departAt: string; // HH:mm
};

export type Zone = {
    polygon: [number, number][];
    center: [number, number];
    stats: { maxWaitMin: number; meanWaitMin: number; meetingETA: number };
};

export type PoiPlace = {
    id: string;
    name: string;
    coords: [number, number];
    address?: string;
    etaByUser: Record<string, number>; // minutes
    score: number;
};

export type MeetingStatus = 'collecting' | 'organizing' | 'finalized';

export type Meeting = {
    id: string;
    title?: string;
    category: PoiCategory;
    participants: Participant[];
    status: MeetingStatus;
    zone?: Zone;
    candidates?: PoiPlace[];
};

export type TransportMode = 'auto' | 'pedestrian';