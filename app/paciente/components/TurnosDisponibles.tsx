"use client";

import React, { useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Agendar from "./Agendar";
import NoMatches from "./NoMatches";
import { useTurnosLibres } from "@/hooks/turnos/UseTurnosLibres";
import { TurnoCard } from "./TurnoCard";

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

  //  Filtrar turnos a partir de 24 horas después de la hora actual
const horaMinima = new Date();
horaMinima.setHours(horaMinima.getHours() + 24); // Suma 24 horas a la hora actual

const turnosFormateados = libres
  .filter(t => new Date(t.iso) >= horaMinima)
  .map(t => {
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
  return { id: t.iso, fecha: fechaStr, hora: horaStr, legajo_medico: t.legajo_medico,id_especialidad: filtroEspecialidad };
});


  //  Estado visual
  if (loading)
    return <p className="text-muted-foreground">Cargando turnos disponibles..
    .</p>;
  if (error)
    return (
      <p className="text-destructive">
        Error al cargar turnos: {error}
      </p>
    );
  if (!libres || libres.length === 0)
    return (
      <NoMatches filtroEspecialidad={filtroEspecialidad} />
     
    );

  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Turnos Disponibles</h3>

      {turnosFormateados.slice(0, mostrarCantidad).map((turno) => (
        <Card key={turno.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className=" p-2 rounded-lg">
                 <Clock className="h-4 w-4 text-secondary" />
        <TurnoCard turno={ turno }></TurnoCard>
               </div>
               
             </div>
             <div className="flex gap-2">
                 <Button
                   size="sm"
                   onClick={() => setTurnoAConfirmar(turno)}
                   variant="default"
                 >
                   <CheckCircle className="h-4 w-4 mr-1" />
                   Agendar
                 </Button>
               </div>
             </div> 
          
          </CardContent>
        </Card>
      ))}

      {/*  Botón “Ver más” */}
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
          setTurnosDisponibles={() => {}}
        />
      )}
    </div>
  );
};
