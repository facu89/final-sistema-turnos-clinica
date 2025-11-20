"use client";
import { useState, useEffect } from "react";

interface Medico {
  legajo_medico: number;
  nombre: string;
  apellido: string;
  tarifa?: number;
  telefono?: string;
  estado?: string;
  matricula?: string;
}

/**
 * Hook: obtiene la información del médico según su legajo.
 */
export function useMedico(legajo_medico?: number) {
  const [medico, setMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!legajo_medico) return;

    const fetchMedico = async () => {
      try {
        setLoading(true);
        setError(null);

     //    const res = await fetch(`/api/medico/${legajo_medico}`, {
     const res = await fetch(`/api/medico/${legajo_medico}`,{

          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || `Error ${res.status}: no se pudo obtener el médico`);
        }

        const data = Array.isArray(json) ? json[0] : json;
        setMedico(data);
      } catch (err: any) {
        console.error("Error en useMedico:", err);
        setError(err.message || "Error al obtener médico");
        setMedico(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMedico();
  }, [legajo_medico]);

  return { medico, loading, error };
}
