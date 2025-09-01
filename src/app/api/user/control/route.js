import { db } from "@/app/lib/db";
import { cookies } from "next/headers";

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { gerbang, status } = body; // gerbang: 1 atau 2

    if (![1, 2].includes(gerbang) || typeof status === "undefined") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gerbang (1/2) dan status diperlukan",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ambil user_id dari cookie
    const userCookie = cookies().get("user_id");
    if (!userCookie) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = userCookie.value;

    // Update control_status
    await db.query(
      "REPLACE INTO control_status (id, status, updated_by) VALUES (?, ?, ?)",
      [gerbang, status, userId]
    );

    const [updatedData] = await db.query(
      "SELECT * FROM control_status WHERE id = ?",
      [gerbang]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Gerbang ${gerbang} berhasil diperbarui`,
        control: updatedData[0],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Terjadi kesalahan server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
