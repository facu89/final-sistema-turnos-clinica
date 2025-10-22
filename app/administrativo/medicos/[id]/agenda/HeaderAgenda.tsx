import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

interface MedicoProps {
  nombre: string;
  especialidad: string;
  estado: string;
}

interface HeaderAgendaProps {
  medico: MedicoProps;
}

export function HeaderAgenda({ nombre, apellido }: { nombre: string; apellido: string }) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold">Agenda de {nombre} {apellido}</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
