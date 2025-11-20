import { createClient } from "@supabase/supabase-js";
import { notificarCambioEstadoTurnoPorConvenio } from "@/hooks/convenio/notificar-pendiente-pago-convenio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function syncEspecialidadesMedico(
  supabase: any,
  legajo_medico: string,
  especialidades: (string | number)[]
) {
  try {
    // obtener especialidades actuales del médico
    const { data: actuales } = await supabase
      .from("medico_especialidad")
      .select("id_especialidad")
      .eq("legajo_medico", legajo_medico);

    // tipar los valores x las dudas
    const actualesIds: number[] = (actuales || []).map(
      (e: { id_especialidad: number }) => e.id_especialidad
    );
    const nuevasIds: number[] = especialidades.map((e) => Number(e));

    const actualesSet = new Set<number>(actualesIds);
    const nuevosSet = new Set<number>(nuevasIds);

    // eliminar especialidades que ya no están
    const eliminar: number[] = [...actualesSet].filter((id) => !nuevosSet.has(id));
    if (eliminar.length > 0) {
      await supabase
        .from("medico_especialidad")
        .delete()
        .eq("legajo_medico", legajo_medico)
        .in("id_especialidad", eliminar);
    }

    // agregar especialidades nuevas
    const agregar: number[] = [...nuevosSet].filter((id) => !actualesSet.has(id));
    if (agregar.length > 0) {
      const rows = agregar.map((id_especialidad) => ({
        legajo_medico,
        id_especialidad,
      }));
      await supabase.from("medico_especialidad").insert(rows);
    }

    return { success: true };
  } catch (error: any) {
    console.error(" Error en syncEspecialidadesMedico:", error.message);
    return { success: false, error: error.message };
  }
}


export async function syncConveniosMedico(
  supabase: any,
  legajo_medico: string,
  convenios: { id_obra: string | number; fecha_alta: string }[]
) {
  try {
    // obtener convenios actuales de la BD
    const { data: actuales } = await supabase
      .from("convenio")
      .select("id_obra")
      .eq("legajo_medico", legajo_medico);

    // tipar los ids por las dudas
    const actualesIds: number[] = (actuales || []).map(
      (c: { id_obra: number }) => c.id_obra
    );

    // asegurar que todos los nuevos ids sean numericos
    const nuevosIds: number[] = convenios.map((c) => Number(c.id_obra));

    const actualesSet = new Set<number>(actualesIds);
    const nuevosSet = new Set<number>(nuevosIds);

    // eliminar convenios que ya no existen
    const eliminar: number[] = [...actualesSet].filter((id) => !nuevosSet.has(id));
    if (eliminar.length > 0) {
      await supabase
        .from("convenio")
        .delete()
        .eq("legajo_medico", legajo_medico)
        .in("id_obra", eliminar);
    }

    //  actualizar turnos futuros a "Pendiente de pago" y notificar
    if (eliminar.length > 0) {
      const hoy = new Date().toISOString().split("T")[0]; // fecha actual en formato YYYY-MM-DD

      for (const eliminado of eliminar) {
        // obtener turnos futuros afectados por el convenio eliminado
        const { data: turnosFuturos, error: errorFetch } = await supabase
          .from("turno")
          .select("cod_turno, fecha_hora_turno, dni_paciente, legajo_medico, id_obra")
          .eq("legajo_medico", legajo_medico)
          .eq("id_obra", eliminado)
          .neq("estado_turno", "Cancelado")
          .gt("fecha_hora_turno", hoy); // solo turnos futuros (fecha > hoy)

        if (errorFetch) {
          console.warn(
            ` Error obteniendo turnos futuros del médico ID ${legajo_medico} para obra ID ${eliminado}:`,
            errorFetch.message
          );
          continue;
        }

        if (turnosFuturos && turnosFuturos.length > 0) {
          // actualizar todos los turnos futuros a "Pendiente de pago"
          const { error: errorTurnos } = await supabase
            .from("turno")
            .update({ estado_turno: "Pendiente de pago", turno_pagado: false })
            .eq("legajo_medico", legajo_medico)
            .eq("id_obra", eliminado)
            .neq("estado_turno", "Cancelado")
            .gt("fecha_hora_turno", hoy);

          if (errorTurnos) {
            console.warn(
              ` Error actualizando turnos futuros del médico ID ${legajo_medico} para obra ID ${eliminado}:`,
              errorTurnos.message
            );
          } else {
            console.log(
              ` Turnos futuros del médico ID ${legajo_medico} con obra ID ${eliminado} marcados como "Pendiente de pago".`
            );

            // enviar notificaciones a los turnos futuros afectados
            for (const turno of turnosFuturos) {
              try {
                // obtener datos del paciente y médico para la notificación
                const { data: paciente } = await supabase
                  .from("profiles")
                  .select("nombre, apellido, email")
                  .eq("dni_paciente", turno.dni_paciente)
                  .single();

                const { data: medico } = await supabase
                  .from("medico")
                  .select("nombre, apellido")
                  .eq("legajo_medico", turno.legajo_medico)
                  .single();

                const { data: obraSocial } = await supabase
                  .from("obra_social")
                  .select("descripcion")
                  .eq("id_obra", turno.id_obra)
                  .single();

                await notificarCambioEstadoTurnoPorConvenio({
                  idTurno: String(turno.cod_turno),
                  descripcion: obraSocial?.descripcion || "Obra social",
                  nuevoEstado: "Pendiente de pago",
                  fechaHoraTurno: turno.fecha_hora_turno,
                  especialidad: "Especialidad", // se obtiene dentro de la función si es necesario
                });
                console.log(
                  ` Notificación enviada para turno ID ${turno.cod_turno} - estado: Pendiente de pago`
                );
              } catch (notifyError: any) {
                console.warn(
                  ` Error enviando notificación para turno ID ${turno.id_turno}:`,
                  notifyError.message
                );
              }
            }
          }
        }
      }
    }

    // insertar convenios nuevos
    const agregar = convenios.filter((c) => !actualesSet.has(Number(c.id_obra)));
    if (agregar.length > 0) {
      const rows = agregar.map((c) => ({
        legajo_medico,
        id_obra: Number(c.id_obra),
        fecha_alta: c.fecha_alta,
      }));
      await supabase.from("convenio").insert(rows);
    }

    return { success: true };
  } catch (error: any) {
    console.error(" Error en syncConveniosMedico:", error.message);
    return { success: false, error: error.message };
  }
}

