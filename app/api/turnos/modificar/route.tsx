import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

interface TurnoUpdateBody {
  cod_turno: number;
  fecha_hora_turno: string;
  turno_modificado?:boolean;
}

export async function PATCH(request: Request) {
  const supabase = supabaseAdmin;

  try {
    const body: TurnoUpdateBody = await request.json();
    const { cod_turno, fecha_hora_turno } = body;

    // Validaciones básicas
    if (!cod_turno || !fecha_hora_turno) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: cod_turno y/o fecha_hora_turno" },
        { status: 400 }
      );
    }

    // Buscar turno existente
    const { data: turnoExistente, error: checkError } = await supabase
      .from("turno")
      .select("cod_turno, legajo_medico, fecha_hora_turno, turno_modificado")
      .eq("cod_turno", cod_turno)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!turnoExistente) {
      return NextResponse.json(
        { error: "No se encontró el turno especificado" },
        { status: 404 }
      );
    }

    // Si ya fue modificado, no permitir cambios
    if (turnoExistente.turno_modificado === true) {
      return NextResponse.json(
        { error: "El turno ya fue modificado anteriormente" },
        { status: 400 }
      );
    }

    // Verificar si el nuevo horario está ocupado para el mismo médico
    const { data: conflicto, error: conflictError } = await supabase
      .from("turno")
      .select("cod_turno")
      .eq("legajo_medico", turnoExistente.legajo_medico)
      .eq("fecha_hora_turno", fecha_hora_turno)
      .maybeSingle();

    if (conflictError) throw conflictError;

    if (conflicto && conflicto.cod_turno !== cod_turno) {
      return NextResponse.json(
        { error: "Ya existe un turno en ese horario para el mismo médico" },
        { status: 409 }
      );
    }

    // Actualizar turno
    const { data, error } = await supabase
      .from("turno")
      .update({
        fecha_hora_turno,
        turno_modificado: true,
      })
      .eq("cod_turno", cod_turno)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Turno modificado correctamente",
      data,
    });
  } catch (error: any) {
    console.error("Error modificando turno:", error);
    return NextResponse.json(
      { error: error.message ?? "Error interno del servidor" },
      { status: 500 }
    );
  }
}
