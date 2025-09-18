import { db } from "@/app/lib/db";

export async function POST(req) {
  const body = await req.json();
  // ESP32 mengirim: { jarak, kelembapan, gerbang1, gerbang2, mode }
  const { jarak, kelembapan, gerbang1, gerbang2, mode } = body;

  // Simpan ke DB, pastikan kolom DB sesuai (ganti ketinggian -> jarak, tambah mode jika ada)
  await db.query(
    "INSERT INTO sensor_data (jarak, kelembapan, gerbang1_status, gerbang2_status, mode) VALUES (?, ?, ?, ?, ?)",
    [jarak, kelembapan, gerbang1, gerbang2, mode]
  );

  global.io?.emit("sensor_update", body);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
