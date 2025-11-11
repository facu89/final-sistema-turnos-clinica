"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Agendar from "./Agendar";
import NoMatches from "./NoMatches";
import { useTurnosLibres } from "@/hooks/turnos/UseTurnosLibres";
import { useMedico } from "@/hooks/medico/useMedico";
import { useEspecialidad } from "@/hooks/especialidades/useEspecialidad";

// es un componente
function TurnoRow({
  turno,
  onConfirm,
}: {
  turno: any;
  onConfirm: (t: any) => void;
}) {
  //const { medico } = useMedico(turno.legajo_medico);
  // const { especialidad } = useEspecialidad(turno.id_especialidad);

  return (
    <TableRow key={turno.id}>
      <TableCell>{turno.fecha}</TableCell>
      <TableCell>{turno.hora}</TableCell>
      <TableCell>
        {turno
          ? `${turno.nombre_medico} ${turno.apellido_medico}`
          : "Cargando..."}
      </TableCell>
      <TableCell>{turno ? turno.nombre_especialidad : "Cargando..."}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={() => onConfirm(turno)} variant="default">
          <CheckCircle className="h-4 w-4 mr-1" /> Agendar
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface TurnosDisponiblesProps {
  filtroEspecialidad: number;
  filtroMedico?: number;
}

export const TurnosDisponibles = ({
  filtroEspecialidad,
  filtroMedico,
}: TurnosDisponiblesProps) => {
  //  Estado del componente
  const [turnoAConfirmar, setTurnoAConfirmar] = useState<any>(null);
  const [turnosAgendados, setTurnosAgendados] = useState<any[]>([]);
  const [mostrarCantidad, setMostrarCantidad] = useState(15);

  // Datos del hook (usa directamente libres, sin duplicar estado)
  const { libres, loading, error } = useTurnosLibres(
    filtroEspecialidad,
    filtroMedico
  );

  //Mostrar “Ver más”
  const mostrarMas = () => setMostrarCantidad((prev) => prev + 15);

  // Local state for available turns so child components (Agendar) can update it
  const [turnosDisponibles, setTurnosDisponibles] = useState<any[]>([]);

  // Actualizar turnos disponibles cuando cambien los turnos libres
  useEffect(() => {
    if (libres) {
      setTurnosDisponibles((current) => {
        // Filtrar cualquier turno que ya esté en turnosAgendados
        const turnosNoAgendados = libres.filter(
          (turnoLibre) =>
            !turnosAgendados.some((agendado) => agendado.id === turnoLibre.iso)
        );
        return turnosNoAgendados;
      });
    }
  }, [libres]);

  // Filtrar turnos a partir de 24 horas después de la hora actual
  const horaMinima = new Date();
  horaMinima.setHours(horaMinima.getHours() + 24); // Suma 24 horas a la hora actual

  const turnosFormateados = (turnosDisponibles ?? [])
    .filter((t) => new Date(t.iso) >= horaMinima)
    .map((t) => {
      const fecha = new Date(t.iso);
      const fechaStr = fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      });
      const horaStr = fecha.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        id: t.iso,
        fecha: fechaStr,
        hora: horaStr,
        legajo_medico: t.legajo_medico,
        id_especialidad: filtroEspecialidad,
        nombre_medico: t.nombre_medico,
        apellido_medico: t.apellido_medico,
        nombre_especialidad: t.nombre_especialidad,
      };
    });

  //  Estado visual
  if (loading)
    return (
      <p className="text-muted-foreground">Cargando turnos disponibles.. .</p>
    );
  if (error)
    return <p className="text-destructive">Error al cargar turnos: {error}</p>;
  if (!libres || libres.length === 0)
    return <NoMatches filtroEspecialidad={String(filtroEspecialidad)} />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Turnos Disponibles</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turnosFormateados.slice(0, mostrarCantidad).map((turno) => (
              <TurnoRow
                key={turno.id}
                turno={turno}
                onConfirm={setTurnoAConfirmar}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {turnosFormateados.length > mostrarCantidad && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={mostrarMas}>
            Ver más turnos
          </Button>
        </div>
      )}

      {/*  Modal de agendado */}
      {turnoAConfirmar && (
        <Agendar
          turnoAConfirmar={turnoAConfirmar}
          setTurnoAConfirmar={setTurnoAConfirmar}
          setTurnosAgendados={setTurnosAgendados}
          setTurnosDisponibles={setTurnosDisponibles}
        />
      )}
    </div>
  );
};
