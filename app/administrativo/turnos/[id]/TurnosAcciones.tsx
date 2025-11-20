"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
  codTurno?: number;
  onUpdated?: () => void;
};

export const TurnosAcciones: React.FC<Props> = ({ codTurno, onUpdated }) => {
  const pathname = usePathname();
  const [presente, setPresente] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extrae el ID de la URL si no lo recibe por props
  const idFromPath = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const n = Number(last);
    return Number.isFinite(n) ? n : undefined;
  }, [pathname]);

  const finalId = codTurno ?? idFromPath;

  const marcarPresencia = async () => {
    if (!finalId) {
      alert("No se pudo determinar el ID del turno.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/turnos/presencia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_turno: finalId, presencia: true }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(json?.error ?? "No se pudo marcar la presencia del turno.");
        return;
      }

      // Si la API responde bien → marcamos como presente
      setPresente(true);
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al marcar la presencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
        <CardDescription>Gestiona este turno</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button
          className={`w-full ${
            presente
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          disabled={loading || presente}
          onClick={marcarPresencia}
        >
          <UserX className="h-4 w-4 mr-2" />
          {presente ? "Presencia Marcada" : loading ? "Marcando..." : "Marcar Presencia"}
        </Button>
      </CardContent>
    </Card>
  );
};
