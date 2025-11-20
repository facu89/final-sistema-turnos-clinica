// // app/api/turnos/reasignar-nextday/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";
// import { sendAvisoReasignacion } from "@/hooks/email-resend-turno-reasignado";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
// );

// // ---------- Helpers de tiempo ----------
// const pad2 = (n: number) => String(n).padStart(2, "0");
// const dateOnly = (d: Date) =>
//   new Date(d.getFullYear(), d.getMonth(), d.getDate());

// const addDays = (d: Date, n: number) => {
//   const x = new Date(d);
//   x.setDate(x.getDate() + n);
//   return x;
// };

// const mkDateTime = (date: Date, hhmm: string) => {
//   const [h, m] = hhmm.split(":").map(Number);
//   const nd = new Date(date);
//   nd.setHours(h, m, 0, 0);
//   return nd;
// };

// const slotsBetween = (h1: string, h2: string, stepMin: number): string[] => {
//   const [H1, M1] = h1.split(":").map(Number);
//   const [H2, M2] = h2.split(":").map(Number);
//   const start = H1 * 60 + M1;
//   const end = H2 * 60 + M2;
//   const out: string[] = [];
//   for (let t = start; t + stepMin <= end; t += stepMin) {
//     out.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
//   }
//   return out;
// };

// // Normaliza "HH:MM:SS" a "HH:MM"
// const hhmm = (t: string) => {
//   const [h, m] = t.split(":");
//   return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
// };

// // Convierte "HH:MM:SS" a minutos (default 30')
// const timeToMinutes = (t: string | null | undefined): number => {
//   if (!t) return 30;
//   const [h, m] = t.split(":").map(Number);
//   return h * 60 + m;
// };

// // ---------- Tipos ----------
// type AgendaRow = {
//   id_agenda: number;
//   legajo_medico: number;
//   fechainiciovigencia: string;
//   fechafinvigencia: string;
//   duracionturno: string;
// };

// type DiaSemanaRow = {
//   id_agenda: number;
//   dia_semana: number;
//   hora_inicio: string;
//   hora_fin: string;
// };

// type TurnoSupabaseRow = {
//   cod_turno: number;
//   legajo_medico: number;
//   dni_paciente: string;
//   id_especialidad: number | null;
//   id_obra: number | null;
//   fecha_hora_turno: string;
//   estado_turno: string | null;
//   turno_pagado: boolean | null;
//   medico: {
//     legajo_medico: number;
//     nombre: string;
//     apellido: string;
//   };
//   profiles: {
//     dni_paciente: string;
//     nombre: string;
//     apellido: string;
//     email: string;
//   };
//   especialidad: {
//     descripcion: string;
//   };
// };

// // ---------- Acceso a agenda ----------
// async function getAgendaVigente(
//   legajo: number,
//   base: Date,
// ): Promise<AgendaRow | null> {
//   const { data, error } = await supabase
//     .from("agenda")
//     .select(
//       "id_agenda,legajo_medico,fechainiciovigencia,fechafinvigencia,duracionturno",
//     )
//     .eq("legajo_medico", legajo);

//   if (error) return null;
//   const rows = (data ?? []) as AgendaRow[];
//   if (!rows.length) return null;

//   const b = dateOnly(base);
//   const candidatas = rows.filter((a) => {
//     const ini = dateOnly(new Date(a.fechainiciovigencia));
//     const fin = dateOnly(new Date(a.fechafinvigencia));
//     return (b >= ini && b <= fin) || (ini > b);
//   });
//   if (!candidatas.length) return null;

//   const vigentes = candidatas.filter((a) => {
//     const ini = dateOnly(new Date(a.fechainiciovigencia));
//     const fin = dateOnly(new Date(a.fechafinvigencia));
//     return b >= ini && b <= fin;
//   });

//   const lista = (vigentes.length ? vigentes : candidatas).sort(
//     (a, b2) =>
//       new Date(a.fechainiciovigencia).getTime() -
//       new Date(b2.fechainiciovigencia).getTime(),
//   );
//   return lista[0];
// }

// async function getDiasSemanaAgenda(id_agenda: number): Promise<DiaSemanaRow[]> {
//   const { data, error } = await supabase
//     .from("dia_semana")
//     .select("id_agenda,dia_semana,hora_inicio,hora_fin")
//     .eq("id_agenda", id_agenda);

