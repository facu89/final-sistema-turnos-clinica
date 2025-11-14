import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncEspecialidadesMedico } from "@/lib/medico/helpers";
import { syncEspecialidadesMedico } from "@/lib/medico/helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const legajo_medico = searchParams.get("legajo_medico");

    if (!legajo_medico) {
      return NextResponse.json(
        { error: "legajo_medico es requerido" },
        { status: 400 },
      );
    }

    // Asegurarnos de usar el tipo correcto para la comparación. En DB el legajo suele ser numérico.
    const legajoValue = isNaN(Number(legajo_medico))
      ? legajo_medico
      : Number(legajo_medico);
    //console.log("LEGAJO DEL MEDICO");
    console.log(legajoValue);

    const { data, error } = await supabase
      .from("medico_especialidad")
      .select(
        `especialidad ( id_especialidad, descripcion )`,
      )
      .eq("legajo_medico", legajoValue);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const especialidades = (data || []).map((item: any) => item.especialidad);

    return NextResponse.json(especialidades);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { legajo_medico, especialidades } = await request.json();

    // Delegar a helper centralizado
    try {
      const inserted = await syncEspecialidadesMedico(
        supabase,
        legajo_medico,
        especialidades,
      );
      return NextResponse.json({ success: true, data: inserted });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Error interno" }, {
        status: 500,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
