import React from "react";
import { useState } from "react";
import {
  turnosAgendados,
  turnosDisponibles,
  medico,
} from "../../data/Info";
import {  TabsContent } from "@/components/ui/tabs";
import FiltrosBusqueda from "../components/FiltrosBusqueda";

export const TurnosLibres = () => {
  const [activeTab, setActiveTab] = useState("mis-turnos");

  return (
    <TabsContent value="buscar-turnos" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agendar un turno nuevo.</h2>
      </div>
      <FiltrosBusqueda></FiltrosBusqueda>
    </TabsContent>
  );
};
