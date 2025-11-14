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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export function AddObraForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nombreObraSocial, setNombreObraSocial] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [fechaVigencia, setFechaVigencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validaciones básicas
    if (!nombreObraSocial.trim()) {
      setError("El nombre de la obra social es requerido");
      setIsLoading(false);
      return;
    }

    if (!fechaVigencia) {
      setError("La fecha de vigencia es requerida");
      setIsLoading(false);
      return;
    }

    const fechaSeleccionada = new Date(fechaVigencia);
    const hoy = new Date();

    // Resetear horas para comparar solo fechas
    fechaSeleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      setError("La fecha de vigencia no puede ser anterior a hoy");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Creando obra social:", {
        nombre: nombreObraSocial,
        telefono: telefonoContacto,
        sitio: sitioWeb,
        fecha: fechaVigencia,
      });

      const response = await fetch("/api/obraSocial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            descripcion: nombreObraSocial.trim(),
            telefono_contacto: telefonoContacto.trim() || null,
            sitioweb: sitioWeb.trim() || null,
            fecha_vigencia: fechaVigencia,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la obra social");
      }

      const result = await response.json();
      console.log("Obra social creada exitosamente:", result);

      setSuccess(true);

      // Limpiar formulario
      setNombreObraSocial("");
      setTelefonoContacto("");
      setSitioWeb("");
      setFechaVigencia("");

      // Redirigir después de un momento
      setTimeout(() => {
        router.push("/administrativo/dashboard");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error al crear obra social:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al crear la obra social"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/administrativo/dashboard");
  };

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
          <CardTitle className="text-2xl">Nueva Obra Social</CardTitle>
          <CardDescription>
            Registra una nueva obra social en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Nombre de la Obra Social */}
              <div className="grid gap-2">
                <Label htmlFor="nombreObraSocial">
                  Nombre de la Obra Social *
                </Label>
                <Input
                  id="nombreObraSocial"
                  type="text"
                  placeholder="Ej: OSDE, Swiss Medical, PAMI"
                  required
                  value={nombreObraSocial}
                  onChange={(e) => setNombreObraSocial(e.target.value)}
                />
              </div>

              {/* Teléfono de Contacto */}
              <div className="grid gap-2">
                <Label htmlFor="telefonoContacto">Teléfono de Contacto</Label>
                <Input
                  id="telefonoContacto"
                  type="tel"
                  placeholder="Ej: +54 11 1234-5678"
                  value={telefonoContacto}
                  onChange={(e) => setTelefonoContacto(e.target.value)}
                />
              </div>

              {/* Sitio Web */}
              <div className="grid gap-2">
                <Label htmlFor="sitioWeb">Sitio Web</Label>
                <Input
                  id="sitioWeb"
                  type="url"
                  placeholder="Ej: https://www.osde.com.ar"
                  value={sitioWeb}
                  onChange={(e) => setSitioWeb(e.target.value)}
                />
              </div>

              {/* Fecha de Vigencia */}
              <div className="grid gap-2">
                <Label htmlFor="fechaVigencia">Fecha de Vigencia *</Label>
                <Input
                  id="fechaVigencia"
                  type="date"
                  required
                  value={fechaVigencia}
                  onChange={(e) => setFechaVigencia(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} // No permitir fechas pasadas
                />
                <p className="text-xs text-gray-500">
                  Fecha hasta la cual la obra social estará vigente
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
                    Obra social creada exitosamente. Redirigiendo...
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
                  {isLoading ? "Creando..." : "Crear Obra Social"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
