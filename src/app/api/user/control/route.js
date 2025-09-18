import { db } from "@/app/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Handler untuk metode GET (untuk membaca status kontrol)
export async function GET() {
  try {
    const [controlData] = await db.query(
      "SELECT gerbang1, gerbang2, mode FROM control_status WHERE id = 1"
    );

    if (controlData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Status kontrol tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      control: controlData[0],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Handler untuk metode PATCH (untuk memperbarui status kontrol)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { gerbang1, gerbang2, mode } = body;

    const userCookie = cookies().get("user_id");
    if (!userCookie) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = userCookie.value;

    const updateFields = [];
    const updateValues = [];

    if (typeof gerbang1 === "boolean") {
      updateFields.push("gerbang1 = ?");
      updateValues.push(gerbang1);
    }
    if (typeof gerbang2 === "boolean") {
      updateFields.push("gerbang2 = ?");
      updateValues.push(gerbang2);
    }
    if (typeof mode === "boolean") {
      updateFields.push("mode = ?");
      updateValues.push(mode);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permintaan tidak valid. Setidaknya satu dari 'gerbang1', 'gerbang2', atau 'mode' harus ada.",
        },
        { status: 400 }
      );
    }

    updateFields.push("updated_by = ?");
    updateValues.push(userId);

    const query = `UPDATE control_status SET ${updateFields.join(
      ", "
    )} WHERE id = 1`;

    await db.query(query, updateValues);

    const [updatedData] = await db.query(
      "SELECT * FROM control_status WHERE id = 1"
    );

    return NextResponse.json({
      success: true,
      message: "Status kontrol berhasil diperbarui",
      control: updatedData[0],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
