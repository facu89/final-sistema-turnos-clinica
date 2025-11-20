import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function obtenerMedicoTurno(idTurno: string) {
  try {
    const { data: turnoData, error: turnoError } = await supabase
      .from("turno")
      .select("cod_turno, fecha_hora_turno, legajo_medico")
      .eq("cod_turno", idTurno)
      .single();

    if (turnoError) {
      throw new Error(`Error al obtener turno: ${turnoError.message}`);
    }

    if (!turnoData) {
      throw new Error("Turno no encontrado");
    }

    const { data: medicoData, error: medicoError } = await supabase
      .from("medico")
      .select(
        `
        legajo_medico,
        dni_medico,
        nombre,
        apellido,
        telefono
      `
      )
      .eq("legajo_medico", turnoData.legajo_medico)
      .single();

    if (medicoError) {
      throw new Error(`Error al obtener médico: ${medicoError.message}`);
    }

    if (!medicoData) {
      throw new Error("Médico no encontrado");
    }

    return {
      success: true,
      data: {
        legajo_medico: medicoData.legajo_medico,
        dni_medico: medicoData.dni_medico,
        nombre: medicoData.nombre,
        apellido: medicoData.apellido,
        telefono: medicoData.telefono,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
