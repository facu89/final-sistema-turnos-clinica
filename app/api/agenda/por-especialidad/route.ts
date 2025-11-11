import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface AgendaConMedico {
  id_agenda: number;
  legajo_medico: number;
  fechainiciovigencia: string;
  fechafinvigencia: string;
  duracionturno: string;
  medico: {
    nombre: string;
    apellido: string;
    especialidad: { descripcion: string }[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_especialidad = searchParams.get("id_especialidad");
    if (!id_especialidad) {
      return NextResponse.json({ error: "Falta id_especialidad" }, {
        status: 400,
      });
    }

    const { data: medicosEsp, error: errMedEsp } = await supabase
      .from("medico_especialidad")
      .select("legajo_medico")
      .eq("id_especialidad", id_especialidad);

    if (errMedEsp) throw new Error(errMedEsp.message);
    const legajos = medicosEsp?.map((m) => m.legajo_medico) || [];
    if (legajos.length === 0) return NextResponse.json([]);

    const { data: agendas, error: errAgendas } = await supabase
      .from("agenda")
      .select(
        "id_agenda, legajo_medico, fechainiciovigencia, fechafinvigencia, duracionturno, medico:legajo_medico(nombre,apellido, especialidad(descripcion))",
      )
      .in("legajo_medico", legajos)
      .returns<AgendaConMedico[]>();
    if (errAgendas) throw new Error(errAgendas.message);

    const agendaIds = agendas.map((a) => a.id_agenda);
    const { data: dias, error: errDias } = await supabase
      .from("dia_semana")
      .select("id_agenda, dia_semana, hora_inicio, hora_fin")
      .in("id_agenda", agendaIds);

    if (errDias) throw new Error(errDias.message);

    const agendasData = agendas.map((a) => ({
      legajo_medico: a.legajo_medico,
      nombre_medico: a.medico?.nombre,
      apellido_medico: a.medico?.apellido,
      nombre_especialidad: a.medico?.especialidad?.[0]?.descripcion,
      fechainiciovigencia: a.fechainiciovigencia,
      fechafinvigencia: a.fechafinvigencia,
      duracionturno: a.duracionturno,
      dia_semana: dias
        .filter((d) => d.id_agenda === a.id_agenda)
        .map((d) => ({
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio,
          hora_fin: d.hora_fin,
        })),
    }));

    return NextResponse.json(agendasData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, {
      status: 500,
    });
  }
}
