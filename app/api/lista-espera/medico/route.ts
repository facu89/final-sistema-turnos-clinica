import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { medico, patologia, dni_paciente, id_especialidad } = body;
  console.log(
    "che mira estoy en la api de lista espera medico y me llego esta data",
    id_especialidad
  );
  const { error, data } = await supabase
    .from("solicitudes_medico")
    .insert([
      {
        dni_paciente: dni_paciente,
        legajo_medico: medico,
        cod_patologia: patologia,
        fechahorasolicitud: new Date().toISOString(),
        id_especialidad: id_especialidad,
      },
    ])
    .select("*");
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data }, { status: 200 });
}
