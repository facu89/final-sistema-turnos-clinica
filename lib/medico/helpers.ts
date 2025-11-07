import { createClient } from "@supabase/supabase-js";

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

    //  actualizar turnos a "Pendiente de pago"
    if (eliminar.length > 0) {
      for (const eliminado of eliminar) {
        const { error: errorTurnos } = await supabase
          .from("turnos")
          .update({ estado: "Pendiente de pago" })
          .eq("legajo_medico", legajo_medico)
          .eq("id_obra", eliminado)
          .neq("estado", "Cancelado"); // opcional: no afectar cancelados

        if (errorTurnos) {
          console.warn(
            ` Error actualizando turnos del médico de ID${legajo_medico} para obra de ID ${eliminado}:`,
            errorTurnos.message
          );
        } else {
          console.log(
            ` Turnos del médico de ID ${legajo_medico} con obra de ID ${eliminado} marcados como "Pendiente de pago".`
          );
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