//   if (error) return [];
//   return (data ?? []) as DiaSemanaRow[];
// }

// async function nextWorkingDayForDoctor(
//   legajo: number,
//   base: Date,
// ): Promise<{
//   date: Date;
//   windows: { h1: string; h2: string; slot: number }[];
// }> {
//   let day = addDays(dateOnly(base), 1);

//   for (let i = 0; i < 60; i++) {
//     const agenda = await getAgendaVigente(legajo, day);
//     if (!agenda) {
//       day = addDays(day, 1);
//       continue;
//     }

//     const ini = dateOnly(new Date(agenda.fechainiciovigencia));
//     const fin = dateOnly(new Date(agenda.fechafinvigencia));
//     const d = dateOnly(day);
//     if (d < ini || d > fin) {
//       day = addDays(day, 1);
//       continue;
//     }

//     const dias = await getDiasSemanaAgenda(agenda.id_agenda);
//     if (!dias.length) {
//       day = addDays(day, 1);
//       continue;
//     }

//     // 0..6 (Dom..Sáb) -> 1..7 (Lun..Dom)
//     const wd1_7 = ((day.getDay() + 6) % 7) + 1;
//     const delDia = dias.filter((x) => x.dia_semana === wd1_7);
//     if (!delDia.length) {
//       day = addDays(day, 1);
//       continue;
//     }

//     const slot = Math.max(1, timeToMinutes(agenda.duracionturno));
//     const windows = delDia.map((x) => ({
//       h1: hhmm(x.hora_inicio),
//       h2: hhmm(x.hora_fin),
//       slot,
//     }));

//     return { date: day, windows };
//   }

//   throw new Error(
//     "No se encontró un día hábil según la agenda del médico en los próximos 60 días",
//   );
// }

// // ---------- Ocupados del día ----------
// async function getOcupados(legajo: number, date: Date): Promise<Set<string>> {
//   const ini = new Date(date);
//   ini.setHours(0, 0, 0, 0);
//   const fin = new Date(date);
//   fin.setHours(23, 59, 59, 999);

//   const { data, error } = await supabase
//     .from("turno")
//     .select("fecha_hora_turno")
//     .eq("legajo_medico", legajo)
//     .gte("fecha_hora_turno", ini.toISOString())
//     .lte("fecha_hora_turno", fin.toISOString());

//   if (error) throw error;

//   const set = new Set<string>();
//   (data ?? []).forEach((t: any) => {
//     const dt = new Date(t.fecha_hora_turno);
//     set.add(`${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`);
//   });
//   return set;
// }

// // ---------- Handler ----------
// export async function POST(req: NextRequest) {
//   try {
//     const { ids } = (await req.json()) as { ids: (number | string)[] };
//     if (!Array.isArray(ids) || ids.length === 0) {
//       return NextResponse.json({ error: "Debés enviar ids: number[]" }, {
//         status: 400,
//       });
//     }

//     // Consulta tipada directamente
//     const { data: turnos, error: selErr } = await supabase
//       .from("turno")
//       .select(`
//         cod_turno,
//         legajo_medico,
//         dni_paciente,
//         id_especialidad,
//         id_obra,
//         fecha_hora_turno,
//         estado_turno,
//         turno_pagado,
//         medico(legajo_medico, nombre, apellido),
//         profiles(dni_paciente, nombre, apellido, email),
//         especialidad(descripcion)
//       `)
//       .in("cod_turno", ids.map(Number))
//       .returns<TurnoSupabaseRow[]>();

//     if (selErr) {
//       return NextResponse.json({ error: selErr.message }, { status: 500 });
//     }

//     if (!turnos || turnos.length === 0) {
//       return NextResponse.json({ success: true, resultados: [] });
//     }

//     // Ahora 'turnos' ya tiene el tipo correcto automáticamente
//     turnos.sort(
//       (a, b) =>
//         a.legajo_medico - b.legajo_medico ||
//         new Date(a.fecha_hora_turno).getTime() -
//           new Date(b.fecha_hora_turno).getTime(),
//     );

