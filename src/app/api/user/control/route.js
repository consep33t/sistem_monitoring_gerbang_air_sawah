import { db } from "@/app/lib/db";
import { cookies } from "next/headers";

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { gerbang1, gerbang2, mode } = body;

    // Ambil user_id dari cookie
    const userCookie = cookies().get("user_id");
    if (!userCookie) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const userId = userCookie.value;

    // Cek apakah ada data yang akan di-update
    const updateFields = [];
    const updateValues = [];

    // Jika gerbang1 ada dalam body, tambahkan ke update
    if (typeof gerbang1 === "boolean") {
      updateFields.push("gerbang1 = ?");
      updateValues.push(gerbang1);
    }
    // Jika gerbang2 ada dalam body, tambahkan ke update
    if (typeof gerbang2 === "boolean") {
      updateFields.push("gerbang2 = ?");
      updateValues.push(gerbang2);
    }
    // Jika mode ada dalam body, tambahkan ke update
    if (typeof mode === "boolean") {
      updateFields.push("mode = ?");
      updateValues.push(mode);
    }

    // Jika tidak ada data yang valid untuk di-update
    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Permintaan tidak valid. Setidaknya satu dari 'gerbang1', 'gerbang2', atau 'mode' harus ada.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Tambahkan updated_by dan timestamp (opsional) ke update
    updateFields.push("updated_by = ?");
    updateValues.push(userId);

    // Buat query UPDATE dinamis
    const query = `UPDATE control_status SET ${updateFields.join(
      ", "
    )} WHERE id = 1`;

    await db.query(query, updateValues);

    // Ambil data terbaru untuk ditampilkan
    const [updatedData] = await db.query(
      "SELECT * FROM control_status WHERE id = 1"
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Status kontrol berhasil diperbarui",
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
