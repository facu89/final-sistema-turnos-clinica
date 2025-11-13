import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

//Obtengo todos los turnos de un paciente
export async function GET(request: NextRequest) {
  const nowIso = new Date().toISOString();
  const { searchParams } = new URL(request.url);
  const dniPaciente = Number(searchParams.get("dni_paciente"));
  const { data, error } = await supabase
    .from("turno")
    .select(
      `
      cod_turno,
      profiles(nombre, apellido, email),
      fecha_hora_turno,
      estado_turno,
      turno_pagado,
      turno_modificado,
      id_especialidad,
      dni_paciente,
      legajo_medico,
      
      especialidad(descripcion),
      medico:legajo_medico (
        nombre,
        apellido
      )`,
    )
    .eq("dni_paciente", dniPaciente)
    .gte("fecha_hora_turno", nowIso)
    .order("fecha_hora_turno", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data ?? []);
}

//obtengo el id de un turno y lo elimino
export async function DELETE(request: NextRequest) {
  const data = await request.json();
  const cod_turno = data.cod_turno;
  const { error } = await supabase
    .from("turno")
    .delete()
    .eq("cod_turno", cod_turno);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
// import { createClient } from "@supabase/supabase-js";
// import { NextRequest, NextResponse } from "next/server";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// // Obtengo todos los turnos de un paciente
// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const dniPaciente = Number(searchParams.get("dni_paciente"));
//   console.log("EndPoint llamado", dniPaciente);

//   // 🔹 SELECT con nombre completo concatenado
//   const { data, error } = await supabase
//     .from("turno")
//     .select(`
//       cod_turno,
//       fecha_hora_turno,
//       estado_turno,
//       turno_pagado,
//       turno_modificado,
//       id_especialidad,
//       medico_nombre_completo:legajo_medico!inner (
//         nombre_completo:concat_ws(' ', nombre, apellido)
//       )
//     `)
//     .eq("dni_paciente", dniPaciente)
//     .order("fecha_hora_turno", { ascending: true });

//   if (error) {
//     console.error("❌ Supabase error:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }

//   // 🔹 Mapeo para devolver string directa
//   const turnosFormateados = data.map((t: any) => ({
//     ...t,
//     medico:
//       t.medico_nombre_completo?.[0]?.nombre_completo || "-", // si no hay médico
//   }));

//   return NextResponse.json(turnosFormateados ?? []);
// }
