import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");

    if (!id_paciente) {
      return NextResponse.json(
        { error: "Falta el parámetro id_paciente" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("dni_paciente")
      .eq("id", id_paciente)
      .eq("tipo_usuario", "Paciente")
      .single(); 

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en GET /api/dniPaciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
