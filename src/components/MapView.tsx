import React, { useEffect, useState } from 'react';
import { useYMap } from '@/hooks/useYMap';
import type { Meeting, PoiPlace, TransportMode, PoiCategory } from '@/types';
import { etaMinutes } from '@/services/yandexRouting';
import RecalculateButton from './RecalculateButton';
import Legend from './Legend';
import CategoryPicker from './CategoryPicker';

declare global { interface Window { ymaps?: any } }

function initials(name: string) {
    return name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

type Props = {
    meeting: Meeting;
    onRecalc: (cat: PoiCategory, mode: TransportMode) => void;
};

const MapView: React.FC<Props> = ({ meeting, onRecalc }) => {
    const containerId = 'map-root';
    const { ready, mapRef } = useYMap(containerId);
    const [category, setCategory] = useState(meeting.category);
    const [mode, setMode] = useState<TransportMode>('pedestrian');
    const [enriched, setEnriched] = useState<PoiPlace[]>(meeting.candidates ?? []);

    useEffect(() => {
        setCategory(meeting.category);
        setEnriched(meeting.candidates ?? []);
    }, [meeting]);

    // Рисуем через Yandex Maps v2.1 (см. useYMap)
    useEffect(() => {
        if (!ready || !mapRef.current) return;
        const ymaps = window.ymaps;
        const map = mapRef.current;

        map.setCenter(meeting.zone?.center ?? [55.5587, 37.3787]); // [lon,lat]
        map.setZoom(9);

        const objs: any[] = [];

        // Полигон зоны
        if (meeting.zone?.polygon?.length) {
            const poly = new ymaps.Polygon([meeting.zone.polygon], {}, {
                fillColor: 'rgba(16,185,129,0.25)',
                strokeColor: '#10B981',
                strokeWidth: 2,
            });
            map.geoObjects.add(poly);
            objs.push(poly);
        }

        // Участники
        meeting.participants.forEach(p => {
            const pm = new ymaps.Placemark(p.origin.coords, {
                hintContent: `${p.nickname}: ${p.origin.address}`,
                iconCaption: initials(p.nickname),
            }, { preset: 'islands#blueCircleIcon' });
            map.geoObjects.add(pm);
            objs.push(pm);
        });

        // POI
        enriched.forEach(po => {
            const pm = new ymaps.Placemark(po.coords, { hintContent: po.name }, { preset: 'islands#pinkDotIcon' });
            map.geoObjects.add(pm);
            objs.push(pm);
        });

        return () => { objs.forEach(o => map.geoObjects.remove(o)); };
    }, [ready, mapRef, meeting, enriched]);

    async function computeETAForCandidates() {
        const res: PoiPlace[] = [];
        for (const c of meeting.candidates ?? []) {
            const etaByUser: Record<string, number> = {};
            for (const p of meeting.participants) {
                etaByUser[p.id] = await etaMinutes(p.origin.coords, c.coords, mode);
            }
            const maxArrival = Math.max(...Object.values(etaByUser));
            const waits = meeting.participants.map(p => maxArrival - etaByUser[p.id]);
            const maxWait = Math.max(...waits);
            const sumWait = waits.reduce((a, b) => a + b, 0);
            const meanETA = Object.values(etaByUser).reduce((a, b) => a + b, 0) / (Object.values(etaByUser).length || 1);
            const score = -maxWait * 0.6 - sumWait * 0.3 - meanETA * 0.1;
            res.push({ ...c, etaByUser, score });
        }
        res.sort((a, b) => b.score - a.score);
        setEnriched(res);
    }

    useEffect(() => { computeETAForCandidates(); /* при загрузке */ }, [meeting.id]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-0 overflow-hidden" aria-label="Карта">
                <div id={containerId} className="w-full h-[420px] lg:h-[70vh]" />
            </div>
            <div className="space-y-4">
                <div className="card space-y-3" aria-label="Фильтры">
                    <div>
                        <span className="label m-0">Категория</span>
                        <CategoryPicker value={category} onChange={setCategory} />
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="label m-0">Транспорт</span>
                        <select
                            className="input w-full"
                            value={mode}
                            onChange={e => setMode(e.target.value as TransportMode)}
                            aria-label="Режим передвижения"
                        >
                            <option value="pedestrian">Пешком</option>
                            <option value="auto">Авто</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <RecalculateButton onClick={() => onRecalc(category, mode)} />
                        <button className="btn-secondary rounded-xl px-3" onClick={computeETAForCandidates}>Пересчитать ETA</button>
                    </div>
                </div>
                <Legend />
                <div className="card" aria-label="Список POI">
                    <h3 className="font-semibold mb-2">Места ({enriched.length})</h3>
                    <ul className="space-y-2 max-h-[40vh] overflow-auto">
                        {enriched.map(p => (
                            <li key={p.id} className="border border-slate-600 rounded-xl p-3">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-slate-300">{p.address ?? '—'}</div>
                                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                    {Object.entries(p.etaByUser).map(([uid, m]) => (
                                        <div key={uid}>👤 {uid.slice(0, 4)} → {m} мин</div>
                                    ))}
                                </div>
                                <button className="mt-2 btn-primary rounded-xl px-3 py-1" aria-label={`Выбрать ${p.name}`}>Выбрать</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MapView;