//     // Agrupar por médico
//     const porMedico = new Map<number, TurnoSupabaseRow[]>();
//     for (const t of turnos) {
//       const key = t.legajo_medico;
//       const list = porMedico.get(key) ?? [];
//       list.push(t);
//       porMedico.set(key, list);
//     }

//     const resultados: Array<{ id: number; nuevo?: number; error?: string }> =
//       [];
//     const agendaFailIds: number[] = [];

//     for (const [legajo, lista] of porMedico.entries()) {
//       // Base = mayor fecha entre los seleccionados (o now)
//       const base = lista.reduce((max, t) => {
//         const ft = new Date(t.fecha_hora_turno);
//         return ft > max ? ft : max;
//       }, new Date());

//       // Primer día hábil según agenda (manejar casos sin agenda)
//       let targetDay: Date | null = null;
//       let windows: { h1: string; h2: string; slot: number }[] = [];

//       try {
//         const r = await nextWorkingDayForDoctor(legajo, base);
//         targetDay = r.date;
//         windows = r.windows;
//       } catch {
//         const idsFallidos = lista.map((x) => x.cod_turno);
//         agendaFailIds.push(...idsFallidos);
//         idsFallidos.forEach((id) => {
//           resultados.push({
//             id,
//             error:
//               "No se encontró un día hábil según la agenda del médico en los próximos 60 días",
//           });
//         });
//         continue;
//       }

//       // Generar slots del día
//       let candidatos: string[] = [];
//       windows.forEach((w) => {
//         candidatos.push(...slotsBetween(w.h1, w.h2, w.slot));
//       });

//       // Quitar ocupados
//       const taken = await getOcupados(legajo, targetDay!);
//       candidatos = candidatos.filter((h) => !taken.has(h));

//       // Asignar en estricto orden
//       let idx = 0;
//       for (const t of lista) {
//         console.log("Turno completo:", t);
//         console.log("DNI desde profiles:", t.profiles.dni_paciente);

//         if (idx >= candidatos.length) {
//           resultados.push({
//             id: t.cod_turno,
//             error: "No hay más huecos libres ese día",
//           });
//           continue;
//         }

//         const hhmmSlot = candidatos[idx+2];
//         const nuevaFecha = mkDateTime(targetDay!, hhmmSlot).toISOString();
//         console.log(nuevaFecha,hhmmSlot);
//         // Guardar estado ORIGINAL antes de modificar el turno viejo
//         const estadoOriginal = t.estado_turno ?? "Pendiente";

//         // 1) marcar original como Reasignado
//         const { error: upErr } = await supabase
//           .from("turno")
//           .update({ estado_turno: "Reasignado" })
//           .eq("cod_turno", t.cod_turno);

//         if (upErr) {
//           resultados.push({ id: t.cod_turno, error: upErr.message });
//           continue;
//         }

//         // 2) crear nuevo turno heredando el estado original
//         const nuevoTurno = {
//           legajo_medico: legajo,
//           dni_paciente: t.profiles.dni_paciente, // ✅ Acceso directo sin casting
//           id_especialidad: t.id_especialidad,
//           id_obra: t.id_obra,
//           fecha_hora_turno: nuevaFecha,
//           estado_turno: estadoOriginal,
//           turno_pagado: t.turno_pagado ?? false,
//         };

//         console.log("Nuevo turno a insertar:", nuevoTurno);
//         const envio = await sendAvisoReasignacion({
//           nombre_paciente: t.profiles.nombre,
//           apellido_paciente: t.profiles.apellido,
//           nombre_medico: t.medico.nombre,
//           especialidad: t.especialidad.descripcion,
//           fecha_turno_nuevo: new Date(t.fecha_hora_turno),
//           email_paciente: t.profiles.email,
//         });
//         const { data: ins, error: insErr } = await supabase
//           .from("turno")
//           .insert(nuevoTurno)
//           .select("cod_turno")
//           .single();

//         if (insErr) {
//           console.error("Error al insertar:", insErr);
//           resultados.push({ id: t.cod_turno, error: insErr.message });
//         } else {
//           resultados.push({ id: t.cod_turno, nuevo: ins?.cod_turno });
//           // Reservar el slot dentro del mismo batch
//           taken.add(hhmmSlot);
//         }
//       }
//     }

