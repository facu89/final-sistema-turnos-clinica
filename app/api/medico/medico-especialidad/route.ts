import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const legajo_medico = searchParams.get("legajo_medico");

    if (!legajo_medico) {
      return NextResponse.json(
        { error: "legajo_medico es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("medico_especialidad")
      .select(
        `
        especialidad (
          id_especialidad,
          descripcion
        )
      `
      )
      .eq("legajo_medico", legajo_medico);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const especialidades = data.map((item) => item.especialidad);

    return NextResponse.json(especialidades);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
