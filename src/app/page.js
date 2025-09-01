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
  });
  const [kontrol, setKontrol] = useState({ gerbang1: false, gerbang2: false });

  useEffect(() => {
    fetch("/api/control_status")
      .then((res) => res.json())
      .then(setKontrol);

    socket.on("sensor_update", setData);
    socket.on("control_update", ({ id, status }) => {
      setKontrol((prev) => ({ ...prev, [`gerbang${id}`]: status }));
    });

    return () => {
      socket.off("sensor_update");
      socket.off("control_update");
    };
  }, []);

  const toggleGerbang = (id) => {
    const newStatus = !kontrol[`gerbang${id}`];
    fetch("/api/control_status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl text-center font-bold text-blue-700 mb-1">
        📡 Monitoring Gerbang Air
      </h1>
      <p className="text-xl text-center capitalize text-slate-500 mb-4">
        pantau status & kendalikan gerbang air -- kontrol lebih aman dan efesien
      </p>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Status Sensor
      </h2>
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg mb-8">
        <Image
          className="w-auto h-48 mx-auto mb-2"
          src="/sea-level.png"
          height={200}
          width={200}
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
        />
        <div className="text-black">
          <h2 className="font-bold">Kelembapan Air</h2>
          <p>
            <span className="font-medium text-gray-800">Kelembapan:</span>{" "}
            {data.kelembapan}%
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

      {/* Kontrol Gerbang */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-xl text-center font-semibold text-black mb-2">
          Kontrol Gerbang
        </h3>
        <p className="text-black text-center text-xl mb-4">
          atur buka & tutup gerbang secara cepat
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => toggleGerbang(1)}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${
              kontrol.gerbang1
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {kontrol.gerbang1 ? "Tutup Gerbang 1" : "Buka Gerbang 1"}
          </button>
          <button
            onClick={() => toggleGerbang(2)}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${
              kontrol.gerbang2
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
