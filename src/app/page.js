"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io();

export default function Dashboard() {
  const [data, setData] = useState({
    jarak: 0,
    kelembapan: 0,
    gerbang1: false,
    gerbang2: false,
  });
  const [kontrol, setKontrol] = useState({ gerbang1: false, gerbang2: false });

  useEffect(() => {
    fetch("/api/control")
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
    fetch("/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
  };

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>📡 Monitoring Gerbang Air</h1>

      <div>
        <p>
          <strong>Jarak Air:</strong> {data.jarak} cm
        </p>
        <p>
          <strong>Kelembapan:</strong> {data.kelembapan}
        </p>
        <p>
          <strong>Status Gerbang 1:</strong>{" "}
          {data.gerbang1 ? "Terbuka" : "Tertutup"}
        </p>
        <p>
          <strong>Status Gerbang 2:</strong>{" "}
          {data.gerbang2 ? "Terbuka" : "Tertutup"}
        </p>
      </div>

      <hr />

      <div>
        <h3>Kontrol Manual</h3>
        <button onClick={() => toggleGerbang(1)}>
          {kontrol.gerbang1 ? "Tutup Gerbang 1" : "Buka Gerbang 1"}
        </button>
        <button onClick={() => toggleGerbang(2)} style={{ marginLeft: "1rem" }}>
          {kontrol.gerbang2 ? "Tutup Gerbang 2" : "Buka Gerbang 2"}
        </button>
      </div>
    </main>
  );
}
