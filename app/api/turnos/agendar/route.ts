import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendConfirmacionTurno } from "@/hooks/email-resend-confirmacion-turno";
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
  legajo_medico: number;
  nombre_medico?: string;
  dni_paciente: number;
  fecha_hora_turno: Date;
  id_especialidad: number;
  desc_especialidad?: string;
  id_obra: string | null;
  turno_pagado?: boolean;
  estado_turno: string;
  turno_modificado?: boolean;
  presencia_turno?: boolean; // opcional
  userId?: string;
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

    const missing = requiredFields.filter(
      (f) => body[f] === undefined || body[f] === null
    );
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
          turno_pagado: body.turno_pagado ?? true,
          estado_turno: body.estado_turno,
          turno_modificado: body.turno_modificado ?? false,
          presencia_turno: body.presencia_turno ?? null,
        },
      ])
      .select()
      .single();

    //para mandar el mail de confirmacion
    const { data: dataUser, error: errorUser } = await supabase
      .from("profiles")
      .select("email,nombre,apellido")
      .eq("dni_paciente", body.dni_paciente)
      .maybeSingle();

    await sendConfirmacionTurno({
      nombre_paciente: dataUser?.nombre,
      apellido_paciente: dataUser?.apellido,
      nombre_medico: body.nombre_medico || "",
      especialidad: body.desc_especialidad || "",
      fecha_turno: body.fecha_hora_turno || new Date(),
      email_paciente: dataUser?.email,
    });
    if (errorUser) throw errorUser;
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
