import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);
export async function filtrarMedicosPorEspecialidad(
  filtroEspecialidad: string,
  medicos: Medico[]
) {
  if (!filtroEspecialidad) {
    return [];
  }
  try {
    console.log("Filtrando médicos por especialidad:", filtroEspecialidad);
    const { data: turnoData, error: turnoError } = await supabase
      .from("medico_especialidad")
      .select("legajo_medico")
      .eq("id_especialidad", filtroEspecialidad);
    if (turnoError) {
      console.error("Error cargando medico_especialidad:", turnoError);
      return;
    }
    const legajos = (turnoData ?? []).map((row) => row.legajo_medico);
    const medicosFiltrados = medicos.filter((medico) =>
      legajos.includes(medico.legajo_medico)
    );
    console.log("médicos filtrados:", medicosFiltrados);
    return medicosFiltrados;
  } catch (error) {
    console.error("Error al filtrar médicos:", error);
    return [];
  }
}
