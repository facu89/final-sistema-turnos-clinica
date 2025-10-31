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
import { FiltrosReportes } from "./FiltrosReportes";
import React, { useState, useEffect } from "react";
import { GraficoDemandaTorta } from "./GraficoDemandaTorta";

interface Demanda {
  codigo: string; // puede ser legajo, id, etc.
  nombre: string;
  numero: number; // cantidad de turnos
}

interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}
interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}
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
    const key = `${turno.nombre_medico} ${turno.apellido_medico}`;
    if (!demandaMap.has(key)) {
      demandaMap.set(key, {
        codigo: turno.legajo_medico,
        nombre: turno.nombre_medico + " " + turno.apellido_medico,
        numero: 1,
      });
    } else {
      demandaMap.get(key)!.numero += 1;
    }
  });

  return Array.from(demandaMap.values());
}
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

export const ReporteDemandaMedico = ({
  turnos,
  especialidades,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  medicos,
  loading,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  medicoSeleccionado,
  setMedicoSeleccionado,
}: {
  turnos: Turno[];
  especialidades: any[];
  especialidadSeleccionada: string;
  setEspecialidadSeleccionada: (v: string) => void;

  medicos: any[];
  loading: boolean;
  fechaInicio: string;
  setFechaInicio: (v: string) => void;
  fechaFin: string;
  setFechaFin: (v: string) => void;
  medicoSeleccionado: string;
  setMedicoSeleccionado: (v: string) => void;
}) => {
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
        <CardTitle>Informe de Demanda por Médico</CardTitle>
        <CardDescription>
          Consulta la demanda de turnos por cada médico.
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
          mostrarMedico={false}
          mostrarEspecialidad={true}
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
