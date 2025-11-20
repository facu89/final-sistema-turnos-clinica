import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { generarPDFTablaTurnos } from "@/hooks/pdf/generar-pdf";
import { FiltrosReportes } from "./FiltrosReportes";

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
  especialidad: Especialidad;
}

interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}

interface Medico {
  legajo_medico: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

interface Props {
  turnos: Turno[];
  medicos: Medico[];
  especialidades: Especialidad[];
  loading: boolean;
  fechaInicio: string;
  setFechaInicio: (v: string) => void;
  fechaFin: string;
  setFechaFin: (v: string) => void;
  medicoSeleccionado: string;
  setMedicoSeleccionado: (v: string) => void;
  especialidadSeleccionada: string;
  setEspecialidadSeleccionada: (v: string) => void;
}

export const ReporteTurnosPorFecha = ({
  turnos,
  medicos,
  especialidades,
  loading,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  medicoSeleccionado,
  setMedicoSeleccionado,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
}: Props) => {
  useEffect(() => {}, []);

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
    return turnos.filter((turno) => {
      if (medicoSeleccionado && medicoSeleccionado !== "") {
        const nombreCompletoMedico = `${turno.nombre_medico} ${turno.apellido_medico}`;
        if (nombreCompletoMedico !== medicoSeleccionado) {
          return false;
        }
      }
      if (especialidadSeleccionada && especialidadSeleccionada !== "") {
        if (
          String(turno.especialidad.id_especialidad) !==
            especialidadSeleccionada &&
          turno.especialidad.descripcion !== especialidadSeleccionada
        ) {
          return false;
        }
      }

      if (fechaInicio && fechaInicio !== "") {
        const turnoDate = new Date(turno.fecha_hora_turno);
        const inicioDate = new Date(fechaInicio + "T00:00:00");
        if (turnoDate < inicioDate) return false;
      }
      if (fechaFin && fechaFin !== "") {
        const turnoDate = new Date(turno.fecha_hora_turno);
        const finDate = new Date(fechaFin + "T23:59:59");
        if (turnoDate > finDate) return false;
      }

      return true;
    });
  }, [
    turnos,
    medicoSeleccionado,
    especialidadSeleccionada,
    fechaInicio,
    fechaFin,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Cargando turnos...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Turnos por Fecha</CardTitle>
        <CardDescription>
          Genera un reporte detallado de turnos por fecha y médico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltrosReportes
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          medicoSeleccionado={medicoSeleccionado}
          setMedicoSeleccionado={setMedicoSeleccionado}
          especialidadSeleccionada={especialidadSeleccionada}
          setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          medicos={medicos}
          especialidades={especialidades}
          loading={loading}
          mostrarMedico={true}
          mostrarEspecialidad={true}
        ></FiltrosReportes>
        <div id="div-contenido-pdf">
          <Button
            className="w-full"
            onClick={() =>
              generarPDFTablaTurnos(
                filteredTurnos,
                "Reporte_Turnos_Por_Fecha.pdf"
              )
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Cargando..." : "Generar Reporte"}
          </Button>
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTurnos.map((turno) => {
                const { fecha, hora } = formatearFechaHora(
                  turno.fecha_hora_turno
                );
                return (
                  <TableRow key={turno.cod_turno}>
                    <TableCell>#{turno.cod_turno}</TableCell>
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
                    <TableCell>{turno.especialidad?.descripcion}</TableCell>
                    <TableCell>{fecha}</TableCell>
                    <TableCell>{hora}</TableCell>
                    <TableCell>
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
        </div>
        {filteredTurnos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No se encontraron turnos con los filtros aplicados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
