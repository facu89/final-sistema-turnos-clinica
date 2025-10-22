"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TurnosTabPac } from "./TurnosTabPac";
import { TurnosLibres } from "./TurnosLibresTab";
import { PerfilTab } from "./PerfilTab";
import HeaderPaciente from "../components/HeaderPaciente";
import { StatCards } from "./StatCards";
import { medico, turnosAgendados } from "../../data/Info";
declare global {
  interface Window {
    MercadoPago: any;
  }
}
export default function PacienteDashboard() {
  const [activeTab, setActiveTab] = useState("mis-turnos");
  const [filtroMedico, setFiltroMedico] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);
       const [showMissingDni, setShowMissingDni] = useState(false);
  const [dniPaciente, setDniPaciente] = useState<number | null>(null);
  const medicos = medico;
  // Estado para los turnos agendados
  const [turnos, setTurnos] = useState(turnosAgendados); //mock data

  // Estado para modificar turno
  const [turnoAModificar, setTurnoAModificar] = useState<any>(null);
  const [turnoAConfirmar, setTurnoAConfirmar] = useState<any>(null);



 const { userId } = useAuth();

   const getDniPaciente = async (): Promise<number | null> => {
    try {
      if (!userId) return null;
      const r = await fetch(`/api/dniPaciente?id_paciente=${encodeURIComponent(userId)}`);
      if (!r.ok) return null;
      const j = await r.json();
      const raw = j.dni_paciente ?? null;
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    } catch (e) {
      console.warn("Error obteniendo DNI:", e);
      return null;
    }
  };

  useEffect(() => {
    const fetchPaciente = async () => {
      const dni = await getDniPaciente();
      if (!dni) {
        setShowMissingDni(true);
      } else {
        setDniPaciente(dni);
        console.log(" dni_paciente cargado:", dni);
      }
    };
    fetchPaciente();
  }, [userId]);


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderPaciente></HeaderPaciente>
      <div className="container mx-auto px-4 py-6">
       { dniPaciente!=null && 
       <StatCards dni_paciente={dniPaciente}></StatCards>}
        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mis-turnos">Mis Turnos</TabsTrigger>
            <TabsTrigger value="buscar-turnos">Sacar turno</TabsTrigger>
            <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
            {/* <TabsTrigger value="historial">Historial</TabsTrigger> */}
          </TabsList>

          {dniPaciente!=null &&  
          <TurnosTabPac dni_paciente={dniPaciente}></TurnosTabPac>}
          <TurnosLibres></TurnosLibres>
          <PerfilTab></PerfilTab>
        </Tabs>
      </div>
    </div>
  );
}
