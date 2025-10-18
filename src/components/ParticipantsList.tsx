import type { Participant } from '@/types';

export default function ParticipantsList({ items }:{ items: Participant[] }){
    return (
        <div className="card overflow-auto" aria-label="Список участников">
            <table className="w-full text-sm">
                <thead className="text-left">
                <tr className="text-slate-600">
                    <th className="py-2 pr-2">Ник</th>
                    <th className="py-2 pr-2">Адрес</th>
                    <th className="py-2 pr-2">Время выхода</th>
                </tr>
                </thead>
                <tbody>
                {items.map(p=> (
                    <tr key={p.id} className="border-t border-slate-200">
                        <td className="py-2 pr-2">{p.nickname}</td>
                        <td className="py-2 pr-2">{p.origin.address}</td>
                        <td className="py-2 pr-2">{p.departAt}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}