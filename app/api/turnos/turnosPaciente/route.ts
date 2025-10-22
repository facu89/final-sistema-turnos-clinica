import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//Obtengo todos los turnos de un paciente
export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const dniPaciente = Number(searchParams.get("dni_paciente"));
     console.log("EndPoint llamado",dniPaciente);
const { data, error } = await supabase
    .from("turno")
    .select(`
      cod_turno,
      fecha_hora_turno,
      estado_turno,
      turno_pagado,
      turno_modificado,
      id_especialidad,
      dni_paciente,
      medico:legajo_medico (
        nombre,
        apellido
      )`)
      .eq("dni_paciente", dniPaciente)
  .order("fecha_hora_turno", { ascending: true });
     if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
     }
     console.log(data);
     return NextResponse.json(data ?? []);
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
