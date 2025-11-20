import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useTurnosLibres } from "@/hooks/turnos/UseTurnosLibres";
import Modificar from "../../components/Modifiicar";
interface TurnoAModificar {
  id_turno: number;
  profiles: {
    nombre: string;
    apellido: string;
    email: string;
  };
  medico: {
    nombre: string;
    apellido: string;
  };
  especialidad: { descripcion: string };
  id_especialidad: number;
  legajo_medico: number;
}

interface ModificarTurnoProps {
  turnoAModificar: TurnoAModificar | null;
  setTurnoAModificar: React.Dispatch<
    React.SetStateAction<TurnoAModificar | null>
  >;
  onSuccess?: () => void | Promise<void>;
}

export const ModificarTurno = ({
  turnoAModificar,
  setTurnoAModificar,
  onSuccess,
}: ModificarTurnoProps) => {
  const [turnoNuevo, setTurnoNuevo] = useState<any>(null);
  const [turnoViejo, setTurnoViejo] = useState<any>(null);
  const [showModificar, setShowModificar] = useState(false);

  //  obtiene los turnos libres del mismo médico y especialidad (hook devuelve { libres, loading, error })
  const {
    libres,
    loading,
    error,
  } = useTurnosLibres(
    Number(turnoAModificar?.id_especialidad) ?? 0,
    Number(turnoAModificar?.legajo_medico) ?? 0
  );
console.log("Turnos a modificars:", turnoAModificar,libres);
  const turnos: any[] = Array.isArray(libres)
    ? libres
    : (libres ?? []);

  // Por si algún item no trae `iso` y viene con otra key (ej. fecha_hora_turno)
  const getISO = (t: any) =>
    t?.iso ?? (typeof t === "string" ? t : t?.fecha_hora_turno);

  // Filtrar turnos a partir de 24 horas después de la hora actual
  const horaMinima = new Date();
  horaMinima.setHours(horaMinima.getHours() + 24);

  // Formateo
  // const turnosFormateados = turnos
  //   .map((t: any) => {
  //     const iso = getISO(t);
  //     if (!iso) return null; // saltar items raros
  //     const fecha = new Date(iso);
  //     if (fecha < horaMinima) return null; // filtrar turnos antes de 24 horas
  //     const fechaStr = fecha.toLocaleDateString("es-AR", {
  //       weekday: "long",
  //       day: "2-digit",
  //       month: "2-digit",
  //     });
  //     const horaStr = fecha.toLocaleTimeString("es-AR", {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });

  //     return {
  //       id: iso,
  //       fecha: fechaStr,
  //       hora: horaStr,
  //       legajo_medico: t.legajo_medico ?? turnoAModificar?.legajo_medico,
  //       id_especialidad: t.id_especialidad ?? turnoAModificar?.id_especialidad,
  //     };
  //   })
  //   .filter(Boolean) // quitar nulls
  //   .sort((a: any, b: any) => (a.id < b.id ? -1 : 1)); // opcional: ordenar
 const turnosFormateados = (turnos ?? [])
    .filter((t) => new Date(t.iso) >= horaMinima)
    .map((t) => {
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
      return {
        id: t.iso,
        fecha: fechaStr,
        hora: horaStr,
        legajo_medico: t.legajo_medico ?? turnoAModificar?.legajo_medico,
         id_especialidad: t.id_especialidad ?? turnoAModificar?.id_especialidad,
      };
    });
  // Al seleccionar nuevo turno
  const seleccionarNuevoTurno = (turnoAModificar: any, nuevoTurno: any) => {
    setTurnoViejo({
      fecha: turnoAModificar.fecha_hora_turno,
      cod_turno: turnoAModificar.cod_turno,
      legajo_medico: turnoAModificar.legajo_medico,
      id_especialidad: turnoAModificar.id_especialidad,
      especialidad: turnoAModificar.especialidad.descripcion,
      nombre_paciente: turnoAModificar.profiles.nombre,
      apellido_paciente: turnoAModificar.profiles.apellido,
      email_paciente: turnoAModificar.profiles.email,
      nombre_medico: turnoAModificar.medico.nombre,
      apellido_medico: turnoAModificar.medico.apellido,
    });
    setTurnoNuevo({
      fecha: nuevoTurno.id,
      cod_turno: turnoAModificar.cod_turno,
      medico: turnoAModificar.medico,
      descripcion: turnoAModificar?.especialidad?.descripcion,
    });
    // Abrir modal de modificación inmediatamente
    setShowModificar(true);
  };

  return (
    <>
      {turnoAModificar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">
              Selecciona un nuevo turno para {turnoAModificar.medico.nombre}{" "}
              {turnoAModificar.medico.apellido}{" "}
              {turnoAModificar.especialidad.descripcion}
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-muted-foreground">Cargando turnos...</p>
                </div>
              ) : turnosFormateados.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay turnos disponibles para este médico.
                </p>
              ) : (
                turnosFormateados.map((turno: any) => (
                  <Card key={turno.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {turnoAModificar.medico.nombre}{" "}
                          {turnoAModificar.medico.apellido} -{" "}
                          {turnoAModificar.especialidad.descripcion}
                        </p>
                        <p>
                          {turno.fecha} - {turno.hora}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          seleccionarNuevoTurno(turnoAModificar, turno)
                        }
                      >
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

      {showModificar && (
        <Modificar
          turnoViejo={turnoViejo}
          turnoNuevo={turnoNuevo}
          setTurnoAModificar={setTurnoAModificar}
          onClose={() => setShowModificar(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};
