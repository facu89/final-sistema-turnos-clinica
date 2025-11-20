"use client";

import { useEffect, useState } from "react";
import HeaderTurno from "./HeaderTurno";
import InfoTurno from "./InfoTurno";
import InfoPaciente from "./InfoPaciente";
import { SkeletonDetalleTurno } from "@/components/ui/skeletons/skeletonDetalle";
import { useAuth } from "@/hooks/useAuth/useAuth";

export default function TurnoDetalle({ params }: { params: { id: string } }) {
  const cod_turno = params.id;
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth(); // si en algún momento lo usás para otra cosa

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/turnos/turno-codigo?cod_turno=${cod_turno}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        setTurno(json);
      } catch (err) {
        console.error("Error cargando detalle de turno:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cod_turno]);

  if (loading) {
    return <SkeletonDetalleTurno />;
  }

  if (!turno) {
    // opcional: por si no se encuentra el turno
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <p>No se encontró el turno.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderTurno turno={turno} />

      <div className="container mx-auto px-4 py-6">
        {/* 🔹 Sólo información del turno y del paciente (sin panel de Acciones) */}
        <div className="space-y-6">
          <InfoTurno turno={turno} />
          <InfoPaciente turno={turno} />
        </div>
      </div>
    </div>
  );
}
