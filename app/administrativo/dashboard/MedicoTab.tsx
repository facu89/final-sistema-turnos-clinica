"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [medicosConEspecialidades, setMedicosConEspecialidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // NUEVO: estado para el cartel (notice)
  const [notice, setNotice] = useState<null | { type: "error" | "success" | "info"; text: string }>(null);

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
    if (!search) return medicosConEspecialidades;
    const q = search.toLowerCase();
    return medicosConEspecialidades.filter((m: any) => {
      const nombreMatch = (m.nombre || "").toLowerCase().includes(q);
      const apellidoMatch = (m.apellido || "").toLowerCase().includes(q);
      const nombreCompletoMatch = `${m.nombre || ""} ${m.apellido || ""}`.toLowerCase().includes(q);
      const dniMatch = String(m.dni_medico || "").toLowerCase().includes(q);
      const legajoMatch = String(m.legajo_medico || "").toLowerCase().includes(q);
      const telefonoMatch = String(m.telefono || "").toLowerCase().includes(q);
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
  }, [search, medicosConEspecialidades]);

  if (loading) {
    return (
      <TabsContent value="medicos" className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando médicos...</p>
          </div>
        </div>
      </TabsContent>
    );
  }

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
          onClick={() => (window.location.href = "/administrativo/medicos/nuevo")}
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

      <div className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nombre Completo</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Turnos</TableHead>
              <TableHead>Agenda</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMedicos.map((medico: any) => (
              <TableRow key={medico.legajo_medico}>
                <TableCell className="font-medium">
                  {medico.nombre} {medico.apellido}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {medico.especialidades && medico.especialidades.length > 0 ? (
                      medico.especialidades.map((especialidad: any, index: number) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {especialidad.descripcion || "Sin nombre"}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">Sin especialidades</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={medico.estado === "activo" ? "secondary" : "outline"}>
                    {medico.estado || "activo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `../administrativo/medicos/${medico.legajo_medico}/TurnosMedico`)
                    }
                  >
                    Ver Turnos
                  </Button>
                </TableCell>
                <TableCell>
                  {medico?.id_agenda ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/agenda/modificarAgenda`)
                      }
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
                    >
                      Registrar Agenda
                    </Button>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/datos/modificarDatos`)
                      }
                    >
                      Modificar Datos
                    </Button>
                    <Button
                      variant={medico.estado === "activo" ? "destructive" : "outline"}
                      size="sm"
                      onClick={async () => {
                        const nuevoEstado =
                          medico.estado === "activo" ? "inactivo" : "activo";
                        setNotice(null);

                        try {
                          const res = await fetch("/api/medico/medico-estado", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              legajo_medico: medico.legajo_medico,
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
                            return;
                          }

                          if (!res.ok || !json?.ok) {
                            setNotice({
                              type: "error",
                              text: json?.message ?? "No se pudo actualizar el estado del médico.",
                            });
                            return;
                          }

                          setMedicosConEspecialidades((prev) =>
                            prev.map((m) =>
                              Number(m.legajo_medico) === Number(medico.legajo_medico)
                                ? { ...m, estado: nuevoEstado }
                                : m
                            )
                          );

                          setNotice({
                            type: "success",
                            text: `Estado actualizado a "${nuevoEstado}".`,
                          });
                        } catch (err: any) {
                          setNotice({
                            type: "error",
                            text: err?.message ?? "Error de red al actualizar el estado.",
                          });
                        }
                      }}
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
