import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DialogSolicitud from "./DialogSolicitud";

interface NoMatchesProps {
  filtroEspecialidad: string;
  filtroMedico?: string;
}

async function getEspecialidad(id_especialidad: string) {
  const response = await fetch(
    `/api/especialidad?id_especialidad=${id_especialidad}`
  );
  if (!response.ok) {
    throw new Error("Error al obtener especialidades");
  }
  const data = await response.json();
  return data;
}

const NoMatches: React.FC<NoMatchesProps> = ({
  filtroEspecialidad,
  filtroMedico,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [descripcionEspecialidad, setDescripcionEspecialidad] =
    useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const especialidadData = await getEspecialidad(filtroEspecialidad);
        setDescripcionEspecialidad(especialidadData.data.descripcion);
      } catch (error) {
        setDescripcionEspecialidad(filtroEspecialidad);
      }
    };

    if (filtroEspecialidad) {
      fetchData();
    }
  }, [filtroEspecialidad]);

  return (
    <>
      <p className="text-muted-foreground">
        No hay turnos disponibles con esos filtros.
      </p>
      {filtroEspecialidad && filtroEspecialidad !== "" && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => setDialogOpen(true)}
          >
            Solicitar ingreso a lista de espera
          </Button>
        </div>
      )}

      <DialogSolicitud
        id_especialidad={filtroEspecialidad}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        especialidad={descripcionEspecialidad}
        medico={filtroMedico}
        loading={false}
        resultado={null}
        error={null}
        onConfirm={() => {}}
      />
    </>
  );
};

export default NoMatches;
