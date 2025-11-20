"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import SideBar from "./SideBar";
import { HeaderAgenda } from "./HeaderAgenda";
// Interface corregida
interface AgendaProps {
  duracionTurno: number;
  fechaVigencia: string;
  horarios: {
    dia: string;
    activo: boolean;
    horaInicio: string;
    horaFin: string;
  }[];
}

export default function MedicoAgenda() {
  // Estado tipado correctamente
  const [agenda, setAgenda] = useState<AgendaProps>({
    duracionTurno: 30,
    fechaVigencia: "2024-12-31",
    horarios: [
      { dia: "lunes", activo: true, horaInicio: "09:00", horaFin: "17:00" },
      { dia: "martes", activo: true, horaInicio: "09:00", horaFin: "17:00" },
      {
        dia: "miercoles",
        activo: false,
        horaInicio: "09:00",
        horaFin: "17:00",
      },
      { dia: "jueves", activo: true, horaInicio: "09:00", horaFin: "17:00" },
      { dia: "viernes", activo: true, horaInicio: "09:00", horaFin: "13:00" },
      { dia: "sabado", activo: false, horaInicio: "09:00", horaFin: "13:00" },
      { dia: "domingo", activo: false, horaInicio: "09:00", horaFin: "13:00" },
    ],
  });

  const medico = {
    nombre: "Dr. Carlos López",
    especialidad: "Cardiología",
    estado: "activo",
  };

  const diasSemana = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
  ];

  // Función tipada correctamente
  const handleHorarioChange = (
    dia: string,
    campo: keyof AgendaProps["horarios"][0],
    valor: string | boolean
  ) => {
    setAgenda((prev) => ({
      ...prev,
      horarios: prev.horarios.map((h) =>
        h.dia === dia ? { ...h, [campo]: valor } : h
      ),
    }));
  };

  // Función para calcular turnos de manera segura
  const calcularTurnos = (
    horaInicio: string,
    horaFin: string,
    duracionTurno: number
  ): number => {
    try {
      const inicio = new Date(`2000-01-01T${horaInicio}:00`);
      const fin = new Date(`2000-01-01T${horaFin}:00`);
      const diferencia = fin.getTime() - inicio.getTime();
      return Math.floor(diferencia / (1000 * 60 * duracionTurno));
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderAgenda nombre={medico.nombre} apellido={medico.especialidad} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Configuración General
                </CardTitle>
                <CardDescription>
                  Configura los parámetros generales de la agenda
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duracion">
                      Duración de cada turno (minutos)
                    </Label>
                    <Input
                      id="duracion"
                      type="number"
                      value={agenda.duracionTurno}
                      onChange={(e) =>
                        setAgenda((prev) => ({
                          ...prev,
                          duracionTurno: parseInt(e.target.value) || 30,
                        }))
                      }
                      min="15"
                      max="120"
                      step="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vigencia">Fecha de vigencia</Label>
                    <Input
                      id="vigencia"
                      type="date"
                      value={agenda.fechaVigencia}
                      onChange={(e) =>
                        setAgenda((prev) => ({
                          ...prev,
                          fechaVigencia: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Horarios por Día */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Atención
                </CardTitle>
                <CardDescription>
                  Configura los días y horarios de atención
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {agenda.horarios.map((horario, index) => (
                  <div
                    key={horario.dia}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={horario.dia}
                        checked={horario.activo}
                        onCheckedChange={(checked) =>
                          handleHorarioChange(
                            horario.dia,
                            "activo",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor={horario.dia}
                        className="text-sm font-medium capitalize min-w-[80px]"
                      >
                        {diasSemana[index]}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Desde
                        </Label>
                        <Input
                          type="time"
                          value={horario.horaInicio}
                          onChange={(e) =>
                            handleHorarioChange(
                              horario.dia,
                              "horaInicio",
                              e.target.value
                            )
                          }
                          disabled={!horario.activo}
                          className="w-24"
                        />
                      </div>
                      <span className="text-muted-foreground">hasta</span>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Hasta
                        </Label>
                        <Input
                          type="time"
                          value={horario.horaFin}
                          onChange={(e) =>
                            handleHorarioChange(
                              horario.dia,
                              "horaFin",
                              e.target.value
                            )
                          }
                          disabled={!horario.activo}
                          className="w-24"
                        />
                      </div>
                    </div>

                    {horario.activo && (
                      <Badge variant="secondary">
                        {calcularTurnos(
                          horario.horaInicio,
                          horario.horaFin,
                          agenda.duracionTurno
                        )}{" "}
                        turnos
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* SideBar corregido */}
          <SideBar agenda={agenda} />
        </div>
      </div>
    </div>
  );
}
