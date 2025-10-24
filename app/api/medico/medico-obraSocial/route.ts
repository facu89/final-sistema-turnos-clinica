import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const { searchParams } = new URL(request.url);
  const legajo_medico = searchParams.get("legajo_medico");

  if (!legajo_medico) {
    return NextResponse.json({ error: "Falta legajo_medico" }, { status: 400 });
  }

  // 🔍 Buscar las obras sociales del médico
  const { data, error } = await supabase
    .from("convenio")
    .select(`
      fecha_alta,
      obra_social (
        id_obra,
        descripcion,
        estado,
        telefono_contacto,
        sitio_web
      )
    `)
    .eq("legajo_medico", legajo_medico);

  if (error) {
    console.error("Error Supabase:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 🔧 Aplanar resultados y manejar casos donde obra_social sea null
  const obrasSociales = (data || [])
    .filter((item) => item.obra_social)
    .map((item) => ({
      id_obra: item.obra_social.id_obra,
      descripcion: item.obra_social.descripcion,
      estado: item.obra_social.estado,
      telefono_contacto: item.obra_social.telefono_contacto ?? null,
      sitio_web: item.obra_social.sitio_web ?? null,
      fecha_alta: item.fecha_alta,
    }));

  return NextResponse.json(obrasSociales);
}
