"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { UserPlus, Heart } from "lucide-react";
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
      medicos.map(async (medico) => {
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

          let especialidades = [];
          if (especialidadesResponse.ok) {
            especialidades = await especialidadesResponse.json();
            if (!Array.isArray(especialidades)) {
              especialidades = [];
            }
          }
          //armo un objeto medico que para agrear un arreglo de especialidades por cada medico
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

  useEffect(() => {
    const fetchMedicos = async () => {
      setLoading(true);

      // Obtener médicos con especialidades ya incluidas
      const medicos = await getMedicos();
      setMedicosConEspecialidades(medicos);

      setLoading(false);
    };

    fetchMedicos();
  }, []);
  // para filtrar
  const allMedicos = useMemo(() => {
    if (!search) return medicosConEspecialidades;
    const q = search.toLowerCase();
    return medicosConEspecialidades.filter((m: any) => {
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
            placeholder="Buscar medico..."
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

      <div className="grid gap-4">
        {allMedicos.map((medico) => (
          <Card key={medico.legajo_medico}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Heart className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {medico.nombre} {medico.apellido}
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        <strong>Especialidades:</strong>
                        {medico.especialidades &&
                        medico.especialidades.length > 0 ? (
                          medico.especialidades.map(
                            (especialidad: any, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {especialidad.descripcion || "Sin nombre"}
                              </Badge>
                            )
                          )
                        ) : (
                          <span className="text-gray-500">
                            Sin especialidades
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      medico.estado === "activo" ? "default" : "secondary"
                    }
                  >
                    {medico.estado || "activo"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/agenda`)
                    }
                  >
                    {medico.agenda ? "Modificar Agenda" : "Crear Agenda"}
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href = `/administrativo/medicos/${medico.legajo_medico}/turnos`)
                    }
                    variant="outline"
                    size="sm"
                  >
                    Ver Turnos
                  </Button>
                  <Button
                    variant={
                      medico.estado === "activo" ? "destructive" : "default"
                    }
                    size="sm"
                    onClick={() => {
                      console.log(
                        "Toggle estado médico:",
                        medico.legajo_medico
                      );
                    }}
                  >
                    {medico.estado === "activo" ? "Inhabilitar" : "Habilitar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );
}
