import { db } from "@/app/lib/db";

export async function POST(req) {
  const body = await req.json();
  const { ketinggian, kelembapan, gerbang1, gerbang2 } = body;

  await db.query(
    "INSERT INTO sensor_data (ketinggian, kelembapan, gerbang1_status, gerbang2_status) VALUES (?, ?, ?, ?)",
    [ketinggian, kelembapan, gerbang1, gerbang2]
  );

  global.io?.emit("sensor_update", body);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
