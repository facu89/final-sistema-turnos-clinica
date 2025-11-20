import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendAvisoModificado } from "@/hooks/email-resend-turno-modificado";
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
  turno_modificado?: boolean;
}

interface Profile {
  nombre: string;
  apellido: string;
  email: string;
}

interface Medico {
  legajo_medico: number;
  nombre: string;
  apellido: string;
}

interface Especialidad {
  descripcion: string;
}

interface TurnoCompleto {
  cod_turno: number;
  legajo_medico: number;
  fecha_hora_turno: string;
  profiles: Profile; // ✅ Objeto único, no array
  medico: Medico; // ✅ Objeto único, no array
  especialidad: Especialidad; // ✅ Objeto único, no array
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
    const { data: turnoData, error: checkError } = await supabase
      .from("turno")
      .select(
        `cod_turno, 
        legajo_medico, 
        fecha_hora_turno, 
        profiles(nombre,apellido,email),
        medico(legajo_medico,nombre,apellido),
        especialidad(descripcion)
        `
      )
      .eq("cod_turno", cod_turno)
      .returns<TurnoCompleto>()

      .maybeSingle();
    if (checkError) throw checkError;

    if (!turnoData) {
      return NextResponse.json(
        { error: "No se encontró el turno especificado" },
        { status: 404 }
      );
    }

    const turnoExistente = turnoData as TurnoCompleto;
    console.log(turnoExistente);

    const { data: turnoStatus, error: statusError } = await supabase
      .from("turno")
      .select("turno_modificado")
      .eq("cod_turno", cod_turno)
      .single();

    if (statusError) throw statusError;

    if (turnoStatus?.turno_modificado === true) {
      return NextResponse.json(
        { error: "El turno ya fue modificado anteriormente" },
        { status: 400 }
      );
    }

    // Verificar conflicto de horario
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

    console.log("Turno modificado:", {
      cod_turno: turnoExistente.cod_turno,
      paciente: `${turnoExistente.profiles.nombre} ${turnoExistente.profiles.apellido}`,
      medico: `${turnoExistente.medico.nombre} ${turnoExistente.medico.apellido}`,
      especialidad: turnoExistente.especialidad.descripcion,
      nueva_fecha: fecha_hora_turno,
    });
    /*
      nombre_paciente: t.profiles.nombre,
          apellido_paciente: t.profiles.apellido,
          nombre_medico: t.medico.nombre,
          especialidad: t.especialidad.descripcion,
          fecha_turno_nuevo: new Date(t.fecha_hora_turno),
          email_paciente: t.profiles.email,
*/
    const fechaFormateada = fecha_hora_turno.replace("T", " ");

    await sendAvisoModificado({
      nombre_paciente: turnoExistente.profiles.nombre,
      apellido_paciente: turnoExistente.profiles.apellido,
      nombre_medico: turnoExistente.medico.nombre,
      especialidad: turnoExistente.especialidad.descripcion,
      fecha_turno_nuevo: fechaFormateada,
      email_paciente: turnoExistente.profiles.email,
    });

    return NextResponse.json({
      message: "Turno modificado correctamente",
      data,
      turno_info: {
        paciente: `${turnoExistente.profiles.nombre} ${turnoExistente.profiles.apellido}`, // ✅ Sin [0]
        medico: `${turnoExistente.medico.nombre} ${turnoExistente.medico.apellido}`, // ✅ Sin [0]
        especialidad: turnoExistente.especialidad.descripcion, // ✅ Sin [0]
      },
    });
  } catch (error: any) {
    console.error("Error modificando turno:", error);
    return NextResponse.json(
      { error: error.message ?? "Error interno del servidor" },
      { status: 500 }
    );
  }
}
