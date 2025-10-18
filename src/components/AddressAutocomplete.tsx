import { useEffect, useRef, useState } from 'react';
// import * as search from '@/services/yandexSearch';
import { geocode } from '@/api/client';

export default function AddressAutocomplete({ value, onSelect }:{
    value: string; onSelect: (v: { address: string; coords: [number,number] })=>void
}) {
    const [q, setQ] = useState(value);
    const [items, setItems] = useState<{ address: string; coords:[number,number] }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(()=>{
        let alive=true;
        (async()=>{
            if (!q) { setItems([]); return; }
            const r = await geocode(q);
            if (alive) setItems(r);
        })();
        return ()=>{alive=false};
    },[q]);

    function applyChoice(it:{address:string; coords:[number,number]}){
        setQ(it.address);
        setItems([]);           // скрыть подсказки
        onSelect(it);           // поднять наверх выбранные coords+address
        inputRef.current?.blur();
    }

    return (
        <div className="relative">
            <input
                ref={inputRef}
                className="input w-full"
                aria-autocomplete="list"
                role="combobox"
                aria-expanded={items.length>0}
                value={q}
                onChange={e=>setQ(e.target.value)}
                placeholder="Укажите адрес"
            />
            {items.length>0 && (
                <ul role="listbox"
                    className="absolute z-10 bg-slate-800 border border-slate-600 rounded-xl mt-1 w-full max-h-56 overflow-auto">
                    {items.map((it,i)=> (
                        <li key={i}
                            role="option"
                            tabIndex={0}
                            className="px-3 py-2 hover:bg-slate-700 cursor-pointer"
                            onClick={()=>applyChoice(it)}
                            onKeyDown={(e)=>{ if(e.key==='Enter'){ applyChoice(it); } }}>
                            {it.address}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
