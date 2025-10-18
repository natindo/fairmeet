import type { PoiCategory } from '@/types';

export default function CategoryPicker({ value, onChange }:{ value: PoiCategory; onChange:(c:PoiCategory)=>void }) {
    return (
        <select
            className="input w-full"
            value={value}
            onChange={e=>onChange(e.target.value as PoiCategory)}
            aria-label="Категория мест"
        >
            <option value="coffee">Кофейни</option>
            <option value="pizza">Пицца</option>
            <option value="restaurant">Рестораны</option>
        </select>
    );
}
