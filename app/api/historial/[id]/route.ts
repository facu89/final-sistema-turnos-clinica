import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data: paciente, error: errorPaciente } = await supabase
    .from("profiles")
    .select("dni_paciente, nombre, apellido")
    .eq("id", params.id)
    .single();

  if (errorPaciente || !paciente) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    );
  }

  const { data: ausencias, error: errorAusencias } = await supabase
    .from("turno")
    .select(
      `
        cod_turno,
        fecha_hora_turno,
        medico:legajo_medico(
            nombre,
            apellido
        ),
        especialidad:id_especialidad(
            descripcion
        )
    `
    )
    .order("fecha_hora_turno", {ascending: false})
    .eq("dni_paciente", paciente.dni_paciente)
    .or("presencia_turno.eq.false");

  if (errorAusencias) {
    return NextResponse.json(
      { error: errorAusencias.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ paciente, ausencias });
}
