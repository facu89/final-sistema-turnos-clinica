import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ObraSocial {
  id_obra: string | number;
  descripcion: string | null;
  telefono_contacto?: string | number | null;
  sitio_web?: string | null; // si en tu API es "sitio_web"
  fecha_cambio_estado: string;
  estado: string;
  created_at: string;
}

// Helper para evitar errores de .trim() cuando llega number/null
const safeTrim = (v: any) => {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
};

const getObrasSociales = async () => {
  try {
    const response = await fetch("/api/obraSocial", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

export const ObraSocialTab = () => {
  const [obras, setObras] = useState<ObraSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedObra, setSelectedObra] = useState<ObraSocial | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de edición
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");

  const loadObras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getObrasSociales();
      const ordenEstados = { Habilitado: 1, Pendiente: 2, Deshabilitado: 3 };
      const obrasOrdenadas = (data || []).sort((a: any, b: any) => {
        const ordenA =
          ordenEstados[a.estado as keyof typeof ordenEstados] || 99;
        const ordenB =
          ordenEstados[b.estado as keyof typeof ordenEstados] || 99;
        return ordenA - ordenB;
      });
      setObras(obrasOrdenadas || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeshabilitar = async (
    id_obra: string | number,
    descripcion: string
  ) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/obraSocial`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id_obra,
          estado: "Deshabilitado",
          fecha_vigencia: null,
          descripcion,
        }),
      });

      if (response.ok) {
        await loadObras();
      } else {
        setError("Error al deshabilitar obra social");
      }
    } catch (error) {
      setError("Error al deshabilitar obra social");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHabilitar = (obra: ObraSocial) => {
    setSelectedObra(obra);
    setNuevaFecha("");
    setShowDialog(true);
  };

  const handleConfirmHabilitar = async () => {
    if (!selectedObra || !nuevaFecha) {
      setError("La fecha de vigencia es requerida");
      return;
    }
    console.log();
    const fechaSeleccionada = new Date(nuevaFecha).toISOString().slice(0, 10);
    const hoy = new Date().toISOString().slice(0, 10);
    // fechaSeleccionada.setHours(0, 0, 0, 0);
    //  hoy.setHours(0, 0, 0, 0);
    console.log("fecha seleccionada por el usuario ", fechaSeleccionada);

    if (fechaSeleccionada < hoy) {
      setError("La fecha de vigencia no puede ser anterior a hoy");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch(`/api/obraSocial`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedObra.id_obra,
          fecha_vigencia: nuevaFecha,
        }),
      });

      if (response.ok) {
        setShowDialog(false);
        setSelectedObra(null);
        setNuevaFecha("");
        await loadObras();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al programar habilitación");
      }
    } catch (error) {
      setError("Error al programar habilitación de obra social");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDialog = () => {
    setShowDialog(false);
    setSelectedObra(null);
    setNuevaFecha("");
    setError(null);
  };

  // Abrir diálogo de edición
  const openEdit = (obra: ObraSocial) => {
    setSelectedObra(obra);
    setEditNombre(safeTrim(obra.descripcion));
    setEditTelefono(safeTrim(obra.telefono_contacto));
    setShowEditDialog(true);
  };

  // Guardar cambios (solo nombre, solo teléfono o ambos)
  const handleSaveEdit = async () => {
    if (!selectedObra) return;

    const nombreOriginal = safeTrim(selectedObra.descripcion);
    const telefonoOriginal = safeTrim(selectedObra.telefono_contacto);

    const nombreNuevo = safeTrim(editNombre);
    const telefonoNuevo = safeTrim(editTelefono);

    const payload: Record<string, any> = { id: selectedObra.id_obra };

    if (nombreNuevo !== nombreOriginal) {
      if (!nombreNuevo) {
        setError("El nombre (descripción) no puede quedar vacío.");
        return;
      }
      payload.descripcion = nombreNuevo;
    }

    if (telefonoNuevo !== telefonoOriginal) {
      payload.telefono_contacto = telefonoNuevo === "" ? null : telefonoNuevo;
    }

    if (!payload.descripcion && !payload.hasOwnProperty("telefono_contacto")) {
      setError("No hay cambios para guardar.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const res = await fetch("/api/obraSocial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo actualizar la obra social");
      }

      setShowEditDialog(false);
      setSelectedObra(null);
      setEditNombre("");
      setEditTelefono("");

      await loadObras();
    } catch (e: any) {
      setError(e?.message ?? "Error al actualizar");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadObras();
  }, []);

  if (isLoading) {
    return (
      <TabsContent value="obras-sociales" className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="obras-sociales" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Obras Sociales</h2>
        <Button
          onClick={() =>
            (window.location.href = "/administrativo/obras-sociales/nueva-obra")
          }
        >
          <FileText className="h-4 w-4 mr-2" />
          Registrar Nueva Obra Social
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadObras}
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Obra Social</TableHead>
              <TableHead className="text-left">Estado</TableHead>
              <TableHead className="text-left">Nro. Teléfono</TableHead>
              <TableHead className="text-left">Sitio Web</TableHead>
              <TableHead className="text-left">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.map((obra) => (
              <TableRow
                key={String(obra.id_obra)}
                className={
                  obra.estado == "Deshabilitado" ? "text-gray-500" : ""
                }
              >
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {safeTrim(obra.descripcion)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vigencia:{" "}
                      {new Date(obra.fecha_cambio_estado).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      obra.estado === "Habilitado"
                        ? "secondary"
                        : obra.estado === "Pendiente"
                          ? "default"
                          : "outline"
                    }
                  >
                    {obra.estado}
                  </Badge>
                </TableCell>
                <TableCell>{safeTrim(obra.telefono_contacto) || "-"}</TableCell>
                <TableCell>
                  {safeTrim(obra.sitio_web) ? (
                    <a
                      href={safeTrim(obra.sitio_web)}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        obra.estado === "Deshabilitado"
                          ? "text-gray-500"
                          : "text-primary underline"
                      }
                    >
                      {safeTrim(obra.sitio_web)}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* MODIFICAR OBRA SOCIAL */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(obra)}
                      disabled={isProcessing || obra.estado === "Deshabilitado"}
                    >
                      Modificar
                    </Button>

                    {/* DESHABILITAR OBRA SOCIAL */}
                    {obra.estado === "Habilitado" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeshabilitar(
                            obra.id_obra,
                            safeTrim(obra.descripcion)
                          )
                        }
                        disabled={isProcessing}
                      >
                        Deshabilitar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHabilitar(obra)}
                        disabled={isProcessing}
                        className="text-black"
                      >
                        Programar Habilitación
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {obras.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay obras sociales registradas</p>
        </div>
      )}

      {/* Dialog para seleccionar fecha de vigencia */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Programar Habilitación</DialogTitle>
            <DialogDescription>
              Seleccioná la fecha desde la cual la obra social{" "}
              <strong>
                {safeTrim(selectedObra?.descripcion)}{" "}
                {selectedObra ? `(${String(selectedObra.id_obra)})` : ""}
              </strong>{" "}
              estará habilitada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha-vigencia">Fecha de Vigencia</Label>
              <Input
                id="fecha-vigencia"
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-gray-500">
                La obra social cambiará automáticamente a "Habilitado" en esta
                fecha.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDialog}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmHabilitar}
              disabled={!nuevaFecha || isProcessing}
            >
              {isProcessing ? "Programando..." : "Programar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edición (nombre / teléfono) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Modificar Obra Social</DialogTitle>
            <DialogDescription>
              Actualizá el nombre y el teléfono de{" "}
              <strong>{safeTrim(selectedObra?.descripcion)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre de la obra social"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={editTelefono}
                onChange={(e) => setEditTelefono(e.target.value)}
                placeholder="Ej: 011 1234-5678"
              />
              <p className="text-xs text-muted-foreground">
                Dejá vacío para quitar el teléfono.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedObra(null);
                setEditNombre("");
                setEditTelefono("");
                setError(null);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
};
