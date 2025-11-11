import React, { useState } from "react";
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
  const [errores, setErrores] = useState<{
    nombre?: string;
    apellido?: string;
    telefono?: string;
  }>({});

  const esFormularioValido = (): boolean => {
    const nombreValido =
      datosTemp.nombre.trim().length >= 2 &&
      !/\d/.test(datosTemp.nombre.trim());

    const apellidoValido =
      datosTemp.apellido.trim().length >= 2 &&
      !/\d/.test(datosTemp.apellido.trim());

    const telefonoValido =
      datosTemp.telefono.trim().length >= 9 &&
      /^\d+$/.test(datosTemp.telefono.trim());

    return nombreValido && apellidoValido && telefonoValido;
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: typeof errores = {};

    if (!datosTemp.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (datosTemp.nombre.trim().length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (/\d/.test(datosTemp.nombre.trim())) {
      nuevosErrores.nombre = "El nombre no puede contener números";
    }

    if (!datosTemp.apellido.trim()) {
      nuevosErrores.apellido = "El apellido es obligatorio";
    } else if (datosTemp.apellido.trim().length < 2) {
      nuevosErrores.apellido = "El apellido debe tener al menos 2 caracteres";
    } else if (/\d/.test(datosTemp.apellido.trim())) {
      nuevosErrores.apellido = "El apellido no puede contener números";
    }

    if (!datosTemp.telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!/^\d+$/.test(datosTemp.telefono.trim())) {
      nuevosErrores.telefono = "El teléfono debe contener solo números";
    } else if (datosTemp.telefono.trim().length < 9) {
      nuevosErrores.telefono = "El teléfono debe tener al menos 9 dígitos";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setDatos(datosTemp);
      const guardadoExitoso = await guardarDatosEnBaseDatos(datosTemp, id);

      if (guardadoExitoso) {
        setEditando(false);
        setErrores({});

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
    setErrores({});
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (valor === "" || /^\d+$/.test(valor)) {
      setDatosTemp({
        ...datosTemp,
        telefono: valor,
      });
      if (errores.telefono) {
        setErrores({ ...errores, telefono: undefined });
      }
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (!/\d/.test(valor)) {
      setDatosTemp({
        ...datosTemp,
        nombre: valor,
      });
      if (errores.nombre) {
        setErrores({ ...errores, nombre: undefined });
      }
    }
  };

  const handleApellidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (!/\d/.test(valor)) {
      setDatosTemp({
        ...datosTemp,
        apellido: valor,
      });
      if (errores.apellido) {
        setErrores({ ...errores, apellido: undefined });
      }
    }
  };

  return (
    <>
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Nombre
        </label>
        <input
          className={`w-full mt-1 p-2 border rounded-lg ${
            errores.nombre ? "border-red-500" : ""
          }`}
          value={datosTemp.nombre}
          onChange={handleNombreChange}
          placeholder="Sin números, mínimo 2 caracteres"
        />
        {errores.nombre && (
          <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Apellido
        </label>
        <input
          className={`w-full mt-1 p-2 border rounded-lg ${
            errores.apellido ? "border-red-500" : ""
          }`}
          value={datosTemp.apellido}
          onChange={handleApellidoChange}
          placeholder="Sin números, mínimo 2 caracteres"
        />
        {errores.apellido && (
          <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Teléfono
        </label>
        <input
          className={`w-full mt-1 p-2 border rounded-lg ${
            errores.telefono ? "border-red-500" : ""
          }`}
          value={datosTemp.telefono}
          onChange={handleTelefonoChange}
          placeholder="Solo números"
        />
        {errores.telefono && (
          <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>
        )}
      </div>
      <Button variant="outline" className="w-full" onClick={handleCancelar}>
        Cancelar
      </Button>
      <div className="flex gap-2">
        <Button
          className="w-full"
          onClick={handleGuardar}
          disabled={!esFormularioValido()}
        >
          Guardar
        </Button>
      </div>
    </>
  );
};

export default EditarContacto;
