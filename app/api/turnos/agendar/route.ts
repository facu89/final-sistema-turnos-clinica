import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);



interface TurnoBody {
  legajo_medico: string;
  dni_paciente: string;
  fecha_hora_turno: string;
  id_especialidad: number;
  id_obra?: number | null;
  turno_pagado?: boolean;
  estado_turno: string;
  turno_modificado?: boolean;
  presencia_turno?: boolean; // opcional
}

export async function POST(request: Request) {
  const supabase = supabaseAdmin;

  try {
    // Parseo tipado
    const body: TurnoBody = await request.json();

    const requiredFields: (keyof TurnoBody)[] = [
      "legajo_medico",
      "dni_paciente",
      "fecha_hora_turno",
      "id_especialidad",
      "estado_turno",
    ];

    const missing = requiredFields.filter((f) => body[f] === undefined || body[f] === null);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan datos obligatorios: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const { legajo_medico, fecha_hora_turno } = body;

    //  Verificar disponibilidad del turno
    const { data: existente, error: checkError } = await supabase
      .from("turno")
      .select("cod_turno")
      .eq("legajo_medico", legajo_medico)
      .eq("fecha_hora_turno", fecha_hora_turno)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existente) {
      return NextResponse.json(
        { error: "El turno ya está ocupado" },
        { status: 409 }
      );
    }

    //  Insertar el nuevo turno (sanitizado)
    const { data, error } = await supabase
      .from("turno")
      .insert([
        {
          legajo_medico: body.legajo_medico,
          dni_paciente: body.dni_paciente,
          fecha_hora_turno: body.fecha_hora_turno,
          id_especialidad: body.id_especialidad,
          id_obra: body.id_obra,
          turno_pagado: body.turno_pagado?? true,
          estado_turno: body.estado_turno,
          turno_modificado: body.turno_modificado?? false,
          presencia_turno: body.presencia_turno ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Turno agendado correctamente",
      data,
    });
  } catch (error: any) {
    console.error("❌ Error agendando turno:", error);
    return NextResponse.json(
      { error: error.message ?? "Error interno del servidor" },
      { status: 500 }
    );
  }
}
