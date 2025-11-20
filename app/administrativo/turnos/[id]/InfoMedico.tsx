import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// interface Medico{
//      nombre: string;
//      especialidad: string;
//      consultorio: string;
// }

 interface Turno {
  icha: string;
  pad: number;
  feciente: { 
     // nombre: string;
     // dni: string;
     // email: string;
     // telefono: string;
     // direccion: string;
  }
  medico: {
     nombre: string;
     especialidad: string;
     consultorio: string;
  };
  hora: string;
  duracion: string;
  motivo: string;
  observaciones?: string;
  estado: string ;
}

// Tipamos las props del componente
interface InfoMedicoProps {
  turno: Turno;
}
export const InfoMedico: React.FC<React.PropsWithChildren<InfoMedicoProps>>  = ( {turno}: InfoMedicoProps) => {
  return (
    <Card>
              <CardHeader>
                <CardTitle>Información del Médico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Médico</p>
                    <p className="font-medium">{turno.medico.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidad</p>
                    <p className="font-medium">{turno.medico.especialidad}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consultorio</p>
                    <p className="font-medium">Consultorio {turno.medico.consultorio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
  )
}

