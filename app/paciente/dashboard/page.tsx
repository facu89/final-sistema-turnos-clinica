"use client";

import { useState, useEffect } from "react";

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
export default function PacienteDashboard({ paciente }: any) {
  const [activeTab, setActiveTab] = useState("mis-turnos");
  const [filtroMedico, setFiltroMedico] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const medicos = medico;
  // Estado para los turnos agendados
  const [turnos, setTurnos] = useState(turnosAgendados); //mock data

  // Estado para modificar turno
  const [turnoAModificar, setTurnoAModificar] = useState<any>(null);
  const [turnoAConfirmar, setTurnoAConfirmar] = useState<any>(null);

  // Estado para los turnos disponibles
  const [turnosDisponibles, setTurnosDisponibles] = useState([
    {
      id: 1,
      medico: "Dr. Carlos López",
      especialidad: "Cardiología",
      fecha: "2024-01-16",
      hora: "11:00",
      estado: "disponible",
    },
    {
      id: 2,
      medico: "Dr. Carlos López",
      especialidad: "Cardiología",
      fecha: "2024-01-16",
      hora: "15:30",
      estado: "disponible",
    },
    {
      id: 3,
      medico: "Dra. Ana Martínez",
      especialidad: "Pediatría",
      fecha: "2024-01-17",
      hora: "09:00",
      estado: "disponible",
    },
  ]);

  // Filtrar médicos según la especialidad seleccionada
  const medicosFiltrados = filtroEspecialidad
    ? medicos.filter((m) => m.especialidad === filtroEspecialidad)
    : [];

  // Filtrar turnos según los filtros seleccionados y que estén disponibles
  const turnosFiltrados = turnosDisponibles.filter((turno) => {
    const coincideMedico =
      !filtroMedico ||
      filtroMedico === "Seleccionar médico" ||
      turno.medico === filtroMedico;
    const coincideEspecialidad =
      !filtroEspecialidad ||
      filtroEspecialidad === "Todas las especialidades" ||
      turno.especialidad === filtroEspecialidad;
    return (
      coincideMedico && coincideEspecialidad && turno.estado === "disponible"
    );
  });

  // Turnos disponibles para modificar
  const turnosParaModificar = turnoAModificar
    ? turnosDisponibles.filter(
        (t) =>
          t.medico === turnoAModificar.medico &&
          t.especialidad === turnoAModificar.especialidad &&
          t.estado === "disponible"
      )
    : [];

  // Función para cancelar turno
  const cancelarTurno = (id: number) => {
    setTurnos((prev) => prev.filter((turno) => turno.id !== id));
  };

  // Función para seleccionar un turno disponible y modificar el turno agendado
  const seleccionarNuevoTurno = (nuevoTurno: any) => {
    setTurnos((prev) =>
      prev.map((t) =>
        t.id === turnoAModificar.id
          ? { ...t, fecha: nuevoTurno.fecha, hora: nuevoTurno.hora }
          : t
      )
    );
    setTurnoAModificar(null);
  };

  // Función para agendar un turno
  const agendarTurno = (turno: any) => {
    setTurnoAConfirmar(turno);
  };

  // Estado para los datos de contacto
  const [contacto, setContacto] = useState({
    email: "maria.garcia@email.com",
    telefono: "+54 11 1234-5678",
    direccion: "Av. Corrientes 1234, CABA",
  });
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [contactoTemp, setContactoTemp] = useState(contacto);

  // Función modificada para pagar y confirmar turno
  const pagarYConfirmarTurno = async () => {
    if (!turnoAConfirmar) return;

    // Simular pago exitoso
    setTurnos((prev) => [
      ...prev,
      {
        ...turnoAConfirmar,
        direccion: "A confirmar",
      },
    ]);
    setTurnosDisponibles((prev) =>
      prev.map((t) =>
        t.id === turnoAConfirmar.id ? { ...t, estado: "ocupado" } : t
      )
    );
    setTurnoAConfirmar(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderPaciente></HeaderPaciente>
      <div className="container mx-auto px-4 py-6">
        <StatCards paciente={paciente}></StatCards>
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

          <TurnosTabPac paciente={paciente}></TurnosTabPac>
          <TurnosLibres></TurnosLibres>
          <PerfilTab></PerfilTab>
        </Tabs>
      </div>
    </div>
  );
}
