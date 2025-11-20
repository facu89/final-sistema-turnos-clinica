import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import FiltrosTurnos from "./FiltrosTurnos";
import { useReasignarManual } from "./useReasignarManual";
import { SkeletonTurnosTab } from "@/components/ui/skeletons/skeletonTurnos";
import { User } from "lucide-react";

interface Turno {
  cod_turno: number;
  dni_paciente: string;
  fecha_hora_turno: string;
  legajo_medico: string;
  nombre_paciente: string;
  apellido_paciente: string;
  nombre_medico: string;
  apellido_medico: string;
  estado_turno: string;
  presencia_turno: boolean | null; // 👈 importante
}

interface Filters {
  medico?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

async function getTurnosPacientes(): Promise<Turno[]> {
  const response = await fetch("/api/turnos/todos");
  if (!response.ok) throw new Error("Error al obtener turnos");
  const data: Turno[] = await response.json();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return data.filter((t) => new Date(t.fecha_hora_turno) >= hoy);
}

export const TurnosTab = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const {
    reasignarNextDay,
    loading: reLoading,
    error: reError,
    setError: setReError,
  } = useReasignarManual();

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const turnosData = await getTurnosPacientes();
      setTurnos(turnosData);
    } catch (err) {
      console.error("Error cargando turnos:", err);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  const formatearFechaHora = (fechaHora: string) => {
    const fecha = new Date(fechaHora);
    return {
      fecha: fecha.toLocaleDateString("es-ES"),
      hora: fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const filteredTurnos = React.useMemo(() => {
    return turnos.filter((turno) => {
      if (filters.medico) {
        const n = `${turno.nombre_medico} ${turno.apellido_medico}`;
        if (n !== filters.medico) return false;
      }

      const turnoDate = new Date(turno.fecha_hora_turno);
      const turnoYMD = turnoDate.toISOString().slice(0, 10);

      if (filters.fechaInicio) {
        const inicioYMD = new Date(filters.fechaInicio)
          .toISOString()
          .slice(0, 10);
        if (turnoYMD < inicioYMD) return false;
      }
      if (filters.fechaFin) {
        const finYMD = new Date(filters.fechaFin).toISOString().slice(0, 10);
        if (turnoYMD > finYMD) return false;
      }
      return true;
    });
  }, [turnos, filters]);

  const handleReassignSelected = async () => {
    if (selected.size === 0) return;

    const resp: any = await reasignarNextDay(Array.from(selected));
    if (!resp) return;

    if (resp.agendaFailMessage) {
      setReError(resp.agendaFailMessage);
    } else {
      const fallidos = (resp.resultados ?? []).filter((r: any) => r.error);
      if (fallidos.length > 0) {
        const ids = fallidos.map((f: any) => `#${f.id}`).join(", ");
        const haySinAgenda = fallidos.some((f: any) =>
          String(f.error || "").includes(
            "No se encontró un día hábil según la agenda"
          )
        );
        const msg = haySinAgenda
          ? `No se encontró un día hábil según la agenda del médico en los próximos 60 días para los siguientes turnos: ${ids}.`
          : `No se pudo reasignar ${fallidos.length} turno(s): ${ids}.`;
        setReError(msg);
      } else {
        setReError(null);
      }
    }

    if (resp.resultados && resp.resultados.some((r: any) => r.nuevo)) {
      clearSelection();
      await cargarTurnos();
    }
  };

  // ✅ Alternar presencia y actualizar color + base
  const marcarPresencia = async (
    cod_turno: number,
    actual: boolean | null
  ) => {
    const nuevoValor = !Boolean(actual); // null/undefined -> false, se invierte a true

    // Actualización optimista en el front
    setTurnos((prev) =>
      prev.map((t) =>
        t.cod_turno === cod_turno
          ? { ...t, presencia_turno: nuevoValor }
          : t
      )
    );

    try {
      const res = await fetch("/api/turnos/presencia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_turno, presencia: nuevoValor }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar presencia");
      }

      // Si quisieras, podrías leer el valor devuelto:
      // const { data } = await res.json();
      // y ajustar con data.presencia_turno, pero en este caso ya lo sabemos.
    } catch (err) {
      console.error("Error marcando presencia:", err);
      // Revertir si hay error
      setTurnos((prev) =>
        prev.map((t) =>
          t.cod_turno === cod_turno
            ? { ...t, presencia_turno: actual }
            : t
        )
      );
    }
  };

  if (loading) return <SkeletonTurnosTab />;

  return (
    <TabsContent value="turnos" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Turnos</h2>
      </div>

      {/* Filtros + botón de reasignar */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FiltrosTurnos
            filters={filters}
            onChange={setFilters}
            turnos={turnos}
          />
        </div>
        <Button
          onClick={handleReassignSelected}
          disabled={reLoading || selected.size === 0}
        >
          {reLoading
            ? "Reasignando..."
            : `Reasignar seleccionados (${selected.size})`}
        </Button>
      </div>

      {/* Banner de error */}
      {reError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <div className="flex-1">{reError}</div>
          <button
            onClick={() => setReError(null)}
            aria-label="Cerrar"
            className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full border border-red-300 text-red-700 hover:bg-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabla */}
      {filteredTurnos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {turnos.length === 0
            ? "No hay turnos disponibles"
            : "No se encontraron turnos con los filtros aplicados"}
        </div>
      ) : (
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Consultar</TableHead>
              <TableHead className="text-center">
                Marcar Presencia
              </TableHead>
              <TableHead className="text-center">Reasignar</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredTurnos.map((turno) => {
              const { fecha, hora } = formatearFechaHora(
                turno.fecha_hora_turno
              );
              const esReasignado =
                (turno.estado_turno || "").toLowerCase() ===
                "reasignado";
              const estaSeleccionado = selected.has(turno.cod_turno);
              const esPresente = Boolean(turno.presencia_turno);

              return (
                <TableRow
                  key={turno.cod_turno}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <TableCell className="font-medium">
                    #{turno.cod_turno}
                  </TableCell>

                  <TableCell>
                    {turno.nombre_paciente} {turno.apellido_paciente}
                    <br />
                    <span className="text-xs text-gray-500">
                      DNI: {turno.dni_paciente}
                    </span>
                  </TableCell>

                  <TableCell>
                    {turno.nombre_medico} {turno.apellido_medico}
                    <br />
                    <span className="text-xs text-gray-500">
                      Legajo: {turno.legajo_medico}
                    </span>
                  </TableCell>

                  <TableCell>{fecha}</TableCell>
                  <TableCell>{hora}</TableCell>

                  {/* Consultar */}
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href =
                          `/administrativo/turnos/${turno.cod_turno}`)
                      }
                    >
                      Ver Detalle
                    </Button>
                  </TableCell>

                  {/* Marcar Presencia */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          marcarPresencia(
                            turno.cod_turno,
                            turno.presencia_turno
                          )
                        }
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          esPresente
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                        aria-label="Marcar presencia"
                      >
                        <User className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Reasignar */}
                  <TableCell className="text-center">
                    {!esReasignado && (
                      <input
                        type="checkbox"
                        checked={estaSeleccionado}
                        onChange={() => toggle(turno.cod_turno)}
                        disabled={reLoading}
                        className="h-4 w-4"
                        aria-label={`Seleccionar turno #${turno.cod_turno}`}
                      />
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${
                        turno.estado_turno === "Pendiente de pago"
                          ? "bg-orange-50 text-orange-700 border-orange-300"
                          : turno.estado_turno === "Pagado" ||
                            turno.estado_turno === "Confirmado"
                          ? "bg-green-50 text-green-700 border-green-300"
                          : turno.estado_turno === "Cancelado"
                          ? "bg-red-50 text-red-700 border-red-300"
                          : turno.estado_turno === "Pendiente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                          : turno.estado_turno === "Reasignado"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                    >
                      {turno.estado_turno || "Sin estado"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </TabsContent>
  );
};
