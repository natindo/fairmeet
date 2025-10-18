const API_KEY = import.meta.env.VITE_YMAPS_API_KEY as string;

export async function geocode(query: string): Promise<{ coords: [number, number]; address: string }[]> {
    if (!query) return [];
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${API_KEY}&format=json&lang=ru_RU&results=7&geocode=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Yandex Geocoder error');
    const data = await res.json();
    const members = data?.response?.GeoObjectCollection?.featureMember ?? [];
    return members.map((m: any) => {
        const obj = m.GeoObject;
        const text = obj?.metaDataProperty?.GeocoderMetaData?.text as string;
        const pos = (obj?.Point?.pos as string) || '';
        const [lonStr, latStr] = pos.split(' ');
        const coords: [number, number] = [Number(lonStr), Number(latStr)];
        return { address: text, coords };
    });
}

export type Poi = { id: string; name: string; coords: [number, number]; address?: string };
export async function searchPOI(category: 'coffee'|'pizza'|'restaurant', center: [number, number], radiusMeters = 1500): Promise<Poi[]> {
// На этом шаге оставим синтетический список; реальный Search API можно добавить позже
    const gen = (i: number) => ({
        id: `${category}-${i}`,
        name: `${category} #${i}`,
        coords: [center[0] + (Math.random()-0.5)*0.02, center[1] + (Math.random()-0.5)*0.02] as [number,number],
        address: '—',
    });
    return Array.from({ length: 15 }, (_, i) => gen(i+1));
}