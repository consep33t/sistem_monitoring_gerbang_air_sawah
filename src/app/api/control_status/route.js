import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET(req) {
  try {
    // Ambil cookie user_id
    const cookie = req.cookies.get("user_id");
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan di cookie" },
        { status: 401 }
      );
    }

    const userId = cookie.value;

    // Ambil data user
    const [users] = await db.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil semua status gerbang
    const [controlStatus] = await db.query("SELECT * FROM control_status");

    const result = {
      gerbang1: !!controlStatus.find((r) => r.id === 1)?.status,
      gerbang2: !!controlStatus.find((r) => r.id === 2)?.status,
      updated_by: controlStatus.find((r) => r.id === 1)?.updated_by ?? null,
    };

    return NextResponse.json({
      success: true,
      user: users[0],
      control: result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
