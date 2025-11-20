"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
async function getMedicos() {
  try {
    //obtengo los medicos
    const response = await fetch("/api/medico", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Error al obtener medicos");
    }

    const medicos = await response.json();

    if (!Array.isArray(medicos)) {
      return [];
    }
    //obtengo las especialidades por cada medico
    const medicosConEspecialidades = await Promise.all(
      medicos.map(async (medico: any) => {
        try {
          const especialidadesResponse = await fetch(
            `/api/medico/medico-especialidad?legajo_medico=${medico.legajo_medico}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          let especialidades: any[] = [];
          if (especialidadesResponse.ok) {
            especialidades = await especialidadesResponse.json();
            if (!Array.isArray(especialidades)) {
              especialidades = [];
            }
          }
          return {
            ...medico,
            especialidades: especialidades,
          };
        } catch (error) {
          console.error(
            `Error obteniendo especialidades para médico ${medico.legajo_medico}:`,
            error
          );
          return {
            ...medico,
            especialidades: [],
          };
        }
      })
    );

    return medicosConEspecialidades;
  } catch (error) {
    console.error("Error en getMedicos:", error);
    return [];
  }
}

export default function MedicoTab() {
  const [medicosConEspecialidades, setMedicosConEspecialidades] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [medicoToToggle, setMedicoToToggle] = useState<any>(null);
  const handleToggleEstado = (medico: any) => {
    setMedicoToToggle(medico);
    setShowConfirmDialog(true);
  };
  const confirmToggleEstado = async () => {
    if (!medicoToToggle) return;

    const nuevoEstado =
      medicoToToggle.estado === "activo" ? "inactivo" : "activo";
    setNotice(null);

    try {
      const res = await fetch("/api/medico/medico-estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legajo_medico: medicoToToggle.legajo_medico,
          estado: nuevoEstado,
        }),
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {}

      if (res.status === 409) {
        setNotice({
          type: "error",
          text:
            json?.message ??
            "No se puede inhabilitar el médico porque tiene turnos asignados a futuro.",
        });
        setShowConfirmDialog(false);
        setMedicoToToggle(null);
        return;
      }

      if (!res.ok || !json?.ok) {
        setNotice({
          type: "error",
          text: json?.message ?? "No se pudo actualizar el estado del médico.",
        });
        setShowConfirmDialog(false);
        setMedicoToToggle(null);
        return;
      }

      setMedicosConEspecialidades((prev) =>
        prev.map((m) =>
          Number(m.legajo_medico) === Number(medicoToToggle.legajo_medico)
            ? { ...m, estado: nuevoEstado }
            : m
        )
      );

      setNotice({
        type: "success",
        text: `Estado actualizado a "${nuevoEstado}".`,
      });
      ///ACA METER RQUEST PARA ELIMINAR
      await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legajo_medico: medicoToToggle.legajo_medico,
        }),
      });
    } catch (err: any) {
      setNotice({
        type: "error",
        text: err?.message ?? "Error de red al actualizar el estado.",
      });
    }
    setMedicosConEspecialidades((prev) =>
      prev.map((m) =>
        Number(m.legajo_medico) === Number(medicoToToggle.legajo_medico)
          ? {
              ...m,
              estado: nuevoEstado,
              // Si se inhabilitó, remover el id_agenda
              id_agenda: nuevoEstado === "inactivo" ? null : m.id_agenda,
            }
          : m
      )
    );
    setShowConfirmDialog(false);
    setMedicoToToggle(null);
  };

  const cancelToggleEstado = () => {
    setShowConfirmDialog(false);
    setMedicoToToggle(null);
  };
  // NUEVO: estado para el cartel (notice)
  const [notice, setNotice] = useState<null | {
    type: "error" | "success" | "info";
    text: string;
  }>(null);
  const [showAviso, setShowAviso] = useState(false);
  useEffect(() => {
    const fetchMedicos = async () => {
      setLoading(true);
      const medicos = await getMedicos();
      setMedicosConEspecialidades(medicos);
      setLoading(false);
    };

    fetchMedicos();
  }, []);

  const allMedicos = useMemo(() => {
    let filtrados = medicosConEspecialidades;
    if (search) {
      const q = search.toLowerCase();
      filtrados = medicosConEspecialidades.filter((m: any) => {
        const nombreMatch = (m.nombre || "").toLowerCase().includes(q);
        const apellidoMatch = (m.apellido || "").toLowerCase().includes(q);
        const nombreCompletoMatch = `${m.nombre || ""} ${m.apellido || ""}`
          .toLowerCase()
          .includes(q);
        const dniMatch = String(m.dni_medico || "")
          .toLowerCase()
          .includes(q);
        const legajoMatch = String(m.legajo_medico || "")
          .toLowerCase()
          .includes(q);
        const telefonoMatch = String(m.telefono || "")
          .toLowerCase()
          .includes(q);
        const especialidadesMatch =
          m.especialidades &&
          m.especialidades.some((esp: any) =>
            (esp.descripcion || "").toLowerCase().includes(q)
          );

        return (
          nombreMatch ||
          apellidoMatch ||
          nombreCompletoMatch ||
          dniMatch ||
          legajoMatch ||
          telefonoMatch ||
          especialidadesMatch
        );
      });
    }

    // --- Orden por estado ---
    return filtrados.sort((a: any, b: any) => {
      if (
        a.estado?.toLowerCase() === "activo" &&
        b.estado?.toLowerCase() !== "activo"
      )
        return -1;
      if (
        a.estado?.toLowerCase() !== "activo" &&
        b.estado?.toLowerCase() === "activo"
      )
        return 1;

      return a.nombre?.localeCompare(b.nombre || "");
    });
  }, [search, medicosConEspecialidades]);

  return (
    <TabsContent value="medicos" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Médicos</h2>
        <section className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar médico..."
            className="w-45"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>
        <Button
          onClick={() =>
            (window.location.href = "/administrativo/medicos/nuevo")
          }
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Registrar Nuevo Médico
        </Button>
      </div>

      {/* NUEVO: Cartel de aviso */}
      {notice && (
        <div
          role="alert"
          className={`rounded-lg p-3 border text-sm flex items-start justify-between ${
            notice.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : notice.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="flex items-center justify-center rounded-full border ml-3 w-6 h-6 hover:bg-white"
            aria-label="Cerrar aviso"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      )}
      {/* Modal FUERA del map - UNO SOLO para todos los médicos */}
      {showConfirmDialog && medicoToToggle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {medicoToToggle.estado === "activo"
                  ? "Confirmar Inhabilitación"
                  : "Confirmar Habilitación"}
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                ¿Está seguro que desea{" "}
                {medicoToToggle.estado === "activo"
                  ? "inhabilitar"
                  : "habilitar"}{" "}
                al médico{" "}
                <strong>
                  {medicoToToggle.nombre} {medicoToToggle.apellido}
                </strong>
                ?
              </p>
              {medicoToToggle.estado === "activo" && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                  <p className="text-orange-700 text-sm">
                    <strong>⚠️ Advertencia:</strong> Al inhabilitar este médico,
                    su agenda será reestablecida y se perderán todas las
                    configuraciones de horarios actuales.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={cancelToggleEstado}>
                Cancelar
              </Button>
              <Button
                variant={
                  medicoToToggle.estado === "activo" ? "destructive" : "default"
                }
                onClick={confirmToggleEstado}
              >
                Sí,{" "}
                {medicoToToggle.estado === "activo"
                  ? "Inhabilitar"
                  : "Habilitar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nombre Completo</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Agenda</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMedicos.map((medico: any) => (
              <TableRow key={medico.legajo_medico}>
                {medico.estado == "inactivo" ? (
                  <TableCell className="font-medium text-gray-500">
                    {medico.nombre} {medico.apellido}
                  </TableCell>
                ) : (
                  <TableCell className="font-medium">
                    {medico.nombre} {medico.apellido}
                  </TableCell>
                )}
                <TableCell>
                  <div className={`flex flex-wrap gap-1`}>
                    {medico.especialidades &&
                    medico.especialidades.length > 0 ? (
                      medico.especialidades.map(
                        (especialidad: any, index: number) => (
                          <Badge
                            key={index}
                            variant="default"
                            className={`text-xs ${
                              medico.estado === "inactivo"
                                ? "bg-white-300 text-gray-600 border border-gray-150 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {especialidad.descripcion || "Sin nombre"}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-gray-500">Sin especialidades</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      medico.estado === "activo" ? "secondary" : "disabled"
                    }
                  >
                    {medico.estado || "activo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {medico?.id_agenda ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/agenda/modificarAgenda`)
                      }
                      disabled={medico.estado == "inactivo"}
                    >
                      Modificar Agenda
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/agenda/nuevaAgenda`)
                      }
                      disabled={medico.estado == "inactivo"}
                    >
                      Registrar Agenda
                    </Button>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/datos/modificarDatos`)
                      }
                      disabled={medico.estado == "inactivo"}
                    >
                      Modificar Datos
                    </Button>
                    <Button
                      variant={
                        medico.estado === "activo" ? "destructive" : "outline"
                      }
                      onClick={() => handleToggleEstado(medico)}
                    >
                      {medico.estado === "activo" ? "Inhabilitar" : "Habilitar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}
