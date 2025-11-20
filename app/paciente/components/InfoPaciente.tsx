import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditarContacto from "./EditarContacto";

interface PacienteData {
  dni_paciente?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

interface InfoPacienteProps {
  pacienteData?: PacienteData | null;
}

interface DatosEditables {
  nombre: string;
  apellido: string;
  telefono: string;
}

const InfoPaciente = ({
  pacienteData,
  userId,
}: InfoPacienteProps & { userId: string }) => {
  const [datosEditables, setDatosEditables] = useState<DatosEditables>({
    nombre: pacienteData?.nombre || "No disponible",
    apellido: pacienteData?.apellido || "No disponible",
    telefono: pacienteData?.telefono || "No disponible",
  });

  const [editando, setEditando] = useState(false);
  const [datosTemp, setDatosTemp] = useState<DatosEditables>(datosEditables);

  useEffect(() => {
    if (pacienteData) {
      const nuevosDatos = {
        nombre: pacienteData.nombre || "No disponible",
        apellido: pacienteData.apellido || "No disponible",
        telefono: pacienteData.telefono || "No disponible",
      };
      setDatosEditables(nuevosDatos);
      setDatosTemp(nuevosDatos);
    }
  }, [pacienteData]);

  const handleGuardado = (nuevosDatos: DatosEditables) => {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>Algunos datos pueden ser modificados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editando ? (
          <EditarContacto
            id={userId}
            datosTemp={datosTemp}
            setDatosTemp={setDatosTemp}
            setDatos={setDatosEditables}
            setEditando={setEditando}
            datos={datosEditables}
            onGuardar={handleGuardado}
          />
        ) : (
          <>
            <div className="flex flex-row gap-5">
              <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nombre
              </label>
              <p className="text-lg">{datosEditables.nombre}</p>
              </div>
              <div>
              <label className="text-sm font-medium text-muted-foreground">
                Apellido
              </label>
              <p className="text-lg">{datosEditables.apellido}</p>
            </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                DNI
              </label>
              <p className="text-lg text-muted-foreground">
                {pacienteData?.dni_paciente || "No disponible"}
                <span className="text-xs ml-2">(No editable)</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Teléfono
              </label>
              <p className="text-lg">{datosEditables.telefono}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Correo Electrónico
              </label>
              <p className="text-lg text-muted-foreground">
                {pacienteData?.email || "No disponible"}
                <span className="text-xs ml-2">(No editable)</span>
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setDatosTemp(datosEditables);
                setEditando(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Datos
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InfoPaciente;
