import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export const ReporteDemandaMedico = () => (
  <Card>
    <CardHeader>
      <CardTitle>Informe de Demanda por Médico</CardTitle>
      <CardDescription>
        Consulta la demanda de turnos por cada médico.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full">
        <FileText className="h-4 w-4 mr-2" />
        Generar Informe de Demanda por Médico
      </Button>
    </CardContent>
  </Card>
);
