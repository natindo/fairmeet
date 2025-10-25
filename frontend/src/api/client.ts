const API = '/api/v1';

function headers() {
    const cid = localStorage.getItem('fairmeet_me_id') || crypto.randomUUID();
    localStorage.setItem('fairmeet_me_id', cid);
    return { 'Content-Type':'application/json', 'X-Client-ID': cid };
}

export async function createMeeting(input:{title?:string; category:string}) {
    const r = await fetch(`${API}/meetings`, { method:'POST', headers: headers(), body: JSON.stringify(input) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function getMeeting(id:string) {
    const r = await fetch(`${API}/meetings/${id}`, { headers: headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function upsertParticipant(id:string, p:{
    nickname:string; origin:{address:string; coords:[number,number]}; departAt:string
}) {
    const r = await fetch(`${API}/meetings/${id}/participants`, { method:'POST', headers: headers(), body: JSON.stringify(p) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function organize(id:string) {
    const r = await fetch(`${API}/meetings/${id}/organize`, { method:'POST', headers: headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function recalc(id:string, input:{category:string; mode:'auto'|'pedestrian'}) {
    const r = await fetch(`${API}/meetings/${id}/recalculate`, { method:'POST', headers: headers(), body: JSON.stringify(input) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

// SSE:
export function subscribeMeeting(id:string, onData:(meeting:any)=>void) {
    const es = new EventSource(`${API}/meetings/${id}/stream`);
    es.onmessage = (e) => { try { onData(JSON.parse(e.data)); } catch {} };
    es.onerror = () => { /* можно авто-реконнектить */ };
    return () => es.close();
}

// Geocoder proxy:
export async function geocode(q:string) {
    const r = await fetch(`${API}/geo?query=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<Array<{address:string; coords:[number,number] }>>;
}
