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
}

interface Filters {
  medico?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

async function getTurnosPacientes(): Promise<Turno[]> {
  const response = await fetch("/api/turnos/todos");
  if (!response.ok) {
    throw new Error("Error al obtener turnos");
  }
  const data: Turno[] = await response.json();
  return data;
}

export const TurnosTab = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  // selección y reasignación
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

  const handleReassignSelected = async () => {
    if (selected.size === 0) return;
    const resp = await reasignarNextDay(Array.from(selected));
    if (resp?.success) {
      clearSelection();
      await cargarTurnos();
    }
  };

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const turnosData = await getTurnosPacientes();
      setTurnos(turnosData);
    } catch (error) {
      console.error("Error cargando turnos:", error);
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
    const fechaStr = fecha.toLocaleDateString("es-ES");
    const horaStr = fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { fecha: fechaStr, hora: horaStr };
  };

  const filteredTurnos = React.useMemo(() => {
    return turnos.filter((turno: Turno) => {
      if (filters.medico && filters.medico !== "") {
        const nombreCompletoMedico = `${turno.nombre_medico} ${turno.apellido_medico}`;
        if (nombreCompletoMedico !== filters.medico) {
          return false;
        }
      }

      if (filters.fechaInicio || filters.fechaFin) {
        const turnoDate = new Date(turno.fecha_hora_turno);

        if (filters.fechaInicio && filters.fechaInicio !== "") {
          const start = new Date(filters.fechaInicio);
          start.setHours(0, 0, 0, 0);
          if (turnoDate < start) return false;
        }

        if (filters.fechaFin && filters.fechaFin !== "") {
          const end = new Date(filters.fechaFin);
          end.setHours(23, 59, 59, 999);
          if (turnoDate > end) return false;
        }
      }

      return true;
    });
  }, [turnos, filters]);

  if (loading) {
    return (
      <TabsContent value="turnos" className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Cargando turnos...</p>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="turnos" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Turnos</h2>
      </div>

      {/* Filtros + botón de reasignar */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FiltrosTurnos filters={filters} onChange={setFilters} turnos={turnos} />
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

      {/* Error */}
      {reError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {reError}
          <button
            className="underline ml-2 text-sm"
            onClick={() => setReError(null)}
          >
            cerrar
          </button>
        </div>
      )}

      {/* Tabla */}
      {filteredTurnos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {turnos.length === 0
              ? "No hay turnos disponibles"
              : "No se encontraron turnos con los filtros aplicados"}
          </p>
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
              <TableHead className="text-center">Reasignar</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredTurnos.map((turno: Turno) => {
              const { fecha, hora } = formatearFechaHora(turno.fecha_hora_turno);
              const esReasignado =
                (turno.estado_turno || "").toLowerCase() === "reasignado";
              const estaSeleccionado = selected.has(turno.cod_turno);

              return (
                <TableRow
                  key={turno.cod_turno}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <TableCell className="font-medium">#{turno.cod_turno}</TableCell>

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
                        (window.location.href = `/administrativo/turnos/${turno.cod_turno}`)
                      }
                    >
                      Ver Detalle
                    </Button>
                  </TableCell>

                  {/* Reasignar: SOLO checkbox si NO está Reasignado */}
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
