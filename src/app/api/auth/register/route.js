import { db } from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { username, email, password } = await req.json();

  if (!username || !password) {
    return new Response(
      JSON.stringify({ error: "Username dan password wajib diisi" }),
      { status: 400 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    return new Response(
      JSON.stringify({ success: true, userId: result.insertId }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Registrasi gagal, mungkin username/email sudah terdaftar",
      }),
      { status: 400 }
    );
  }
}
