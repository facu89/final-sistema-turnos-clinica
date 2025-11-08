import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
//devuelve turno por codigo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cod_turno = Number(searchParams.get("cod_turno"));
    const { data: turnoData, error: turnoError } = await supabase
      .from("turno")
      .select(`
        cod_turno,
        fecha_hora_turno,
        turno_pagado,
        turno_modificado,
        presencia_turno,
        legajo_medico,
        estado_turno,
        paciente:dni_paciente(
                dni_paciente,
                nombre,
                apellido,
                telefono,
                email
                ),
        medico:legajo_medico(

                nombre,
                apellido),
        obra:id_obra(
            descripcion
        ),
        especialidad:id_especialidad(
            descripcion
        )
    `)
      .eq("cod_turno", cod_turno)
      .single();

    if (turnoError) {
      throw turnoError;
    }
    return NextResponse.json(turnoData);
  } catch (error) {
    console.log("Error al obtener turno por código:", error);
    return NextResponse.json(
      { error: "Error al obtener turno por código" },
      { status: 500 },
    );
  }
}
