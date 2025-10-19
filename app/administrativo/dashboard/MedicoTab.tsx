"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { UserPlus, Heart } from "lucide-react";

async function getMedicos() {
  try {
    const response = await fetch("/api/medico", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Error al obtener medicos");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: ", error);
    return [];
  }
}

async function getEspecialidadesMedico(legajo_medico: string) {
  try {
    // Usar query parameters en lugar de body para GET
    const response = await fetch(
      `/api/medico/medico-especialidad?legajo_medico=${legajo_medico}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener especialidades");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error obteniendo especialidades:", error);
    return [];
  }
}

export default function MedicoTab() {
  const [allMedicos, setAllMedicos] = useState<any[]>([]);
  const [medicosConEspecialidades, setMedicosConEspecialidades] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicosYEspecialidades = async () => {
      setLoading(true);

      // Obtener médicos
      const medicos = await getMedicos();
      setAllMedicos(Array.isArray(medicos) ? medicos : []);

      // Obtener especialidades para cada médico
      const medicosConEsp = await Promise.all(
        medicos.map(async (medico: any) => {
          const especialidades = await getEspecialidadesMedico(
            medico.legajo_medico
          );
          return {
            ...medico,
            especialidades: Array.isArray(especialidades) ? especialidades : [],
          };
        })
      );

      setMedicosConEspecialidades(medicosConEsp);
      setLoading(false);
    };

    fetchMedicosYEspecialidades();
  }, []);

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
        {medicosConEspecialidades.map((medico) => (
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
                                {especialidad.descripcion ||
                                  especialidad.nombre ||
                                  "Sin nombre"}
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
                      // Implementar lógica de habilitar/inhabilitar
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
