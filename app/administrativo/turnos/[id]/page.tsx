"use client";

import { TurnosAcciones } from "./TurnosAcciones";
import InfoTurno from "./InfoTurno";
import InfoPaciente from "./InfoPaciente";
import HeaderTurno from "./HeaderTurno";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function TurnoDetalle({params}:{params: {id: string}}) {
  const cod_turno = params.id;
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchData = async() => {
      const res = await fetch(`/api/turnos/turno-codigo?cod_turno=${cod_turno}`, {cache: "no-store"});
      const json = await res.json();
      setTurno(json);
      setLoading(false);
    };
    fetchData();
  },[]);

  if(loading){
    return(
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="sticky top-0 z-10">
          <HeaderTurno />
        </div>
  
        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-lg text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderTurno turno={turno}>{}</HeaderTurno>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <InfoTurno turno={turno}></InfoTurno>

            <InfoPaciente turno={turno}></InfoPaciente>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <TurnosAcciones></TurnosAcciones>
          </div>
        </div>
      </div>
    </div>
  );
}
