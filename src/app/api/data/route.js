import { db } from "@/app/lib/db";

export async function POST(req) {
  const body = await req.json();
  const { jarak, kelembapan, gerbang1, gerbang2 } = body;

  await db.query(
    "INSERT INTO sensor_data (jarak, kelembapan, gerbang1_status, gerbang2_status) VALUES (?, ?, ?, ?)",
    [jarak, kelembapan, gerbang1, gerbang2]
  );

  global.io?.emit("sensor_update", body); // emit ke client socket.io

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
