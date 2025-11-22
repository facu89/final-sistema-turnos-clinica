import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function getTurnosAfectados(
  id_agenda: any,
  legajo_medico: number,
) {
  const { data: agenda } = await supabase
    .from("agenda")
    .select("fechainiciovigencia, fechafinvigencia, duracionturno")
    .eq("id_agenda", id_agenda)
    .single();

  const { data: dias } = await supabase
    .from("dia_semana")
    .select("dia_semana, hora_inicio, hora_fin")
    .eq("id_agenda", id_agenda);

  // Obtener la fecha actual en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split("T")[0];
  console.log("PIBE SOLO SE VAN A REASIGNAR LOS TURNOS A APARTIR DE HOY:", hoy);
  const { data: turnos, error } = await supabase
    .from("turno")
    .select(
      "*, profiles(nombre,apellido,email), medico(nombre, apellido), especialidad(descripcion)",
    )
    .eq("legajo_medico", legajo_medico)
    .gte("fecha_hora_turno", hoy);

  if (error) throw error;
  if (!turnos) return [];

  return turnos.filter((t) => {
    const fechaTurno = new Date(t.fecha_hora_turno);
    const fecha = fechaTurno.toISOString().split("T")[0];
    const hora = fechaTurno.toTimeString().split(" ")[0];
    const diaSemana = ((fechaTurno.getDay() + 6) % 7) + 1;

    //fuera de la vigencia
    if (
      fecha < agenda?.fechainiciovigencia || fecha > agenda?.fechafinvigencia
    ) return true;

    //dia que no atiende el medico
    const dia = dias?.find((d) => d.dia_semana === diaSemana);

    if (!dia) return true;

    //horario fuera de rango
    if (hora < dia.hora_inicio || hora > dia.hora_fin) return true;

    return false;
  });
}
