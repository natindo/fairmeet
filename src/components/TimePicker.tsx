export default function TimePicker({ value, onChange }:{ value: string; onChange: (v:string)=>void }){
    return (
        <input type="time" className="input" value={value} onChange={e=>onChange(e.target.value)} aria-label="Время выхода" />
    );
}