import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useTurnosLibres } from "@/hooks/turnos/UseTurnosLibres";

interface TurnoAModificar {
  id_turno: number;
  medico: {
     nombre:string,
     apellido:string
  };
  especialidad: string;
  id_especialidad: number;
  legajo_medico: number;
}

interface ModificarTurnoProps {
  turnoAModificar: TurnoAModificar | null;
  setTurnoAModificar: React.Dispatch<React.SetStateAction<TurnoAModificar | null>>;
}

export const ModificarTurno = ({
  turnoAModificar,
  setTurnoAModificar,
}: ModificarTurnoProps) => {
  const [turnoNuevo, setTurnoNuevo] = useState<any>(null);

  //  obtiene los turnos libres del mismo médico y especialidad
  const turnosParaModificar = useTurnosLibres(
    turnoAModificar?.id_especialidad ?? 0,
    turnoAModificar?.legajo_medico ?? 0
  );



const turnos: any[] = Array.isArray(turnosParaModificar)
  ? turnosParaModificar
  : (turnosParaModificar?.libres ?? []);

// Por si algún item no trae `iso` y viene con otra key (ej. fecha_hora_turno)
const getISO = (t: any) =>
  t?.iso ?? (typeof t === "string" ? t : t?.fecha_hora_turno);

// Formateo
const turnosFormateados = turnos
  .map((t: any) => {
    const iso = getISO(t);
    if (!iso) return null; // saltar items raros
    const fecha = new Date(iso)
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
      id: iso,
      fecha: fechaStr,
      hora: horaStr,
      legajo_medico: t.legajo_medico ?? turnoAModificar?.legajo_medico,
      id_especialidad: t.id_especialidad ?? turnoAModificar?.id_especialidad,
    };
  })
  .filter(Boolean) // quitar nulls
  .sort((a: any, b: any) => (a.id < b.id ? -1 : 1)); // opcional: ordenar

console.log(turnosFormateados,turnosParaModificar);
  // Al seleccionar nuevo turno
  const seleccionarNuevoTurno = (nuevoTurno: any) => {
    setTurnoNuevo({
      fecha: nuevoTurno.fecha,
      hora: nuevoTurno.hora,
      id: nuevoTurno.id,
      legajo_medico: nuevoTurno.legajo_medico,
      id_especialidad: nuevoTurno.id_especialidad,
    });

    // Podés enviar el nuevo turno al backend o actualizar estado global aquí
    setTurnoAModificar(null);
  };

  return (
    <>
      {turnoAModificar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">
              Selecciona un nuevo turno para {turnoAModificar.medico.nombre}  {turnoAModificar.medico.apellido}  {" "}
              {turnoAModificar.especialidad}
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {turnosFormateados.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay turnos disponibles para este médico y especialidad.
                </p>
              ) : (
                turnosFormateados.map((turno: any) => (
                  <Card key={turno.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {turnoAModificar.medico.nombre}  {turnoAModificar.medico.apellido} - {turnoAModificar.especialidad}
                        </p>
                        <p>
                          {turno.fecha} - {turno.hora}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => seleccionarNuevoTurno(turno)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Seleccionar
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setTurnoAModificar(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
