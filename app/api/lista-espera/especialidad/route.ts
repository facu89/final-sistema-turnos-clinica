import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { especialidad, patologia, dni_paciente } = body;
  const { error, data } = await supabase
    .from("solicitudes_especialidad")
    .insert([
      {
        dni_paciente: dni_paciente,
        id_especialidad: especialidad,
        cod_patologia: patologia,
        fechahorasolicitud: new Date().toISOString(),
      },
    ])
    .select("*");
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data }, { status: 200 });
}
