export default function GerbangControl({ gerbang1, gerbang2, mode, onToggleGerbang, onToggleMode }) {
	return (
		<div className="bg-white shadow rounded-xl p-4 mb-4">
			<h3 className="font-bold text-lg mb-2">Kontrol Gerbang</h3>
			<p>Mode: <span className="font-mono">{mode ? "MANUAL" : "OTOMATIS"}</span></p>
			<div className="flex gap-2 mt-2">
				<button onClick={() => onToggleGerbang(1)} disabled={!mode} className="px-3 py-1 rounded bg-blue-500 text-white">
					{gerbang1 ? "Tutup Gerbang 1" : "Buka Gerbang 1"}
				</button>
				<button onClick={() => onToggleGerbang(2)} disabled={!mode} className="px-3 py-1 rounded bg-blue-500 text-white">
					{gerbang2 ? "Tutup Gerbang 2" : "Buka Gerbang 2"}
				</button>
				<button onClick={onToggleMode} className="px-3 py-1 rounded bg-orange-500 text-white">
					{mode ? "Ganti ke Otomatis" : "Ganti ke Manual"}
				</button>
			</div>
		</div>
	);
}
