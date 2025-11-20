"use client";
import React from "react";
import { Stethoscope } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { useEffect, useState } from "react";

interface HeaderPacienteProps {
  dni: number;
}

export default function HeaderPaciente({ dni }: HeaderPacienteProps) {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    const getNombrePaciente = async () => {
      if (!dni) return;
      try {
        const res = await fetch(`/api/nombrePaciente?dni_paciente=${encodeURIComponent(dni)}`);
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        const data = await res.json();
        setNombre(data.nombre_completo ?? "Paciente");
      } catch (error) {
        console.warn("Error obteniendo nombre:", error);
        setNombre("Paciente");
      }
    };

    getNombrePaciente();
  }, [dni]);

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mi Portal de Salud</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {nombre ? nombre : "Cargando..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

