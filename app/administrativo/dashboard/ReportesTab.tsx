import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { FileText } from "lucide-react";

interface Medico {
  legajo_medico: string;
  nombre: string;
  apellido: string;
  dni_medico: string;
  matricula: string;
  telefono: string;
  tarifa: number;
  estado: string;
  especialidad?: string;
}

export const ReportesTab = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState("");

  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/medico");

        if (!response.ok) {
          throw new Error("Error al obtener médicos");
        }

        const medicosData: Medico[] = await response.json();
        const medicosActivos = medicosData.filter(
          (medico) => medico.estado === "activo"
        );

        setMedicos(medicosActivos);
        console.log("Médicos cargados:", medicosActivos.length);
      } catch (error) {
        console.error("Error cargando médicos:", error);
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarMedicos();
  }, []);

  const generarReporte = () => {
    console.log("Generando reporte:", {
      fechaInicio,
      fechaFin,
      medico: medicoSeleccionado,
    });
  };

  return (
    <TabsContent value="reportes" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reportes</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte de Turnos</CardTitle>
          <CardDescription>
            Genera un reporte detallado de turnos por fecha y médico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha Inicio</label>
              <input
                type="date"
                className="w-full mt-1 p-2 border rounded-lg"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha Fin</label>
              <input
                type="date"
                className="w-full mt-1 p-2 border rounded-lg"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Médico</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg"
                value={medicoSeleccionado}
                onChange={(e) => setMedicoSeleccionado(e.target.value)}
                disabled={loading}
              >
                <option value="">
                  {loading ? "Cargando médicos..." : "Todos los médicos"}
                </option>
                {medicos.map((medico) => (
                  <option
                    key={medico.legajo_medico}
                    value={`${medico.nombre} ${medico.apellido}`}
                  >
                    Dr. {medico.nombre} {medico.apellido}
                    {medico.especialidad && ` - ${medico.especialidad}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={generarReporte}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Cargando..." : "Generar Reporte"}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
