"use client";
import { useEffect, useRef, useState } from "react";

interface DiaSemana {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

interface Agenda {
  fechainiciovigencia: string;
  fechafinvigencia: string;
  duracionturno: string | number;
  legajo_medico: number;
  dia_semana: DiaSemana[];
  nombre_medico?: string;
  apellido_medico?: string;
  nombre_especialidad?: string;
  id_especialidad?: number;
}

interface TurnoBody {
  legajo_medico: number;
  id_especialidad: number;
  fecha_hora_turno: string | Date;
  estado_turno: string | null;
}

interface TurnoLibre {
  iso: string;
  legajo_medico: number;
  id_especialidad: number;
  nombre_medico?: string;
  apellido_medico?: string;
  nombre_especialidad?: string;
}

/* ---------------------------------------
   NORMALIZADOR EN HORARIO DE ARGENTINA
------------------------------------------ */
function normalize(date: string | Date) {
  const d = new Date(date);

  const fechaAr = d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [dia, mes, resto] = fechaAr.split("/");
  const [anio, hora] = resto.split(",");

  return `${anio.trim()}-${mes}-${dia}T${hora.trim()}`;
}

export function useTurnosLibres(especialidad: number, legajoMedico?: number) {
  const [libres, setLibres] = useState<TurnoLibre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esp = useRef<number>(0);

  /* ---------------------------------------
          BUSCAR TURNOS POR MÉDICO
  ------------------------------------------ */
  useEffect(() => {
    if (!legajoMedico) return;

    const fetchDatosMedico = async () => {
      try {
        setLoading(true);
        setError(null);

        const resAgenda = await fetch(
          `/api/agenda?legajo_medico=${legajoMedico}`,
        );
        const jsonAgenda = await resAgenda.json();

        if (!resAgenda.ok) {
          throw new Error(jsonAgenda.error || "Error al cargar agenda");
        }

        const agenda: Agenda | null = Array.isArray(jsonAgenda)
          ? jsonAgenda[0]
          : jsonAgenda.agenda || jsonAgenda.medico?.agenda || null;

        if (!agenda) {
          setLibres([]);
          return;
        }

        agenda.legajo_medico = legajoMedico;
        agenda.nombre_medico = jsonAgenda.nombre;
        agenda.apellido_medico = jsonAgenda.apellido;

        const resTurnos = await fetch(
          `/api/turnos/por-medico?legajo_medico=${legajoMedico}`,
          { cache: "no-store" },
        );
        const jsonTurnos = await resTurnos.json();

        if (!resTurnos.ok) {
          throw new Error(jsonTurnos.error || "Error al cargar turnos");
        }

        /* ---- MAPEAR CORRECTAMENTE ---- */
        const turnosFiltrados: TurnoBody[] = jsonTurnos.map((t: any) => ({
          legajo_medico: t.legajo_medico,
          id_especialidad: t.id_especialidad,
          fecha_hora_turno: t.fecha_hora_turno,
          estado_turno: t.estado_turno,
        }));

        /* ---- FILTRAR SOLO OCUPADOS DE SU ESPECIALIDAD ---- */

        const libresMedico = generarTurnosLibres([agenda], turnosFiltrados).map(
          (iso) => ({
            iso,
            legajo_medico: agenda.legajo_medico,
            id_especialidad: especialidad,
            nombre_medico: agenda.nombre_medico,
            apellido_medico: agenda.apellido_medico,
            nombre_especialidad: agenda.nombre_especialidad,
          }),
        );

        setLibres(libresMedico);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatosMedico();
  }, [legajoMedico]);

  /* ---------------------------------------
       BUSCAR TURNOS POR ESPECIALIDAD
  ------------------------------------------ */
  useEffect(() => {
    if (!especialidad || legajoMedico) return;
    if (especialidad === esp.current) return;

    esp.current = especialidad;

    const fetchDatosEspecialidad = async () => {
      try {
        setLoading(true);
        setError(null);

        const resAgendas = await fetch(
          `/api/agenda/por-especialidad?id_especialidad=${
            encodeURIComponent(
              especialidad,
            )
          }`,
        );
        const agendasData = await resAgendas.json();

        const resTurnos = await fetch(
          `/api/turnos/por-especialidad?id_especialidad=${
            encodeURIComponent(
              especialidad,
            )
          }`,
          { cache: "no-store" },
        );
        const jsonTurnos = await resTurnos.json();

        /* ---- MAPEAR CORRECTAMENTE ---- */
        const turnosFiltrados: TurnoBody[] = jsonTurnos.map((t: any) => ({
          legajo_medico: t.legajo_medico,
          id_especialidad: t.id_especialidad,
          fecha_hora_turno: t.fecha_hora_turno,
          estado_turno: t.estado_turno,
        }));

        const libresConMedico = agendasData.flatMap((agenda: Agenda) =>
          generarTurnosLibres([agenda], turnosFiltrados).map((iso) => ({
            iso,
            legajo_medico: agenda.legajo_medico,
            id_especialidad: especialidad,
            nombre_medico: agenda.nombre_medico,
            apellido_medico: agenda.apellido_medico,
            nombre_especialidad: agenda.nombre_especialidad,
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
  d.setHours(Number(hh), Number(mm), Number(ss), 0);
  return d;
}

export function generarTurnosLibres(
  agendas: Agenda[],
  turnosOcupados: TurnoBody[],
): string[] {
  const libres: string[] = [];
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const limite = new Date();
  limite.setDate(hoy.getDate() + 30);

  for (const agenda of agendas) {
    if (!agenda || !agenda.dia_semana?.length) continue;

    const ocupadas = new Set(
      turnosOcupados.map((t) => normalize(t.fecha_hora_turno)),
    );

    const [anioInicio, mesInicio, diaInicio] = agenda.fechainiciovigencia.split(
      "-",
    ).map(Number);
    const [anioFin, mesFin, diaFin] = agenda.fechafinvigencia.split("-").map(
      Number,
    );

    const inicioAgenda = new Date(anioInicio, mesInicio - 1, diaInicio);
    const finAgenda = new Date(anioFin, mesFin - 1, diaFin);

    const duracionMin = Number(String(agenda.duracionturno).split(":")[1]) || 0;
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

      // Usar formato ISO para evitar problemas de formato de 12/24 horas

      for (
        let turno = new Date(start);
        turno < end;
        turno = new Date(turno.getTime() + duracionMs)
      ) {
        const turnoNormalizado = normalize(turno);

        const esHoy = fecha.toDateString() === ahora.toDateString();
        const yaPaso = turno <= ahora;

        if (esHoy && yaPaso) {
          continue;
        }

        if (!ocupadas.has(turnoNormalizado)) {
          libres.push(turnoNormalizado);
        } else {
          console.log(
            ` Turno ocupado: ${turno.getHours()}:${
              turno.getMinutes().toString().padStart(2, "0")
            }`,
          );
        }
      }

      fecha.setDate(fecha.getDate() + 1);
    }
  }

  return libres;
}
