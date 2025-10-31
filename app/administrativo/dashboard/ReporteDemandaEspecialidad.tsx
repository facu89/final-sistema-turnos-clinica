import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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

interface Props {
  turnos: Turno[];
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
const formatearFechaHora = (fechaHora: string) => {
  const fecha = new Date(fechaHora);
  const fechaStr = fecha.toLocaleDateString("es-ES");
  const horaStr = fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { fecha: fechaStr, hora: horaStr };
};
export const ReporteDemandaEspecialidad = ({
  turnos,
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
  // Filtra solo por fecha y especialidad
  const filteredTurnos = React.useMemo(() => {
    return turnos.filter((turno) => {
      const turnoDate = new Date(turno.fecha_hora_turno);
      const turnoYMD = turnoDate.toISOString().slice(0, 10);

      if (fechaInicio) {
        const inicioYMD = new Date(fechaInicio).toISOString().slice(0, 10);
        if (turnoYMD < inicioYMD) return false;
      }
      if (fechaFin) {
        const finYMD = new Date(fechaFin).toISOString().slice(0, 10);
        if (turnoYMD > finYMD) return false;
      }
      if (especialidadSeleccionada) {
        if (
          String(turno.especialidad.id_especialidad) !==
            especialidadSeleccionada &&
          turno.especialidad.descripcion !== especialidadSeleccionada
        ) {
          return false;
        }
      }
      return true;
    });
  }, [turnos, fechaInicio, fechaFin, especialidadSeleccionada]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informe de Demanda por Especialidad</CardTitle>
        <CardDescription>
          Consulta la demanda de turnos por especialidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FiltrosReportes
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          especialidadSeleccionada={especialidadSeleccionada}
          setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          especialidades={especialidades}
          loading={loading}
          mostrarEspecialidad={false}
          mostrarMedico={false}
        />
        <Table className="w-full text-sm mt-6">
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
      </CardContent>
    </Card>
  );
};
