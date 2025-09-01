import { db } from "@/app/lib/db";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function POST(req) {
  const { username, password } = await req.json();

  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  const user = rows[0];

  if (!user) {
    return new Response(JSON.stringify({ error: "Username tidak ditemukan" }), {
      status: 404,
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return new Response(JSON.stringify({ error: "Password salah" }), {
      status: 401,
    });
  }

  // Simpan sesi sederhana di cookie (hanya user_id)
  cookies().set("user_id", user.id, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 hari
  });

  return new Response(
    JSON.stringify({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
