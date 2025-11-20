import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Trash2 } from "lucide-react"


interface agendaProps{
  agenda:{

    duracionTurno: number;
    fechaVigencia: string;
    horarios: {
        dia: string;
        activo: boolean; 
        horaInicio: string; 
        horaFin: string }[];
  }

}

const SideBar = ({agenda }: agendaProps) => {
  return (
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Agenda
                </Button>
                {/* <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Excepción
                </Button> */}
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Agenda
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Días activos:</span>
                        {/* blabla */}
                    <span className="font-medium">{agenda.horarios.filter((h) => h.activo).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duración turno:</span>
                    <span className="font-medium">{agenda.duracionTurno} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vigencia:</span>
                    <span className="font-medium">{agenda.fechaVigencia}</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Turnos por semana:</p>
                  <p className="text-2xl font-bold text-primary">
                    {agenda.horarios
                      .filter((h) => h.activo)
                      .reduce((total, h) => {
                        const duracion =
                          (new Date(`2000-01-01T${h.horaFin}`) - new Date(`2000-01-01T${h.horaInicio}`)) / (1000 * 60)
                        return total + Math.floor(duracion / agenda.duracionTurno)
                      }, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
  )
}

export default SideBar
