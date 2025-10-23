"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function modificarAgenda() {
  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>
      <h1>Formulario en proceso</h1>
    </div>
  );
}
