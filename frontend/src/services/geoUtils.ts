import type { Participant, PoiPlace, Zone } from '@/types';
import { searchPOI } from './yandexSearch';

export function haversineMinutes(a: [number,number], b: [number,number], mode: 'auto'|'pedestrian') {
    const R=6371; const toRad=(d:number)=>d*Math.PI/180;
    const dLat=toRad(b[1]-a[1]); const dLon=toRad(b[0]-a[0]);
    const lat1=toRad(a[1]); const lat2=toRad(b[1]);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const distKm = 2*R*Math.asin(Math.sqrt(h));
    const speedKmh = mode==='auto'? 30 : 5; // грубая оценка
    return Math.round((distKm / speedKmh) * 60);
}

function parseHM(hm: string): number { const [h,m]=hm.split(':').map(Number); return h*60+m; }

export async function evaluateFairness(participants: Participant[], candidates: [number,number][]) {
    const mode: 'auto'|'pedestrian' = 'pedestrian'; // в мок-алгоритме фиксируем
    const arrivals = await Promise.all(candidates.map(async (c) => {
        const times = await Promise.all(participants.map(async (p) => parseHM(p.departAt) + haversineMinutes(p.origin.coords, c, mode)));
        const maxA = Math.max(...times); const waits = times.map(t => maxA - t);
        const maxWait = Math.max(...waits); const sumWait = waits.reduce((a,b)=>a+b,0); const meanETA = times.reduce((a,b)=>a+b,0)/times.length;
        return { c, maxWait, sumWait, meanETA };
    }));
    arrivals.sort((a,b)=> a.maxWait-b.maxWait || a.sumWait-b.sumWait || a.meanETA-b.meanETA);
    return arrivals;
}

export function convexHull(points: [number,number][]): [number,number][] {
// Быстрый монотонный цепной алгоритм (Andrew's)
    const pts = [...points].sort((a,b)=> a[0]-b[0] || a[1]-b[1]);
    if (pts.length<=1) return pts;
    const cross=(o:[number,number], a:[number,number], b:[number,number]) => (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lower:[number,number][]=[]; for (const p of pts){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p)<=0) lower.pop(); lower.push(p); }
    const upper:[number,number][]=[]; for (const p of pts.slice().reverse()){ while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p)<=0) upper.pop(); upper.push(p); }
    upper.pop(); lower.pop(); return lower.concat(upper);
}

export async function computeZoneAndCandidates(participants: Participant[], category: 'coffee'|'pizza'|'restaurant') {
    const center = centroid(participants.map(p=>p.origin.coords));
    const grid = gridAround(center, 2.5, 500);
    const evaluated = await evaluateFairness(participants, grid);
    const top = evaluated.slice(0, 20).map(e=>e.c);
    const hull = convexHull(top);
    const zone: Zone = {
        polygon: hull.length ? hull : grid.slice(0,5),
        center: evaluated[0]?.c ?? center,
        stats: {
            maxWaitMin: evaluated[0]?.maxWait ?? 0,
            meanWaitMin: Math.round(evaluated[0]?.meanETA ?? 0),
            meetingETA: Math.round(evaluated[0]?.meanETA ?? 0),
        }
    };
// Найдём синтетические POI
    const poisRaw = await searchPOI(category, zone.center, 1500);
    const candidates: PoiPlace[] = poisRaw.map(p => ({ id: p.id, name: p.name, coords: p.coords, address: p.address, etaByUser: {}, score: 0 }));
    return { zone, candidates } as { zone: Zone, candidates: PoiPlace[] };
}