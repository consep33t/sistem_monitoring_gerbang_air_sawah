import { db } from "@/app/lib/db";

export async function GET() {
  const [rows] = await db.query("SELECT * FROM control_status");
  const result = {
    gerbang1: !!rows.find((r) => r.id === 1)?.status,
    gerbang2: !!rows.find((r) => r.id === 2)?.status,
  };
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  const body = await req.json();
  const { id, status } = body; // id: 1/2

  await db.query("REPLACE INTO control_status (id, status) VALUES (?, ?)", [
    id,
    status,
  ]);
  global.io?.emit("control_update", { id, status });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
