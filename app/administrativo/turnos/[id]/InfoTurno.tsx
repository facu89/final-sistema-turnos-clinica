import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  IdCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const InfoTurno = ({ turno }: any) => {
  const fechaHora = new Date(turno.fecha_hora_turno);
  const fecha = fechaHora.toLocaleDateString("es-AR");
  const hora = fechaHora.toLocaleTimeString("es-AR", {
    hour:"2-digit",
    minute:"2-digit",
  })
  return (
    <>
      {/* Turno Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Turno
            </CardTitle>
            <Badge>
              {turno.estado_turno}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-10">
            {/* Fecha */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{fecha}</p>
              </div>
            </div>

            {/* Hora */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="font-medium">
                  {hora}
                </p>
              </div>
            </div>

            {/* Obra Social */}
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Obra Social</p>
              <p className="font-medium">{turno?.obra?.descripcion}</p>
            </div>
            </div>
          </div>

          {/* --- Segunda fila: Médico y Especialidad --- */}
          <div className="grid grid-cols-2 gap-4">
            {/* Médico */}
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Médico</p>
                <p className="font-medium">
                {turno.medico.nombre} {turno.medico.apellido}
                </p>
              </div>
            </div>

            {/* Especialidad */}
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Especialidad</p>
                <p className="font-medium">{turno.especialidad.descripcion}</p>
              </div>
            </div>
          </div>
        </CardContent>


      </Card>
    </>
  );
};

export default InfoTurno;
