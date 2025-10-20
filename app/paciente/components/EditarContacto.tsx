import React from "react";
import { Button } from "@/components/ui/button";

interface DatosEditables {
  nombre: string;
  apellido: string;
  telefono: string;
}

interface EditarContactoProps {
  id: string;
  datosTemp: DatosEditables;
  setDatosTemp: React.Dispatch<React.SetStateAction<DatosEditables>>;
  setDatos: React.Dispatch<React.SetStateAction<DatosEditables>>;
  setEditando: React.Dispatch<React.SetStateAction<boolean>>;
  datos: DatosEditables;
  onGuardar?: (nuevosDatos: DatosEditables) => void;
}

async function guardarDatosEnBaseDatos(
  nuevosDatos: DatosEditables,
  id: string
) {
  console.log("nuevos datos", nuevosDatos);
  console.log("id", id);
  try {
    const response = await fetch("/api/paciente", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nuevosDatos, id }),
    });

    return true;
  } catch (error) {
    return false;
  }
}

const EditarContacto: React.FC<EditarContactoProps> = ({
  id,
  datosTemp,
  setDatosTemp,
  setDatos,
  setEditando,
  datos,
  onGuardar,
}) => {
  const handleGuardar = async () => {
    try {
      setDatos(datosTemp);
      console.log(
        "HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      );
      const guardadoExitoso = await guardarDatosEnBaseDatos(datosTemp, id);

      if (guardadoExitoso) {
        setEditando(false);

        if (onGuardar) {
          onGuardar(datosTemp);
        }
      } else {
        setDatosTemp(datos);
      }
    } catch (error) {}
  };

  const handleCancelar = () => {
    setDatosTemp(datos);
    setEditando(false);
  };

  return (
    <>
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Nombre
        </label>
        <input
          className="w-full mt-1 p-2 border rounded-lg"
          value={datosTemp.nombre}
          onChange={(e) =>
            setDatosTemp({
              ...datosTemp,
              nombre: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Apellido
        </label>
        <input
          className="w-full mt-1 p-2 border rounded-lg"
          value={datosTemp.apellido}
          onChange={(e) =>
            setDatosTemp({
              ...datosTemp,
              apellido: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Teléfono
        </label>
        <input
          className="w-full mt-1 p-2 border rounded-lg"
          value={datosTemp.telefono}
          onChange={(e) =>
            setDatosTemp({
              ...datosTemp,
              telefono: e.target.value,
            })
          }
        />
      </div>

      <div className="flex gap-2">
        <Button className="w-full" onClick={handleGuardar}>
          Guardar
        </Button>
        <Button variant="outline" className="w-full" onClick={handleCancelar}>
          Cancelar
        </Button>
      </div>
    </>
  );
};

export default EditarContacto;
