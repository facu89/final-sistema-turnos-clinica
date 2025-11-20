import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Clock, Save, Trash2 } from "lucide-react"

const Timetables = ({ setAgenda, agenda}: any) => {

  const diasSemana = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

     const handleHorarioChange = (dia: string, campo: string, valor: any) => {
    setAgenda((prev) => ({
      ...prev,
      horarios: prev.horarios.map((h) => (h.dia === dia ? { ...h, [campo]: valor } : h)),
    }))
  }

  return (
    <div>
      <Card>

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Atención
                </CardTitle>
                <CardDescription>Configura los días y horarios de atención</CardDescription>
              </CardHeader>


              <CardContent className="space-y-4">
                {agenda.horarios.map((horario, index) => (
                  <div key={horario.dia} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={horario.dia}
                        checked={horario.activo}
                        onCheckedChange={(checked) => handleHorarioChange(horario.dia, "activo", checked)}
                      />
                      <Label htmlFor={horario.dia} className="text-sm font-medium capitalize min-w-[80px]">
                        {diasSemana[index]}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Desde</Label>
                        <Input
                          type="time"
                          value={horario.horaInicio}
                          onChange={(e) => handleHorarioChange(horario.dia, "horaInicio", e.target.value)}
                          disabled={!horario.activo}
                          className="w-24"
                        />
                      </div>
                      <span className="text-muted-foreground">hasta</span>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Hasta</Label>
                        <Input
                          type="time"
                          value={horario.horaFin}
                          onChange={(e) => handleHorarioChange(horario.dia, "horaFin", e.target.value)}
                          disabled={!horario.activo}
                          className="w-24"
                        />
                      </div>
                    </div>

                    {horario.activo && (
                      <Badge variant="secondary">
                        {Math.floor(
                          (new Date(`2000-01-01T${horario.horaFin}`) - new Date(`2000-01-01T${horario.horaInicio}`)) /
                            (1000 * 60 * agenda.duracionTurno),
                        )}{" "}
                        turnos
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
    </div>
  )
}

export default Timetables
