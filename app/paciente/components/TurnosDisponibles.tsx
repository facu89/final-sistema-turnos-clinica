"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Agendar from "./Agendar";
import NoMatches from "./NoMatches";
import { useTurnosLibres } from "@/hooks/turnos/UseTurnosLibres";
import { useMedico } from "@/hooks/medico/useMedico";
import { useEspecialidad } from "@/hooks/especialidades/useEspecialidad";

// es un componente
function TurnoRow({
  turno,
  onConfirm,
  especialidades,
  medicos,
}: {
  medicos: any[];
  especialidades: any[];
  turno: any;
  onConfirm: (t: any) => void;
}) {
  const especialidad = especialidades?.find(
    (e) => e.id_especialidad == turno.id_especialidad
  );
  const medico = medicos?.find(
    (e) => Number(e.legajo_medico) === Number(turno.legajo_medico)
  );
  return (
    <TableRow key={turno.id}>
      <TableCell>{turno.fecha}</TableCell>
      <TableCell>{turno.hora}</TableCell>
      <TableCell>
        {medico ? `${medico.nombre} ${medico.apellido}` : "Cargando..."}
      </TableCell>
      <TableCell>
        {especialidad ? especialidad.descripcion : "Cargando..."}
      </TableCell>
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
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [turnoAConfirmar, setTurnoAConfirmar] = useState<any>(null);
  const [turnosAgendados, setTurnosAgendados] = useState<any[]>([]);
  const [mostrarCantidad, setMostrarCantidad] = useState(15);
  const [turnosDisponibles, setTurnosDisponibles] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [filtroActivo, setFiltroActivo] = useState<boolean>(false);

  // Datos del hook (usa directamente libres, sin duplicar estado)
  const { libres, loading, error } = useTurnosLibres(
    filtroEspecialidad,
    filtroMedico
  );

  //Mostrar "Ver más"
  const mostrarMas = () => setMostrarCantidad((prev) => prev + 15);

  // Función para limpiar filtros de fecha
  const limpiarFiltrosFecha = () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroActivo(false);
  };

  // Función para aplicar filtros de fecha
  const aplicarFiltrosFecha = () => {
    setFiltroActivo(true);
  };

  // Calcular fechas mínimas y máximas permitidas
  const fechaMinima = new Date();
  fechaMinima.setHours(fechaMinima.getHours() + 24); // 24 horas desde ahora
  const fechaMaxima = new Date();
  fechaMaxima.setDate(fechaMaxima.getDate() + 90); // 3 meses desde hoy

  const fechaMinimaStr = fechaMinima.toISOString().split("T")[0];
  const fechaMaximaStr = fechaMaxima.toISOString().split("T")[0];

  // buscar en bd
  //  Cargar TODOS los médicos registrados desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingDatos(true); // inicia carga

      try {
        // fetch médicos
        const resMedicos = await fetch("/api/medico");
        if (!resMedicos.ok) throw new Error("Error al obtener médicos");
        const medicosData: Medico[] = await resMedicos.json();

        // fetch especialidades
        const resEsp = await fetch("/api/especialidades");
        if (!resEsp.ok) throw new Error("Error al obtener especialidades");
        const espData: { data: any[] } = await resEsp.json();

        // setear ambos
        setMedicos(medicosData);
        setEspecialidades(espData.data);
      } catch (error) {
        console.error("Error cargando médicos o especialidades:", error);
        setMedicos([]);
        setEspecialidades([]);
      } finally {
        setLoadingDatos(false); // termina carga
      }
    };

    cargarDatos();
  }, []);

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
    .filter((t) => {
      const fechaTurno = new Date(t.iso);

      // Filtro básico: 24 horas mínimas
      if (fechaTurno < horaMinima) return false;

      // Filtro de rango de fechas si está activo
      if (filtroActivo) {
        const fechaTurnoStr = fechaTurno.toISOString().split("T")[0];

        if (fechaInicio && fechaTurnoStr < fechaInicio) return false;
        if (fechaFin && fechaTurnoStr > fechaFin) return false;
      }

      return true;
    })
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
  if (loadingDatos) {
    return (
      <p className="text-center text-gray-500">
        Cargando médicos y especialidades...
      </p>
    );
  }

  return (
    <>
      {/* Filtro de fechas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Filtrar por fechas
          </CardTitle>
          <CardDescription>
            Seleccione un rango de fechas para filtrar los turnos disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="fechaInicio">Fecha de inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                min={fechaMinimaStr}
                max={fechaMaximaStr}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="fechaFin">Fecha de fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                min={fechaInicio || fechaMinimaStr}
                max={fechaMaximaStr}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={aplicarFiltrosFecha}
                disabled={!fechaInicio && !fechaFin}
              >
                Filtrar
              </Button>
              <Button
                variant="outline"
                onClick={limpiarFiltrosFecha}
                disabled={!filtroActivo}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {turnosFormateados.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Turnos Disponibles{" "}
            {filtroActivo && (
              <span className="text-sm font-normal text-muted-foreground">
                ({turnosFormateados.length} turnos encontrados)
              </span>
            )}
          </h3>
          <div className="rounded-md border p-2">
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
                    especialidades={especialidades}
                    medicos={medicos}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <NoMatches filtroEspecialidad={String(filtroEspecialidad)} />
      )}

      {/* Botón "Ver más" */}
      {turnosFormateados.length > mostrarCantidad && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={mostrarMas}>
            Ver más turnos
          </Button>
        </div>
      )}

      {/* Modal de agendado */}
      {turnoAConfirmar && (
        <Agendar
          turnoAConfirmar={turnoAConfirmar}
          setTurnoAConfirmar={setTurnoAConfirmar}
          setTurnosAgendados={setTurnosAgendados}
          setTurnosDisponibles={setTurnosDisponibles}
        />
      )}
    </>
  );
};
