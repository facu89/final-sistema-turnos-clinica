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

  return NextResponse.json(data);
}
