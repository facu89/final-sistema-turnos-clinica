// app/api/turnos/reasignar-nextday/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------- Helpers de tiempo ----------
const pad2 = (n: number) => String(n).padStart(2, "0");
const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const mkDateTime = (date: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const nd = new Date(date);
  nd.setHours(h, m, 0, 0);
  return nd;
};

const slotsBetween = (h1: string, h2: string, stepMin: number): string[] => {
  const [H1, M1] = h1.split(":").map(Number);
  const [H2, M2] = h2.split(":").map(Number);
  const start = H1 * 60 + M1;
  const end = H2 * 60 + M2;
  const out: string[] = [];
  for (let t = start; t + stepMin <= end; t += stepMin) {
    out.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
  }
  return out;
};

// Normaliza "HH:MM:SS" a "HH:MM"
const hhmm = (t: string) => {
  const [h, m] = t.split(":");
  return `${pad2(Number(h))}:${pad2(Number(m))}`;
};

// Convierte "HH:MM:SS" a minutos (default 30')
const timeToMinutes = (t: string | null | undefined): number => {
  if (!t) return 30;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// ---------- Tipos ----------
type TurnoRow = {
  cod_turno: number;
  legajo_medico: number | string;
  dni_paciente: string;
  id_especialidad: number | null;
  id_obra: number | null;
  fecha_hora_turno: string;
  estado_turno: string;
  turno_pagado: boolean | null;
};

type AgendaRow = {
  id_agenda: number;
  legajo_medico: number;
  fechainiciovigencia: string;  // "yyyy-mm-dd"
  fechafinvigencia: string;     // "yyyy-mm-dd"
  duracionturno: string | null; // "HH:MM:SS"
};

type DiaSemanaRow = {
  id_agenda: number;
  dia_semana: number;   // 1..7 (Lun..Dom)
  hora_inicio: string;  // "HH:MM:SS"
  hora_fin: string;     // "HH:MM:SS"
};

// ---------- Acceso a agenda ----------
async function getAgendaVigente(legajo: number, base: Date): Promise<AgendaRow | null> {
  const { data, error } = await supabase
    .from("agenda")
    .select("id_agenda,legajo_medico,fechainiciovigencia,fechafinvigencia,duracionturno")
    .eq("legajo_medico", legajo);

  if (error) return null;
  const rows = (data ?? []) as AgendaRow[];
  if (!rows.length) return null;

  const b = dateOnly(base);
  const candidatas = rows.filter(a => {
    const ini = dateOnly(new Date(a.fechainiciovigencia));
    const fin = dateOnly(new Date(a.fechafinvigencia));
    return (b >= ini && b <= fin) || (ini > b);
  });
  if (!candidatas.length) return null;

  const vigentes = candidatas.filter(a => {
    const ini = dateOnly(new Date(a.fechainiciovigencia));
    const fin = dateOnly(new Date(a.fechafinvigencia));
    return b >= ini && b <= fin;
  });

  const lista = (vigentes.length ? vigentes : candidatas).sort(
    (a, b2) => new Date(a.fechainiciovigencia).getTime() - new Date(b2.fechainiciovigencia).getTime()
  );
  return lista[0];
}

async function getDiasSemanaAgenda(id_agenda: number): Promise<DiaSemanaRow[]> {
  const { data, error } = await supabase
    .from("dia_semana")
    .select("id_agenda,dia_semana,hora_inicio,hora_fin")
    .eq("id_agenda", id_agenda);

  if (error) return [];
  return (data ?? []) as DiaSemanaRow[];
}

/** Primer día siguiente que el médico atiende, respetando agenda, vigencia y días (1..7 Lun..Dom) */
async function nextWorkingDayForDoctor(
  legajo: number,
  base: Date
): Promise<{ date: Date; windows: { h1: string; h2: string; slot: number }[] }> {
  let day = addDays(dateOnly(base), 1);

  for (let i = 0; i < 60; i++) {
    const agenda = await getAgendaVigente(legajo, day);
    if (!agenda) { day = addDays(day, 1); continue; }

    const ini = dateOnly(new Date(agenda.fechainiciovigencia));
    const fin = dateOnly(new Date(agenda.fechafinvigencia));
    const d = dateOnly(day);
    if (d < ini || d > fin) { day = addDays(day, 1); continue; }

    const dias = await getDiasSemanaAgenda(agenda.id_agenda);
    if (!dias.length) { day = addDays(day, 1); continue; }

    // 0..6 (Dom..Sáb) -> 1..7 (Lun..Dom)
    const wd1_7 = ((d.getDay() + 6) % 7) + 1;
    const delDia = dias.filter(x => x.dia_semana === wd1_7);
    if (!delDia.length) { day = addDays(day, 1); continue; }

    const slot = Math.max(1, timeToMinutes(agenda.duracionturno));
    const windows = delDia.map(x => ({
      h1: hhmm(x.hora_inicio),
      h2: hhmm(x.hora_fin),
      slot
    }));

    return { date: d, windows };
  }

  throw new Error("No se encontró un día hábil según la agenda del médico en los próximos 60 días");
}

// ---------- Ocupados del día ----------
async function getOcupados(legajo: number, date: Date): Promise<Set<string>> {
  const ini = new Date(date); ini.setHours(0, 0, 0, 0);
  const fin = new Date(date); fin.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("turno")
    .select("fecha_hora_turno")
    .eq("legajo_medico", legajo)
    .gte("fecha_hora_turno", ini.toISOString())
    .lte("fecha_hora_turno", fin.toISOString());

  if (error) throw error;

  const set = new Set<string>();
  (data ?? []).forEach((t: any) => {
    const dt = new Date(t.fecha_hora_turno);
    set.add(`${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`);
  });
  return set;
}

// ---------- Handler ----------
export async function POST(req: NextRequest) {
  try {
    const { ids } = (await req.json()) as { ids: (number | string)[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Debés enviar ids: number[]" }, { status: 400 });
    }

    const { data: rows, error: selErr } = await supabase
      .from("turno")
      .select("cod_turno,legajo_medico,dni_paciente,id_especialidad,id_obra,fecha_hora_turno,estado_turno,turno_pagado")
      .in("cod_turno", ids.map(Number));

    if (selErr) throw selErr;

    const turnos = (rows ?? []) as TurnoRow[];
    if (turnos.length === 0) {
      return NextResponse.json({ success: true, resultados: [] });
    }

    // Orden correlativo por médico y fecha
    turnos.sort(
      (a, b) =>
        Number(a.legajo_medico) - Number(b.legajo_medico) ||
        new Date(a.fecha_hora_turno).getTime() - new Date(b.fecha_hora_turno).getTime()
    );

    // Agrupar por médico
    const porMedico = new Map<number, TurnoRow[]>();
    for (const t of turnos) {
      const key = Number(t.legajo_medico);
      const list = porMedico.get(key) ?? [];
      list.push(t);
      porMedico.set(key, list);
    }

    const resultados: Array<{ id: number; nuevo?: number; error?: string }> = [];

    for (const [legajo, lista] of porMedico.entries()) {
      // Base = mayor fecha entre los seleccionados (o now)
      const base = lista.reduce((max, t) => {
        const ft = new Date(t.fecha_hora_turno);
        return ft > max ? ft : max;
      }, new Date());

      // Primer día hábil según agenda
      const { date: targetDay, windows } = await nextWorkingDayForDoctor(legajo, base);

      // Generar slots del día
      let candidatos: string[] = [];
      windows.forEach(w => {
        candidatos.push(...slotsBetween(w.h1, w.h2, w.slot));
      });

      // Quitar ocupados
      const taken = await getOcupados(legajo, targetDay);
      candidatos = candidatos.filter(h => !taken.has(h));

      // Asignar en estricto orden
      let idx = 0;
      for (const t of lista) {
        if (idx >= candidatos.length) {
          resultados.push({ id: t.cod_turno, error: "No hay más huecos libres ese día" });
          continue;
        }

        const hhmmSlot = candidatos[idx++];
        const nuevaFecha = mkDateTime(targetDay, hhmmSlot).toISOString();

        // Guardar estado ORIGINAL antes de modificar el turno viejo
        const estadoOriginal = t.estado_turno ?? "Pendiente";

        // 1) marcar original como Reasignado
        const { error: upErr } = await supabase
          .from("turno")
          .update({ estado_turno: "Reasignado" })
          .eq("cod_turno", t.cod_turno);

        if (upErr) {
          resultados.push({ id: t.cod_turno, error: upErr.message });
          continue;
        }

        // 2) crear nuevo turno heredando el estado original
        const nuevoTurno = {
          legajo_medico: legajo,
          dni_paciente: t.dni_paciente,
          id_especialidad: t.id_especialidad,
          id_obra: t.id_obra,
          fecha_hora_turno: nuevaFecha,
          estado_turno: estadoOriginal, // clave: mantiene el estado previo (ej. "Reservado")
          turno_pagado: t.turno_pagado ?? false,
        };

        const { data: ins, error: insErr } = await supabase
          .from("turno")
          .insert(nuevoTurno)
          .select("cod_turno")
          .single();

        if (insErr) {
          resultados.push({ id: t.cod_turno, error: insErr.message });
        } else {
          resultados.push({ id: t.cod_turno, nuevo: ins?.cod_turno });
          // Reservar el slot dentro del mismo batch
          taken.add(hhmmSlot);
        }
      }
    }

    return NextResponse.json({ success: true, resultados });
  } catch (e: any) {
    console.error("reasignar-nextday error:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}

