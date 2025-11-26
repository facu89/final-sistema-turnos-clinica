// app/api/turnos/reasignar-nextday/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAvisoReasignacion } from "@/hooks/email-resend-turno-reasignado";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------- Helpers de tiempo ----------
const pad2 = (n: number) => String(n).padStart(2, "0");
const dateOnly = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const mkDateTime = (date: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);

  // Crear fecha en UTC para evitar problemas de zona horaria
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const nd = new Date(Date.UTC(year, month, day, h, m, 0, 0));
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
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

const timeToMinutes = (t: string | null | undefined): number => {
  if (!t) return 30;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// ---------- Tipos ----------
type AgendaRow = {
  id_agenda: number;
  legajo_medico: number;
  fechainiciovigencia: string;
  fechafinvigencia: string;
  duracionturno: string;
};

type DiaSemanaRow = {
  id_agenda: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

type TurnoSupabaseRow = {
  cod_turno: number;
  legajo_medico: number;
  dni_paciente: string;
  id_especialidad: number | null;
  id_obra: number | null;
  fecha_hora_turno: string;
  estado_turno: string | null;
  turno_pagado: boolean | null;
  medico: {
    legajo_medico: number;
    nombre: string;
    apellido: string;
  };
  profiles: {
    dni_paciente: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  especialidad: {
    descripcion: string;
  };
};

// ---------- Acceso a agenda ----------
async function getAgendaVigente(
  legajo: number,
  base: Date,
): Promise<AgendaRow | null> {
  const { data, error } = await supabase
    .from("agenda")
    .select(
      "id_agenda,legajo_medico,fechainiciovigencia,fechafinvigencia,duracionturno",
    )
    .eq("legajo_medico", legajo);

  if (error) return null;
  const rows = (data ?? []) as AgendaRow[];
  if (!rows.length) return null;

  const b = dateOnly(base);
  const candidatas = rows.filter((a) => {
    const ini = dateOnly(new Date(a.fechainiciovigencia));
    const fin = dateOnly(new Date(a.fechafinvigencia));
    return (b >= ini && b <= fin) || (ini > b);
  });
  if (!candidatas.length) return null;

  const vigentes = candidatas.filter((a) => {
    const ini = dateOnly(new Date(a.fechainiciovigencia));
    const fin = dateOnly(new Date(a.fechafinvigencia));
    return b >= ini && b <= fin;
  });

  const lista = (vigentes.length ? vigentes : candidatas).sort(
    (a, b2) =>
      new Date(a.fechainiciovigencia).getTime() -
      new Date(b2.fechainiciovigencia).getTime(),
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

async function nextWorkingDayForDoctor(
  legajo: number,
  base: Date,
): Promise<{
  date: Date;
  windows: { h1: string; h2: string; slot: number }[];
}> {
  

  let day = addDays(dateOnly(base), 1);
  

  for (let i = 0; i < 60; i++) {
  

    const agenda = await getAgendaVigente(legajo, day);
    if (!agenda) {
      day = addDays(day, 1);
      continue;
    }

  

    const ini = dateOnly(new Date(agenda.fechainiciovigencia));
    const fin = dateOnly(new Date(agenda.fechafinvigencia));
    const d = dateOnly(day);



    if (d < ini || d > fin) {
      day = addDays(day, 1);
      continue;
    }

    const dias = await getDiasSemanaAgenda(agenda.id_agenda);
    if (!dias.length) {
      day = addDays(day, 1);
      continue;
    }

    const wd1_7 = ((day.getDay() + 6) % 7) + 1;
    
    const delDia = dias.filter((x) => x.dia_semana === wd1_7);
    
    if (!delDia.length) {
     
      day = addDays(day, 1);
      continue;
    }

    const slot = Math.max(1, timeToMinutes(agenda.duracionturno));
    const windows = delDia.map((x) => ({
      h1: hhmm(x.hora_inicio),
      h2: hhmm(x.hora_fin),
      slot,
    }));


    return { date: day, windows };
  }

  
  throw new Error(
    "No se encontr&oacute; un d&iacute;a h&aacute;bil seg&uacute;n la agenda del m&eacute;dico en los pr&oacute;ximos 60 d&iacute;as",
  );
}

// ---------- Ocupados del d&iacute;a - VERSIÓN FINAL CORREGIDA ----------
async function getOcupados(legajo: number, date: Date): Promise<Set<string>> {
  const ini = new Date(date);
  ini.setUTCHours(0, 0, 0, 0);
  const fin = new Date(date);
  fin.setUTCHours(23, 59, 59, 999);

  await new Promise((resolve) => setTimeout(resolve, 200));

  const { data, error } = await supabase
    .from("turno")
    .select("fecha_hora_turno, estado_turno, cod_turno")
    .eq("legajo_medico", legajo)
    .gte("fecha_hora_turno", ini.toISOString())
    .lte("fecha_hora_turno", fin.toISOString())
    .neq("estado_turno", "Reasignado")
    .order("fecha_hora_turno", { ascending: true });

  if (error) {
    console.error("Error getting ocupados:", error);
    throw error;
  }

  const set = new Set<string>();

  (data ?? []).forEach((t: any) => {
    const dt = new Date(t.fecha_hora_turno);

    const horaUTC = `${pad2(dt.getUTCHours())}:${pad2(dt.getUTCMinutes())}`;
    const horaLocal = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;

    const argentinaDate = new Date(dt.getTime() - (3 * 60 * 60 * 1000));
    const horaArgentina = `${pad2(argentinaDate.getUTCHours())}:${
      pad2(argentinaDate.getUTCMinutes())
    }`;

    set.add(horaArgentina);

   
  });

 
  return set;
}

// ---------- Handler ----------
export async function POST(req: NextRequest) {
  try {
    const { ids } = (await req.json()) as { ids: (number | string)[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Deb&eacute;s enviar ids: number[]" }, {
        status: 400,
      });
    }

    const { data: turnos, error: selErr } = await supabase
      .from("turno")
      .select(`
        cod_turno,
        legajo_medico,
        dni_paciente,
        id_especialidad,
        id_obra,
        fecha_hora_turno,
        estado_turno,
        turno_pagado,
        medico(legajo_medico, nombre, apellido),
        profiles(dni_paciente, nombre, apellido, email),
        especialidad(descripcion)
      `)
      .in("cod_turno", ids.map(Number))
      .returns<TurnoSupabaseRow[]>();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (!turnos || turnos.length === 0) {
      return NextResponse.json({ success: true, resultados: [] });
    }

    turnos.sort(
      (a, b) =>
        a.legajo_medico - b.legajo_medico ||
        new Date(a.fecha_hora_turno).getTime() -
          new Date(b.fecha_hora_turno).getTime(),
    );

    const porMedico = new Map<number, TurnoSupabaseRow[]>();
    for (const t of turnos) {
      const key = t.legajo_medico;
      const list = porMedico.get(key) ?? [];
      list.push(t);
      porMedico.set(key, list);
    }

    const resultados: Array<{ id: number; nuevo?: number; error?: string }> =
      [];
    const agendaFailIds: number[] = [];

    for (const [legajo, lista] of porMedico.entries()) {
      const base = lista.reduce((max, t) => {
        const ft = new Date(t.fecha_hora_turno);
        return ft > max ? ft : max;
      }, new Date());

      let targetDay: Date | null = null;
      let windows: { h1: string; h2: string; slot: number }[] = [];

      try {
        const r = await nextWorkingDayForDoctor(legajo, base);
        targetDay = r.date;
        windows = r.windows;
      } catch {
        const idsFallidos = lista.map((x) => x.cod_turno);
        agendaFailIds.push(...idsFallidos);
        idsFallidos.forEach((id) => {
          resultados.push({
            id,
            error:
              "No se encontró un dia habil según la agenda del médico en los próximos 60 días",
          });
        });
        continue;
      }

   
      let taken = await getOcupados(legajo, targetDay!);

      // Generar slots del día
      let candidatos: string[] = [];
      windows.forEach((w) => {
        candidatos.push(...slotsBetween(w.h1, w.h2, w.slot));
      });

      candidatos = candidatos.filter((h) => !taken.has(h));

      if (candidatos.length === 0) {
        lista.forEach((t) => {
          resultados.push({
            id: t.cod_turno,
            error: "No hay huecos libres ese día",
          });
        });
        continue;
      }

      let idx = 0;
      for (const t of lista) {

        taken = await getOcupados(legajo, targetDay!);

        candidatos = [];
        windows.forEach((w) => {
          candidatos.push(...slotsBetween(w.h1, w.h2, w.slot));
        });
        candidatos = candidatos.filter((h) => !taken.has(h));

        if (idx >= candidatos.length) {
          idx = 0; // Empezar desde el principio con los nuevos candidatos
        }

        // Verificar que aún hay candidatos
        if (candidatos.length === 0) {
          resultados.push({
            id: t.cod_turno,
            error: "No hay más huecos libres ese día",
          });
          continue;
        }

        while (idx < candidatos.length && taken.has(candidatos[idx])) {
          idx++;
        }

        if (idx >= candidatos.length) {
          resultados.push({
            id: t.cod_turno,
            error: "No hay más slots disponibles",
          });
          continue;
        }

        const hhmmSlot = candidatos[idx];
   
        const nuevaFecha = mkDateTime(targetDay!, hhmmSlot);
        const horaVerificacion = `${pad2(nuevaFecha.getUTCHours())}:${
          pad2(nuevaFecha.getUTCMinutes())
        }`;

       
        if (taken.has(horaVerificacion)) {
         
          // Saltar al siguiente slot
          idx++;
          continue; // Reintentar con el siguiente slot
        }

        const estadoOriginal = t.estado_turno ?? "Pendiente";

        // Marcar original como reasignado
        const { error: upErr } = await supabase
          .from("turno")
          .update({ estado_turno: "Reasignado" })
          .eq("cod_turno", t.cod_turno);

        if (upErr) {
          console.error(`❌ Error actualizando turno ${t.cod_turno}:`, upErr);
          resultados.push({ id: t.cod_turno, error: upErr.message });
          continue;
        }

        const nuevoTurno = {
          legajo_medico: legajo,
          dni_paciente: t.profiles.dni_paciente,
          id_especialidad: t.id_especialidad,
          id_obra: t.id_obra,
          fecha_hora_turno: nuevaFecha.toISOString(),
          estado_turno: estadoOriginal,
          turno_pagado: t.turno_pagado ?? false,
        };


        // Insertar nuevo turno
        const { data: ins, error: insErr } = await supabase
          .from("turno")
          .insert(nuevoTurno)
          .select("cod_turno")
          .single();

        if (insErr) {
          console.error("❌ Error al insertar:", insErr);
          resultados.push({ id: t.cod_turno, error: insErr.message });
        } else {
          
          resultados.push({ id: t.cod_turno, nuevo: ins?.cod_turno });

          taken.add(horaVerificacion);
        //sumarle 3 horas para ajustar a horario de Argentina mi patria querida
          const nuevaFechaArg = new Date(nuevaFecha.getTime() + (3 * 60 * 60 * 1000));
          // Enviar notificación
          try {
            await sendAvisoReasignacion({
              nombre_paciente: t.profiles.nombre,
              apellido_paciente: t.profiles.apellido,
              nombre_medico: t.medico.nombre,
              especialidad: t.especialidad.descripcion,
              fecha_turno_nuevo: nuevaFechaArg,
              email_paciente: t.profiles.email,
            });
          } catch (emailError) {
            console.error(
              `❌ Error enviando email para turno ${t.cod_turno}:`,
              emailError,
            );
          }
        }

        idx++; 
      }
    }

    // Mensaje agregado para mostrar arriba (opcional en el front)
    const agendaFailMessage = agendaFailIds.length > 0
      ? `No se encontr&oacute; un d&iacute;a h&aacute;bil seg&uacute;n la agenda del m&eacute;dico en los pr&oacute;ximos 60 d&iacute;as para los siguientes turnos: ${
        agendaFailIds.map((id) => `#${id}`).join(", ")
      }`
      : undefined;

    return NextResponse.json({
      success: true,
      resultados,
      agendaFailIds,
      agendaFailMessage,
    });
  } catch (e: any) {
    console.error("reasignar-administrativo error:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, {
      status: 500,
    });
  }
}
