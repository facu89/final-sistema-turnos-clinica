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
import { GraficoDemandaTorta } from "./GraficoDemandaTorta";

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
interface Demanda {
  codigo: string;
  nombre: string;
  numero: number;
}

interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}
function calculaDemanda(turnos: Turno[]): Demanda[] {
  const demandaMap = new Map<
    string,
    {
      codigo: string;
      nombre: string;
      numero: number;
    }
  >();

  turnos.forEach((turno) => {
    const key = `${turno.especialidad.descripcion} `;
    if (!demandaMap.has(key)) {
      demandaMap.set(key, {
        codigo: `${turno.especialidad?.id_especialidad}`,
        nombre: turno.especialidad?.descripcion,
        numero: 1,
      });
    } else {
      demandaMap.get(key)!.numero += 1;
    }
  });
  return Array.from(demandaMap.values());
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
      if (especialidadSeleccionada && especialidadSeleccionada !== "") {
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
  const demanda = React.useMemo(
    () => calculaDemanda(filteredTurnos),
    [filteredTurnos]
  );
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
        {demanda.length === 0 ? (
          <div className="text-center text-sm text-gray-500 my-4">
            No hay turnos para los filtros seleccionados.
          </div>
        ) : (
          <>
            <GraficoDemandaTorta demanda={demanda} />
            <Table className="w-full text-sm mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Turnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demanda.map((dem) => (
                  <TableRow key={dem.codigo}>
                    <TableCell>{dem.nombre}</TableCell>
                    <TableCell>{dem.numero}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
