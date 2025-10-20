'use client'
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { turnoPaciente } from '@/app/data/Info'

export const TurnosMedico = () => {
  const turnos = turnoPaciente ? [turnoPaciente] : [];

  // si más adelante querés filtrar por médico, pasalo como prop
  const turnosFiltrados = turnos; 

  return (
    <>
      {turnosFiltrados.map((turno) => (
        <Card key={turno.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{turno.paciente.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {turno.medico.nombre} - {turno.hora}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    turno.estado === "confirmado"
                      ? "default"
                      : turno.estado === "pendiente"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {turno.estado}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `../../turnos/${turno.id}`)
                  }
                >
                  Ver Detalle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};
