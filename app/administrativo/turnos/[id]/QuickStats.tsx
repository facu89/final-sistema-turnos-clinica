import React from 'react'
import { Card, CardContent,CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Paciente{
     nombre: string;
     dni: string;
     email?: string;
}
interface Turno {
  id: number;
  fecha: string;
  paciente: Paciente;
  medico: string;
  estado: "pendiente" | "confirmado" | "cancelado";
}

// Tipamos las props del componente
interface QuickStatsProps {
  turno: Turno;
}

export const QuickStats = ({ turno }: QuickStatsProps ) => {
  return (
    <Card>
          <CardHeader>
                <CardTitle>Historial del Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total turnos:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ausencias:</span>
                  <span className="font-medium text-destructive">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Último turno:</span>
                  <span className="font-medium">2023-12-15</span>
                </div>
                {/* <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => (window.location.href = `../admin/pacientes/${turno.paciente.dni}`)}
                >
                  Ver Historial Completo
                </Button> */}
              </CardContent>
            </Card>
  )
}
