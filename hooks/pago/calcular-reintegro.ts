import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function calcularReintegro(cod_turno: number): Promise<number> {
  try {
    const turnoRes = await fetch(
      `/api/turnos/turno-codigo?cod_turno=${cod_turno}`
    );
    const turnoData = await turnoRes.json();
    const turnoPagado = turnoData?.turno_pagado;
    const fechaTurno = turnoData?.fecha_hora_turno;
    const legajoMedico = turnoData?.legajo_medico;

    if (turnoPagado && fechaTurno && legajoMedico) {
      const ahora = new Date();
      const fechaTurnoDate = new Date(fechaTurno);
      const diffMs = fechaTurnoDate.getTime() - ahora.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);

      if (diffHoras >= 48) {
        const medicoRes = await fetch(`/api/medico/${legajoMedico}`);
        const medicoData = await medicoRes.json();
        const tarifaMedico = medicoData?.tarifa;

        if (tarifaMedico) {
          return tarifaMedico * 0.4;
        }
      }
    }
    return 0;
  } catch (error) {
    console.log("Error al calcular reintegro:", error);
    return 0;
  }
}
