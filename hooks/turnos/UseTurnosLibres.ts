"use client";
import { useState, useEffect, useRef } from "react";

interface DiaSemana {
  dia_semana: number; // 1=Lunes ... 7=Domingo
  hora_inicio: string; // formato "HH:MM" o "HH:MM:SS"
  hora_fin: string;    // formato "HH:MM" o "HH:MM:SS"
}

interface Agenda {
  fechainiciovigencia: string;
  fechafinvigencia: string;
  duracionturno: string | number;
  legajo_medico: number;
  dia_semana: DiaSemana[];
}

interface TurnoBody {
  legajo_medico: number;
  fecha_hora_turno: string | Date;
}

interface TurnoLibre {
  iso: string;
  legajo_medico: number;
  id_especialidad: number;

}



export function useTurnosLibres(especialidad: number, legajoMedico?: number) {
  const [libres, setLibres] = useState<TurnoLibre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esp = useRef<number>(0);

  //  Buscar turnos por médico específico
  useEffect(() => {
    if (!legajoMedico) return;

    const fetchDatosMedico = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener la agenda del médico
        const resAgenda = await fetch(`/api/agenda?legajo_medico=${legajoMedico}`);
        const jsonAgenda = await resAgenda.json();
        if (!resAgenda.ok) throw new Error(jsonAgenda.error || "Error al cargar agenda");

        const agenda: Agenda | null =
  Array.isArray(jsonAgenda)
    ? jsonAgenda[0]
    : jsonAgenda.agenda || jsonAgenda.medico?.agenda || null;

if (!agenda) {
  console.warn(" No se encontró agenda válida", jsonAgenda);
  setLibres([]);
  return;
}

        // Obtener turnos ocupados de ese médico
        const resTurnos = await fetch(
          `/api/turnos/por-medico?legajo_medico=${legajoMedico}`,
          { cache: "no-store" }
        );
        const jsonTurnos = await resTurnos.json();
        if (!resTurnos.ok) throw new Error(jsonTurnos.error || "Error al cargar turnos");

        const turnosOcupados: TurnoBody[] = Array.isArray(jsonTurnos) ? jsonTurnos : [];

        // Generar los turnos libres
        const libresMedico = generarTurnosLibres([agenda], turnosOcupados).map((iso) => ({
          iso,
          legajo_medico: legajoMedico,
          id_especialidad:especialidad,
        }));

        setLibres(libresMedico);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatosMedico();
  }, [legajoMedico]);

  //  Buscar turnos por especialidad (todos los médicos)
  useEffect(() => {
    if (!especialidad || legajoMedico) return;
    if (especialidad === esp.current) return;

    esp.current = especialidad;

    const fetchDatosEspecialidad = async () => {
      try {
        setLoading(true);
        setError(null);

        //  Obtener agendas de todos los médicos de esa especialidad
        const resAgendas = await fetch(
          `/api/agenda/por-especialidad?id_especialidad=${encodeURIComponent(
            especialidad
          )}`
        );
        const jsonAgendas = await resAgendas.json();
        if (!resAgendas.ok) throw new Error(jsonAgendas.error || "Error al obtener agendas");
        const agendasData: Agenda[] = Array.isArray(jsonAgendas) ? jsonAgendas : [];

        //  Obtener turnos ocupados de esa especialidad
        const resTurnos = await fetch(
          `/api/turnos/por-especialidad?id_especialidad=${encodeURIComponent(
            especialidad
          )}`,
          { cache: "no-store" }
        );
        const jsonTurnos = await resTurnos.json();
        if (!resTurnos.ok) throw new Error(jsonTurnos.error || "Error al obtener turnos");
        const turnosOcupados: TurnoBody[] = Array.isArray(jsonTurnos) ? jsonTurnos : [];

        //  Generar turnos libres y asociar el médico
        const libresConMedico = agendasData.flatMap((agenda) =>
          generarTurnosLibres([agenda], turnosOcupados).map((iso) => ({
            iso,
            legajo_medico: agenda.legajo_medico,
            id_especialidad:especialidad
          }))
        );

        setLibres(libresConMedico);
      } catch (err: any) {
        setError(err.message);
        setLibres([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDatosEspecialidad();
  }, [especialidad]);

  return { libres, loading, error };
}


function dateWithTime(base: Date, time: string): Date {
  const [hh, mm, ss = "0"] = time.split(":");
  const d = new Date(base);
  d.setHours(Number(hh) || 0, Number(mm) || 0, Number(ss) || 0, 0);
  return d;
}

export function generarTurnosLibres(
  agendas: Agenda[],
  turnosOcupados: TurnoBody[]
): string[] {
  console.log("🩺 Agenda:", agendas);
console.log("📅 Días activos:", agendas.dia_semana);
console.log("💤 Turnos ocupados:", turnosOcupados.length);

  const libres: string[] = [];
  const hoy = new Date();
  const ayer= new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + 30);
ayer.setDate(hoy.getDate()-1);
  for (const agenda of agendas) {
    if (!agenda || !agenda.dia_semana?.length) continue;

    //  Filtrar turnos ocupados del mismo médico
    const turnosDelMismoMedico = turnosOcupados.filter(
      (t) => t.legajo_medico === agenda.legajo_medico
    );

    const ocupadas = new Set(
      turnosDelMismoMedico.map((t) =>
        new Date(t.fecha_hora_turno).toISOString().slice(0, 16)
      )
    );

    const inicioAgenda = new Date(agenda.fechainiciovigencia);
    const finAgenda = new Date(agenda.fechafinvigencia);
    const duracionMin = parseDuracionToMinutos(agenda.duracionturno);
    if (!duracionMin || isNaN(duracionMin)) continue;

    const duracionMs = duracionMin * 60 * 1000;
    let fecha = new Date(Math.max(hoy.getTime(), inicioAgenda.getTime()));

    while (fecha <= finAgenda && fecha <= limite) {
      const dia = fecha.getDay() === 0 ? 7 : fecha.getDay();
      const diaActivo = agenda.dia_semana.find((d) => d.dia_semana === dia);
      if (!diaActivo) {
        fecha.setDate(fecha.getDate() + 1);
        continue;
      }

      const start = dateWithTime(fecha, diaActivo.hora_inicio);
      const end = dateWithTime(fecha, diaActivo.hora_fin);

      for (
        let turno = new Date(start);
        turno < end;
        turno = new Date(turno.getTime() + duracionMs)
      ) {
        const iso = turno.toISOString().slice(0, 16);

        //  Evitar horarios pasados de ayer
        if (turno < ayer) continue;

        // Solo agregar si no está ocupado para este médico
        if (!ocupadas.has(iso)) libres.push(iso);
      }

      fecha.setDate(fecha.getDate() + 1);
    }
  }

  return libres;
}
function parseDuracionToMinutos(duracion: string | number): number {
  if (typeof duracion === "number") return duracion;
  const [hh, mm, ss = "0"] = duracion.split(":");
  return Number(hh) * 60 + Number(mm) + Math.round(Number(ss) / 60);
}

// export function generarTurnosLibres(
//   agendas: Agenda[],
//   turnosOcupados: TurnoBody[]
// ): string[] {
//   const libres: string[] = [];
//   const hoy = new Date();
//   const limite = new Date();
//   limite.setDate(hoy.getDate() + 30);

//   for (const agenda of agendas) {
//     if (!agenda || !agenda.dia_semana?.length) continue;

//     // Filtrar los turnos ocupados del mismo médico
//     const turnosDelMismoMedico = turnosOcupados.filter(
//       (t) => t.legajo_medico === agenda.legajo_medico
//     );

//     const ocupadas = new Set(
//       turnosDelMismoMedico.map((t) =>
//         new Date(t.fecha_hora_turno).toISOString().slice(0, 16)
//       )
//     );

//     const inicioAgenda = new Date(agenda.fechainiciovigencia);
//     const finAgenda = new Date(agenda.fechafinvigencia);
//     const duracionMin = parseDuracionToMinutos(agenda.duracionturno);
//     if (!duracionMin || isNaN(duracionMin)) continue;

//     const duracionMs = duracionMin * 60 * 1000;
//     let fecha = new Date(Math.max(hoy.getTime(), inicioAgenda.getTime()));

//     while (fecha <= finAgenda && fecha <= limite) {
//       const dia = fecha.getDay() === 0 ? 7 : fecha.getDay();
//       const diaActivo = agenda.dia_semana.find((d) => d.dia_semana === dia);
//       if (!diaActivo) {
//         fecha.setDate(fecha.getDate() + 1);
//         continue;
//       }

//       const start = dateWithTime(fecha, diaActivo.hora_inicio);
//       const end = dateWithTime(fecha, diaActivo.hora_fin);

//       for (
//         let turno = new Date(start);
//         turno < end;
//         turno = new Date(turno.getTime() + duracionMs)
//       ) {
//         const iso = turno.toISOString().slice(0, 16);
//         // Solo agregar si no está ocupado para este médico
//         if (!ocupadas.has(iso)) libres.push(iso);
//       }

//       fecha.setDate(fecha.getDate() + 1);
//     }
//   }

//   return libres;
// }



