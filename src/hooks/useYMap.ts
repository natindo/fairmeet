import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window { ymaps?: any }
}

export function useYMap(containerId: string) {
    const mapRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const apiKey = import.meta.env.VITE_YMAPS_API_KEY as string;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!window.ymaps) {
                const s = document.createElement('script');
                s.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
                s.async = true;
                document.head.appendChild(s);
                await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
            }
            await window.ymaps.ready();
            if (cancelled) return;

            const cont = document.getElementById(containerId);
            if (!cont) return;
            mapRef.current = new window.ymaps.Map(cont, {
                center: [37.6176, 55.7558], // lon, lat
                zoom: 12,
                controls: ['zoomControl']
            }, { suppressMapOpenBlock: true });

            setReady(true);
        }

        load().catch(() => setReady(false));
        return () => { cancelled = true; try { mapRef.current?.destroy?.(); } catch {} };
    }, [containerId, apiKey]);

    return { ready, mapRef } as const;
}
