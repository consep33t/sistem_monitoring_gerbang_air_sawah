export default function SensorCard({ jarak, kelembapan }) {
	return (
		<div className="bg-white shadow rounded-xl p-4 mb-4">
			<h3 className="font-bold text-lg mb-2">Status Sensor</h3>
			<p>Ketinggian Air: <span className="font-mono">{jarak} cm</span></p>
			<p>Kelembapan Tanah: <span className="font-mono">{kelembapan}</span></p>
		</div>
	);
}
