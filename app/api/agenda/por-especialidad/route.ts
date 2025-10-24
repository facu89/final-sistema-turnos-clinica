import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_especialidad = searchParams.get("id_especialidad");
    if (!id_especialidad)
      return NextResponse.json({ error: "Falta id_especialidad" }, { status: 400 });

    // 1️⃣ Obtener legajos de médicos con esa especialidad
    const { data: medicosEsp, error: errMedEsp } = await supabase
      .from("medico_especialidad")
      .select("legajo_medico")
      .eq("id_especialidad", id_especialidad);

    if (errMedEsp) throw new Error(errMedEsp.message);
    const legajos = medicosEsp?.map(m => m.legajo_medico) || [];
    if (legajos.length === 0) return NextResponse.json([]);

    // 2️⃣ Agendas de esos médicos
    const { data: agendas, error: errAgendas } = await supabase
      .from("agenda")
      .select("id_agenda, legajo_medico, fechainiciovigencia, fechafinvigencia, duracionturno")
      .in("legajo_medico", legajos);

    if (errAgendas) throw new Error(errAgendas.message);

    // 3️⃣ Traer los días de semana correspondientes
    const agendaIds = agendas.map(a => a.id_agenda);
    const { data: dias, error: errDias } = await supabase
      .from("dia_semana")
      .select("id_agenda, dia_semana, hora_inicio, hora_fin")
      .in("id_agenda", agendaIds);

    if (errDias) throw new Error(errDias.message);

    // 4️⃣ Estructurar datos en el formato requerido
    const agendasData = agendas.map(a => ({
      legajo_medico : a.legajo_medico,
      fechainiciovigencia: a.fechainiciovigencia,
      fechafinvigencia: a.fechafinvigencia,
      duracionturno: a.duracionturno,
      dia_semana: dias
        .filter(d => d.id_agenda === a.id_agenda)
        .map(d => ({
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio,
          hora_fin: d.hora_fin,
        })),
    }));

    return NextResponse.json(agendasData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
