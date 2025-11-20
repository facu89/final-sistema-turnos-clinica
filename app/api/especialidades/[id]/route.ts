import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from("especialidades")
      .select("*")
      .eq("id_especialidad", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Especialidad no encontrada");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching especialidad:", error);
    return new NextResponse("Error al cargar la especialidad", { status: 500 });
  }
}