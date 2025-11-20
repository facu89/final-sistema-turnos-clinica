import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Clock, Save, Trash2 } from "lucide-react"

const GeneralConfig = ({ setAgenda, agenda }: any) => {



     return (
          <>
               <Card>

                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Configuración General
                         </CardTitle>
                         <CardDescription>Configura los parámetros generales de la agenda</CardDescription>
                    </CardHeader>


                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                   <Label htmlFor="duracion">Duración de cada turno (minutos)</Label>
                                   <Input
                                        id="duracion"
                                        type="number"
                                        value={agenda.duracionTurno}
                                        onChange={(e) =>
                                             setAgenda((prev) => ({ ...prev, duracionTurno: Number.parseInt(e.target.value) }))
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
                                        onChange={(e) => setAgenda((prev) => ({ ...prev, fechaVigencia: e.target.value }))}
                                   />
                              </div>
                         </div>
                    </CardContent>

               </Card>
          </>
     )
}

export default GeneralConfig
