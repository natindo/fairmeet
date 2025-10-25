export default function RecalculateButton({ onClick, disabled }:{ onClick: ()=>void; disabled?: boolean }){
    return (
        <button className="btn-primary rounded-xl px-3 py-2" onClick={onClick} disabled={disabled} aria-label="Пересчитать">Пересчитать</button>
    );
}