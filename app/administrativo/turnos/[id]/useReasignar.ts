"use client";
import { useState } from "react";
import { useTurnosLibres } from "./useTurnosLibres";

export interface Turno {
     id?: number | string;
     legajo_medico: string;
     dni_paciente: string;
     id_obra?: number | string | null;
     fecha_hora_turno: string; // ISO datetime string
     id_especialidad?: number | string | null;
     turno_pagado?: boolean;
     estado_turno?: string;
     turno_modificado?: boolean;
     presencia_turno?: boolean;
}

async function agendarTurno(turno: Turno) {
     try {
          const res = await fetch(`/api/turnos/agendar`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(turno),
          });
          const json = await res.json();
          if (!res.ok) return { ok: false, error: json };
          return { ok: true, data: json };
     } catch (err) {
          return { ok: false, error: err };
     }
}

/**
 * Hook para reasignar turnos cuando cambia la agenda de un médico.
 * - Fetch a los turnos futuros ya agendados del médico.
 * - Calcula los turnos libres (useTurnosLibres) y reasigna cada turno futuro a una nueva fecha disponible.
 */
const useReasignar = (legajo: string) => {
     const { libres, ocupados, agenda, loading: loadingLibres, error: errorLibres } = useTurnosLibres(legajo);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<any>(null);
     const [results, setResults] = useState<any[]>([]);

     // Reasigna todos los turnos futuros del médico según los turnos libres calculados
     const reasignarTurnosPorCambioAgenda = async () => {
          setLoading(true);
          setError(null);
          setResults([]);

          try {
               //obtener turnos futuros agendados para este legajo desde el backend
               const res = await fetch(`/api/turnos/por-medico?legajo=${encodeURIComponent(legajo)}`, { cache: "no-store" });
               const turnosFuturos = await res.json();
               if (!res.ok) throw turnosFuturos;

               if (!Array.isArray(turnosFuturos) || turnosFuturos.length === 0) {
                    setLoading(false);
                    return { ok: true, message: "No hay turnos futuros a reasignar", results: [] };
               }

               //tomar la lista de turnos libres calculada por useTurnosLibres (ISO strings)
               if (!Array.isArray(libres) || libres.length === 0 || !agenda) {
                    throw new Error("No hay turnos libres en la agenda para reasignar o agenda no disponible");
               }

               // devuelve true si una fecha ISO cae dentro de la agenda (día activo y hora entre inicio/fin)
               const isWithinAgenda = (iso: string, agendaObj: any) => {
                    try {
                         const d = new Date(iso);
                         const inicio = new Date(agendaObj.fechainiciovigencia);
                         const fin = new Date(agendaObj.fechafinvigencia);
                         if (d < inicio || d > fin) return false;

                         const weekday = d.getDay(); // 0-6
                         const dayEntry = (agendaObj.dia_semana || []).find((ds: any) => ds.dia_semana === weekday);
                         if (!dayEntry) return false;

                         // compare time of day
                         const [startH, startM] = (dayEntry.hora_inicio || "00:00").split(":").map(Number);
                         const [endH, endM] = (dayEntry.hora_fin || "23:59").split(":").map(Number);

                         const start = new Date(d);
                         start.setHours(startH, startM, 0, 0);
                         const end = new Date(d);
                         end.setHours(endH, endM, 0, 0);

                         return d >= start && d < end;
                    } catch (e) {
                         return false;
                    }
               };

               // Filtrar solo los turnos que quedan fuera de la nueva agenda
               const turnosFueraAgenda = turnosFuturos.filter((t: any) => !isWithinAgenda(t.fecha_hora_turno, agenda));

               if (turnosFueraAgenda.length === 0) {
                    setLoading(false);
                    return { ok: true, message: "No hay turnos fuera de la agenda que reasignar", results: [] };
               }

               // Sólo consideramos libres futuros (mayores a ahora)
               const ahora = new Date();
               const libresFuturos = libres.filter((l: string) => new Date(l) > ahora);
               if (libresFuturos.length === 0) {
                    throw new Error("No hay huecos libres futuros disponibles para reasignar");
               }

               // Reasignamos sólo los turnosFueraAgenda, 1 a 1 con los libres futuros ordenados
               const resultados: any[] = [];
               let libreIndex = 0;

               for (const turno of turnosFueraAgenda) {
                    // Saltar posibles libres que coincidan exactamente con la fecha del turno (no queremos mover si igual)
                    while (libreIndex < libresFuturos.length && new Date(libresFuturos[libreIndex]).toISOString() === new Date(turno.fecha_hora_turno).toISOString()) {
                         libreIndex++;
                    }
                    if (libreIndex >= libresFuturos.length) {
                         resultados.push({ input: turno, result: { ok: false, error: "No quedan turnos libres disponibles" } });
                         continue;
                    }

                    const nuevoHorario = libresFuturos[libreIndex];

                    const payload: Turno = {
                         legajo_medico: turno.legajo_medico ?? legajo,
                         dni_paciente: turno.dni_paciente,
                         id_obra: turno.id_obra ?? null,
                         fecha_hora_turno: nuevoHorario,
                         id_especialidad: turno.id_especialidad ?? null,
                         turno_pagado: turno.turno_pagado ?? false,
                         estado_turno: turno.estado_turno ?? "confirmado",
                         turno_modificado: true,
                         presencia_turno: turno.presencia_turno ?? false,
                    };

                    // eslint-disable-next-line no-await-in-loop
                    const r = await agendarTurno(payload);
                    resultados.push({ input: turno, result: r });
                    if (r.ok) setResults((prev) => [...prev, r.data]);

                    libreIndex++;
               }

               setLoading(false);
               return { ok: true, results: resultados };
          } catch (err) {
               setError(err);
               setLoading(false);
               return { ok: false, error: err };
          }
     };

     return {
          libres,
          ocupados,
          agenda,
          loadingLibres,
          errorLibres,
          reasignarTurnosPorCambioAgenda,
          loading,
          error,
          results,
     };
};

export default useReasignar;


