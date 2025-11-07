"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Command } from "@/components/ui/command";

interface ObraSocial {
  id_obra: string;
  descripcion: string;
  estado: string;
}

interface Especialidad {
  id_especialidad: string;
  descripcion: string;
}

export function AddMedicoForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] =
    useState<string[]>([]);
  const [dni, setDni] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipoMatricula, setTipoMatricula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pesosArgentinos, setPesosArgentinos] = useState("");
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [obrasSocialesSeleccionadas, setObrasSocialesSeleccionadas] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Cargar obras sociales y especialidades al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar obras sociales
        const responseObras = await fetch("/api/obraSocial");
        if (responseObras.ok) {
          const obrasData = await responseObras.json();
          setObrasSociales(obrasData.data || []);
          // Marcar todas las obras sociales por defecto
          setObrasSocialesSeleccionadas(
            obrasData.data?.map((obra: ObraSocial) => obra.id_obra) || []
          );
        }

        // Cargar especialidades
        const responseEspecialidades = await fetch("/api/especialidades");
        if (responseEspecialidades.ok) {
          const especialidadesData = await responseEspecialidades.json();
          setEspecialidades(especialidadesData.data || []);
        }
      } catch (error) {
        setError("Error al cargar los datos necesarios");
      } finally {
        setIsLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  const handleObraSocialChange = (obraId: string, checked: boolean) => {
    if (checked) {
      setObrasSocialesSeleccionadas((prev) => [...prev, obraId]);
    } else {
      setObrasSocialesSeleccionadas((prev) =>
        prev.filter((id) => id !== obraId)
      );
    }
  };

  // Función para manejar selección de especialidades
  const handleEspecialidadChange = (
    especialidadId: string,
    checked: boolean
  ) => {
    if (checked) {
      setEspecialidadesSeleccionadas((prev) => [...prev, especialidadId]);
    } else {
      setEspecialidadesSeleccionadas((prev) =>
        prev.filter((id) => id !== especialidadId)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validaciones básicas
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      setIsLoading(false);
      return;
    }

    if (!apellido.trim()) {
      setError("El apellido es requerido");
      setIsLoading(false);
      return;
    }

    if (especialidadesSeleccionadas.length === 0) {
      setError("Debe seleccionar al menos una especialidad");
      setIsLoading(false);
      return;
    }

    if (!dni.trim()) {
      setError("El DNI es requerido");
      setIsLoading(false);
      return;
    }

    if (!matricula.trim()) {
      setError("La matrícula es requerida");
      setIsLoading(false);
      return;
    }

    if (!tipoMatricula.trim()) {
      setError("El tipo de matrícula es requerido");
      setIsLoading(false);
      return;
    }

    if (!telefono.trim()) {
      setError("El teléfono es requerido");
      setIsLoading(false);
      return;
    }

    if (!pesosArgentinos.trim()) {
      setError("El monto en pesos argentinos es requerido");
      setIsLoading(false);
      return;
    }

    try {
      // Construccion final de la matricula con el tipoMatricula
      const construirMatriculaConPrefijo = (
        tipo: string,
        numero: string
      ): string => {
        const mapping: Record<string, string> = {
          nacional: "MN",
          provincial: "MP",
        };

        const prefix = mapping[tipo] || "";

        // Normalize number: trim and remove spaces
        const raw = (numero || "").trim();

        if (!prefix) return raw;

        // If already starts with prefix (case-insensitive), return as-is (normalized)
        if (raw.toUpperCase().startsWith(prefix.toUpperCase())) {
          return raw.toUpperCase();
        }

        return `${prefix}${raw}`.toUpperCase();
      };

      const matriculaFinal = construirMatriculaConPrefijo(tipoMatricula, matricula);
      const response = await fetch("/api/medico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          apellido,
          especialidades: especialidadesSeleccionadas, // Cambiado a array
          dni,
          matricula: matriculaFinal,
          tipoMatricula,
          telefono,
          pesosArgentinos,
          obrasSociales: obrasSocialesSeleccionadas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el médico");
      }

      const result = await response.json();
      setSuccess(true);

      // Limpiar formulario
      setNombre("");
      setApellido("");
      setEspecialidadesSeleccionadas([]);
      setDni("");
      setMatricula("");
      setTipoMatricula("");
      setTelefono("");
      setPesosArgentinos("");
      setObrasSocialesSeleccionadas(obrasSociales.map((obra) => obra.id_obra));

      setTimeout(() => {
        router.push("/administrativo/dashboard");
      }, 2000);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al crear el médico"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/administrativo/dashboard");
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Botón Cancelar */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nuevo Médico</CardTitle>
          <CardDescription>
            Registra un nuevo médico en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Nombre */}
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Ej: Juan Carlos"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              {/* Apellido */}
              <div className="grid gap-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Ej: Pérez"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>

              {/* Especialidades - VERSIÓN RADIO (selección única) */}
              <div className="grid gap-4">
                <Label>Especialidades *</Label>
                <p className="text-sm text-gray-600">
                  Selecciona la especialidad principal del médico (solo se puede elegir una)
                </p>
                <RadioGroup
                  value={especialidadesSeleccionadas[0] || ""}
                  onValueChange={(val) => setEspecialidadesSeleccionadas([val])}
                  className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4"
                >
                  {especialidades.map((esp) => (
                    <div
                      key={esp.id_especialidad}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={esp.id_especialidad}
                        id={`esp-${esp.id_especialidad}`}
                      />
                      <Label
                        htmlFor={`esp-${esp.id_especialidad}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {esp.descripcion}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-gray-500">
                  {especialidadesSeleccionadas.length} especialidad(es)
                  seleccionada(s)
                </p>
              </div>

              {/* DNI */}
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  type="text"
                  placeholder="Ej: 12345678"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              {/* Matrícula */}
              <div className="grid gap-2">
                <Label htmlFor="tipoMatricula">Tipo de Matrícula *</Label>
                <Select
                  onValueChange={(value) => setTipoMatricula(value)}
                  value={tipoMatricula}
                >
                    <SelectTrigger id="tipoMatricula">
                      <SelectValue placeholder="Selecciona tipo de matrícula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="provincial">Provincial</SelectItem>
                    </SelectContent>
                </Select>

                <Label htmlFor="matricula" className="mt-2">Número de Matrícula *</Label>
                <Input
                  id="matricula"
                  type="text"
                  placeholder="Ej: 123456"
                  required
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
              </div>

              {/* Teléfono */}
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="Ej: +54 11 1234-5678"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              {/* Pesos Argentinos */}
              <div className="grid gap-2">
                <Label htmlFor="pesosArgentinos">
                  Tarifa (Pesos Argentinos) *
                </Label>
                <Input
                  id="pesosArgentinos"
                  type="number"
                  placeholder="Ej: 15000"
                  required
                  value={pesosArgentinos}
                  onChange={(e) => setPesosArgentinos(e.target.value)}
                />
              </div>

              {/* Obras Sociales */}
              <div className="grid gap-4">
                <Label>Obras Sociales</Label>
                <p className="text-sm text-gray-600">
                  Selecciona las obras sociales con las que trabaja este médico
                  (todas están marcadas por defecto)
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {obrasSociales.map((obra) => (
                    <div
                      key={obra.id_obra}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={obra.id_obra}
                        checked={obrasSocialesSeleccionadas.includes(
                          obra.id_obra
                        )}
                        onCheckedChange={(checked) =>
                          handleObraSocialChange(
                            obra.id_obra,
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor={obra.id_obra}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {obra.descripcion}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {obrasSocialesSeleccionadas.length} obra(s) social(es)
                  seleccionada(s)
                </p>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  <p className="text-sm">
                    Médico creado exitosamente. Redirigiendo...
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Creando..." : "Crear Médico"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
