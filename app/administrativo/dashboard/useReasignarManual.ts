// app/administrativo/dashboard/turnos/useReasignarManual.ts
import { useState } from "react";

type Resultado = { id: number; nuevo?: number; error?: string };
type Respuesta = { success: boolean; resultados: Resultado[]; error?: string };

export function useReasignarManual() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasignarNextDay = async (ids: number[]) => {
    if (!ids?.length) return { success: false, resultados: [], error: "No hay turnos seleccionados" } as Respuesta;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/turnos/reasignar-administrativo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const json: Respuesta = await res.json();
      if (!res.ok) {
        setError(json?.error || "Error al reasignar");
        return { success: false, resultados: [], error: json?.error };
      }

      return json;
    } catch (e: any) {
      const err = e?.message ?? "Error al reasignar";
      setError(err);
      return { success: false, resultados: [], error: err };
    } finally {
      setLoading(false);
    }
  };

  return { reasignarNextDay, loading, error, setError };
}
