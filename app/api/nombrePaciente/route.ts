import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni_paciente");

    if (!dni) {
      return NextResponse.json({ error: "Falta el parámetro dni_paciente" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("nombre, apellido")
      .eq("dni_paciente", dni)
      .eq("tipo_usuario", "Paciente")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ nombre_completo: `${data.nombre} ${data.apellido}` });
  } catch (error) {
    console.error("Error en GET /api/nombrePaciente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
