export default function Legend(){
    return (
        <div className="card text-sm space-y-1" aria-label="Легенда">
            <div><span className="inline-block w-3 h-3 rounded-full bg-blue-600 mr-2"></span> Участники</div>
            <div><span className="inline-block w-3 h-3 rounded bg-emerald-500 mr-2 opacity-40"></span> Зона встречи</div>
            <div><span className="inline-block w-3 h-3 rounded-full bg-pink-600 mr-2"></span> Кандидаты POI</div>
        </div>
    );
}