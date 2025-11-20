"use client";

import React, { useState, useEffect } from "react";
import InfoPaciente from "../components/InfoPaciente";
import { TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth/useAuth"; //este hook devuelve el id del usuario con la sesion actual
interface PacienteData {
  dni_paciente?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
async function getPaciente(userId: string) {
  const response = await fetch(`/api/paciente?id_paciente=${userId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  const datos = await response.json();
  return datos;
}

export const PerfilTab = () => {
  const { user, loading: authLoading, userId } = useAuth();
  const [pacienteData, setPacienteData] = useState<PacienteData | null>(null); // ✅ Tipo definido
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (!authLoading && userId) {
      setLoading(true);

      getPaciente(userId)
        .then((data) => {
          const finalData = Array.isArray(data) ? data[0] : data;
          if (finalData) {
            setPacienteData(finalData);
          }
        })
        .catch((error) => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, authLoading]);

  if (authLoading) {
    return (
      <TabsContent value="perfil" className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Cargando autenticación...</p>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="perfil" className="space-y-6">
      <div className="flex justify-center">
        <InfoPaciente pacienteData={pacienteData} userId={userId} />
      </div>
    </TabsContent>
  );
};
