"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io();

export default function Home() {
  const [data, setData] = useState({
    jarak: 0,
    kelembapan: 0,
    gerbang1: false,
    gerbang2: false,
    mode: false, // Tambahkan status mode
  });
  const [kontrol, setKontrol] = useState({
    gerbang1: false,
    gerbang2: false,
    mode: false, // Tambahkan status mode kontrol
  });
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data kontrol awal dari API
  const fetchControlStatus = async () => {
    try {
      const res = await fetch("/api/control_status");
      const result = await res.json();
      if (result.success) {
        setKontrol(result.control);
      }
    } catch (error) {
      console.error("Gagal mengambil status kontrol:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlStatus();

    socket.on("sensor_update", (latestData) => {
      setData(latestData);
      // Sinkronkan status gerbang dari sensor ke status kontrol lokal
      setKontrol((prev) => ({
        ...prev,
        gerbang1: latestData.gerbang1,
        gerbang2: latestData.gerbang2,
      }));
    });

    socket.on("control_update", (latestControl) => {
      setKontrol(latestControl);
    });

    return () => {
      socket.off("sensor_update");
      socket.off("control_update");
    };
  }, []);

  const toggleGerbang = async (gerbangId) => {
    // Ambil status gerbang saat ini dari state 'kontrol'
    const currentStatus = kontrol[`gerbang${gerbangId}`];
    const newStatus = !currentStatus;

    try {
      // Kirim permintaan PATCH ke API dengan nama kolom yang benar
      await fetch("/api/control_status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [`gerbang${gerbangId}`]: newStatus }),
      });
    } catch (error) {
      console.error(`Gagal mengontrol gerbang ${gerbangId}:`, error);
    }
  };

  const toggleMode = async () => {
    const newMode = !kontrol.mode;
    try {
      // Kirim permintaan PATCH untuk mengubah mode
      await fetch("/api/control_status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Gagal mengganti mode:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-700">Memuat...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl text-center font-bold text-blue-700 mb-1">
        📡 Monitoring Gerbang Air
      </h1>
      <p className="text-xl text-center capitalize text-slate-500 mb-4">
        pantau status & kendalikan gerbang air -- kontrol lebih aman dan efesien
      </p>

      {/* Tampilan Status Mode */}
      <div className="w-full max-w-lg mb-4 text-center">
        <p className="text-2xl font-bold text-gray-800">
          Mode:{" "}
          <span
            className={`font-extrabold ${
              kontrol.mode ? "text-orange-500" : "text-blue-500"
            }`}
          >
            {kontrol.mode ? "MANUAL" : "OTOMATIS"}
          </span>
        </p>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Status Sensor
      </h2>
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg mb-8">
        <Image
          className="w-auto h-48 mx-auto mb-2"
          src="/sea-level.png"
          height={200}
          width={200}
          alt="Level Air"
        />
        <div className="text-black">
          <h2 className="font-bold">Ketinggian Air</h2>
          <p>
            <span className="font-medium text-gray-800">Ketinggian Air:</span>{" "}
            {data.jarak} cm
          </p>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg mb-8">
        <Image
          className="w-auto h-48 mx-auto mb-2"
          src="/humidity.png"
          height={200}
          width={200}
          alt="Kelembapan Tanah"
        />
        <div className="text-black">
          <h2 className="font-bold">Kelembapan Tanah</h2>
          <p>
            <span className="font-medium text-gray-800">Kelembapan:</span>{" "}
            {data.kelembapan}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg mb-8">
        <div className="space-y-2 text-black">
          <h2 className="font-bold">Status Gerbang</h2>
          <p>
            <span className="font-medium text-gray-800">Gerbang 1:</span>{" "}
            <span
              className={`font-bold ${
                data.gerbang1 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.gerbang1 ? "Terbuka" : "Tertutup"}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-800">Gerbang 2:</span>{" "}
            <span
              className={`font-bold ${
                data.gerbang2 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.gerbang2 ? "Terbuka" : "Tertutup"}
            </span>
          </p>
        </div>
      </div>

      {/* Kontrol Gerbang dan Mode */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-xl text-center font-semibold text-black mb-2">
          Kontrol Gerbang
        </h3>
        <p className="text-black text-center text-xl mb-4">
          atur buka & tutup gerbang secara cepat
        </p>

        {/* Tombol Toggle Mode */}
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleMode}
            className={`px-6 py-3 rounded-full text-white font-medium transition-all ${
              kontrol.mode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {kontrol.mode ? "Ganti ke Otomatis" : "Ganti ke Manual"}
          </button>
        </div>

        {/* Tombol Kontrol Gerbang (hanya aktif di mode manual) */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => toggleGerbang(1)}
            disabled={!kontrol.mode}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${
              !kontrol.mode
                ? "bg-gray-400 cursor-not-allowed"
                : kontrol.gerbang1
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {kontrol.gerbang1 ? "Tutup Gerbang 1" : "Buka Gerbang 1"}
          </button>
          <button
            onClick={() => toggleGerbang(2)}
            disabled={!kontrol.mode}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${
              !kontrol.mode
                ? "bg-gray-400 cursor-not-allowed"
                : kontrol.gerbang2
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {kontrol.gerbang2 ? "Tutup Gerbang 2" : "Buka Gerbang 2"}
          </button>
        </div>
      </div>
    </main>
  );
}
