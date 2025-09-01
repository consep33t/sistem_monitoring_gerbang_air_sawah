import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("user_id");

  return new Response(
    JSON.stringify({ success: true, message: "Berhasil logout" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