//     // Mensaje agregado para mostrar arriba (opcional en el front)
//     const agendaFailMessage = agendaFailIds.length > 0
//       ? `No se encontró un día hábil según la agenda del médico en los próximos 60 días para los siguientes turnos: ${
//         agendaFailIds
//           .map((id) => `#${id}`)
//           .join(", ")
//       }`
//       : undefined;

//     return NextResponse.json({
//       success: true,
//       resultados,
//       agendaFailIds,
//       agendaFailMessage,
//     });
//   } catch (e: any) {
//     console.error("reasignar-administrativo error:", e);
//     return NextResponse.json({ error: e?.message ?? "Error interno" }, {
//       status: 500,
//     });
//   }
// }
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

// ⬇️ NUEVO — genera fecha local sin conversión a UTC
const mkDateTime = (date: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);

  const y = date.getFullYear();
  const mo = pad2(date.getMonth() + 1);
  const da = pad2(date.getDate());
  const hh = pad2(h);
  const mm = pad2(m);

  // Crea fecha local explícita en -03:00
  return new Date(`${y}-${mo}-${da}T${hh}:${mm}:00-03:00`);
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
    "No se encontró un día hábil según la agenda del médico en los próximos 60 días",
  );
}

// ---------- Ocupados del día ----------
async function getOcupados(legajo: number, date: Date): Promise<Set<string>> {
  const ini = new Date(date);
  ini.setHours(0, 0, 0, 0);
  const fin = new Date(date);
  fin.setHours(23, 59, 59, 999);

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
      return NextResponse.json({ error: "Debés enviar ids: number[]" }, {
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
              "No se encontró un día hábil según la agenda del médico en los próximos 60 días",
          });
        });
        continue;
      }

      let candidatos: string[] = [];
      windows.forEach((w) => {
        candidatos.push(...slotsBetween(w.h1, w.h2, w.slot));
      });
      console.log("cantidatos antes de filtrar:", candidatos);
      const taken = await getOcupados(legajo, targetDay!);
      console.log("ocupados", taken);
      candidatos = candidatos.filter((h) => !taken.has(h));
      console.log("candidatos despues de filtrar:", candidatos);
      let idx = 0;
      for (const t of lista) {
        if (idx + 1 >= candidatos.length) {
          resultados.push({
            id: t.cod_turno,
            error: "No hay más huecos libres ese día",
          });
          continue;
        }

        const hhmmSlot = candidatos[idx + 1];
        const nuevaFecha = mkDateTime(targetDay!, hhmmSlot);

        const estadoOriginal = t.estado_turno ?? "Pendiente";

        const { error: upErr } = await supabase
          .from("turno")
          .update({ estado_turno: "Reasignado" })
          .eq("cod_turno", t.cod_turno);

        if (upErr) {
          resultados.push({ id: t.cod_turno, error: upErr.message });
          continue;
        }

        const nuevoTurno = {
          legajo_medico: legajo,
          dni_paciente: t.profiles.dni_paciente,
          id_especialidad: t.id_especialidad,
          id_obra: t.id_obra,
          fecha_hora_turno: nuevaFecha,
          estado_turno: estadoOriginal,
          turno_pagado: t.turno_pagado ?? false,
        };
        console.log(estadoOriginal, nuevoTurno);

        await sendAvisoReasignacion({
          nombre_paciente: t.profiles.nombre,
          apellido_paciente: t.profiles.apellido,
          nombre_medico: t.medico.nombre,
          especialidad: t.especialidad.descripcion,
          fecha_turno_nuevo: new Date(
            new Date(nuevaFecha).getTime() + 3 * 60 * 60 * 1000,
          ),
          email_paciente: t.profiles.email,
        });

        const { data: ins, error: insErr } = await supabase
          .from("turno")
          .insert(nuevoTurno)
          .select("cod_turno")
          .single();

        if (insErr) {
          resultados.push({ id: t.cod_turno, error: insErr.message });
        } else {
          resultados.push({ id: t.cod_turno, nuevo: ins?.cod_turno });
          taken.add(hhmmSlot);
        }

        idx = idx + 2;
      }
    }

    const agendaFailMessage = agendaFailIds.length > 0
      ? `No se encontró un día hábil según la agenda del médico en los próximos 60 días para los siguientes turnos: ${
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
