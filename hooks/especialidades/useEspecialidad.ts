"use client";

import { useEffect, useState } from "react";

interface Especialidad {
  id_especialidad: string;
  descripcion: string;
}

export function useEspecialidad(id_especialidad: number) {
  const [especialidad, setEspecialidad] = useState<Especialidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEspecialidad = async () => {
      if (!id_especialidad) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/especialidad?id_especialidad=${id_especialidad}`);
        if (!res.ok) throw new Error("Error al cargar la especialidad");
        const { data } = await res.json();
        setEspecialidad(data);
      } catch (err) {
        console.error("Error fetching especialidad:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchEspecialidad();
  }, [id_especialidad]);

  return { especialidad, loading, error };
}