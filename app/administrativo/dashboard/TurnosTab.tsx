import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import FiltrosTurnos from "./FiltrosTurnos";

interface Turno {
  cod_turno: number;
  dni_paciente: string;
  fecha_hora_turno: string;
  legajo_medico: string;
  nombre_paciente: string;
  apellido_paciente: string;
  nombre_medico: string;
  apellido_medico: string;
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

  useEffect(() => {
    const cargarTurnos = async () => {
      try {
        setLoading(true);
        const turnosData = await getTurnosPacientes();
        console.log("Turnos cargados:", turnosData);
        setTurnos(turnosData);
      } catch (error) {
        console.error("Error cargando turnos:", error);
        setTurnos([]);
      } finally {
        setLoading(false);
      }
    };

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
      <FiltrosTurnos filters={filters} onChange={setFilters} turnos={turnos} />

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
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Código
              </TableHead>
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Paciente
              </TableHead>
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Médico
              </TableHead>
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Fecha
              </TableHead>
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Hora
              </TableHead>
              <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTurnos.map((turno: Turno) => {
              const { fecha, hora } = formatearFechaHora(
                turno.fecha_hora_turno
              );

              return (
                <TableRow
                  key={turno.cod_turno}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
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
                  <TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </TabsContent>
  );
};
