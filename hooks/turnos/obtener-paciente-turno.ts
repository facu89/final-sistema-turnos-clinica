import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function obtenerPacienteTurno(idTurno: string) {
  try {
    const { data: turnoData, error: turnoError } = await supabase
      .from("turno")
      .select("cod_turno, fecha_hora_turno, dni_paciente")
      .eq("cod_turno", idTurno)
      .single();

    if (turnoError) {
      throw new Error(`Error al obtener turno: ${turnoError.message}`);
    }

    if (!turnoData) {
      throw new Error("Turno no encontrado");
    }

    const { data: pacienteData, error: pacienteError } = await supabase
      .from("profiles")
      .select(
        `
        dni_paciente,
        nombre,
        apellido,
        telefono,
        email
      `
      )
      .eq("dni_paciente", turnoData.dni_paciente)
      .eq("tipo_usuario", "Paciente")
      .single();

    if (pacienteError) {
      throw new Error(`Error al obtener paciente: ${pacienteError.message}`);
    }

    if (!pacienteData) {
      throw new Error("Paciente no encontrado");
    }

    return {
      success: true,
      data: {
        dni_paciente: pacienteData.dni_paciente,
        nombre: pacienteData.nombre,
        apellido: pacienteData.apellido,
        telefono: pacienteData.telefono,
        email: pacienteData.email,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
