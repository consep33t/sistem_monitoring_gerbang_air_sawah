import { db } from "@/app/lib/db";

export async function POST(req) {
  const body = await req.json();
  // ESP32 mengirim: { jarak, kelembapan, gerbang1, gerbang2 }
  const { jarak, kelembapan, gerbang1, gerbang2 } = body;

  // Simpan ke DB, pastikan kolom DB sesuai (ganti ketinggian -> jarak)
  await db.query(
    "INSERT INTO sensor_data (ketinggian, kelembapan, gerbang1_status, gerbang2_status) VALUES (?, ?, ?, ?)",
    [jarak, kelembapan, gerbang1, gerbang2]
  );

  global.io?.emit("sensor_update", body);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
