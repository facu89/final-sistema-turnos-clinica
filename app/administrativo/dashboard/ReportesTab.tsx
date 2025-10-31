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
import { ReporteTurnosPorFecha } from "./ReporteTurnosPorFecha";
import { ReporteDemandaMedico } from "./ReporteDemandaMedico";
import { ReporteDemandaEspecialidad } from "./ReporteDemandaEspecialidad";

interface Turno {
  cod_turno: number;

  dni_paciente: string;
  fecha_hora_turno: string;
  legajo_medico: string;
  nombre_paciente: string;
  apellido_paciente: string;
  nombre_medico: string;
  apellido_medico: string;
  estado_turno: string;
  especialidad: Especialidad;
}

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
interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}

export const ReportesTab = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState("");
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");

  const [tipoReporte, setTipoReporte] = useState("");

  useEffect(() => {
    const cargaTurnos = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/turnos/todos");
        if (!response.ok) {
          throw new Error("Error al obtener turnos");
        }
        const data: Turno[] = await response.json();
        setTurnos(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    const cargaEspecialidades = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/especialidades");
        if (!response.ok) throw new Error("Error al obtener especialidades");
        const especialidadesData = await response.json();
        console.log("Especialidades traidas", especialidadesData);
        setEspecialidades(especialidadesData.data);
      } catch (error) {
        setEspecialidades([]);
      } finally {
        setLoading(false);
      }
    };
    const cargarMedicos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/medico");
        if (!response.ok) throw new Error("Error al obtener médicos");
        const medicosData: Medico[] = await response.json();
        const medicosActivos = medicosData.filter(
          (medico) => medico.estado === "activo"
        );
        setMedicos(medicosActivos);
      } catch (error) {
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };
    cargaTurnos();
    cargaEspecialidades();
    cargarMedicos();
  }, []);

  function renderFormulario() {
    switch (tipoReporte) {
      case "turnos":
        return (
          <ReporteTurnosPorFecha
            turnos={turnos}
            medicos={medicos}
            especialidades={especialidades}
            loading={loading}
            fechaInicio={fechaInicio}
            setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}
            setFechaFin={setFechaFin}
            medicoSeleccionado={medicoSeleccionado}
            setMedicoSeleccionado={setMedicoSeleccionado}
            especialidadSeleccionada={especialidadSeleccionada}
            setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          />
        );
      case "demanda-medico":
        return (
          <ReporteDemandaMedico
            turnos={turnos}
            especialidades={especialidades}
            especialidadSeleccionada={especialidadSeleccionada}
            setEspecialidadSeleccionada={setEspecialidadSeleccionada}
            medicos={medicos}
            loading={loading}
            fechaInicio={fechaInicio}
            setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}
            setFechaFin={setFechaFin}
            medicoSeleccionado={medicoSeleccionado}
            setMedicoSeleccionado={setMedicoSeleccionado}
          />
        );
      case "demanda-especialidad":
        return (
          <ReporteDemandaEspecialidad
            turnos={turnos}
            especialidades={especialidades}
            loading={loading}
            fechaInicio={fechaInicio}
            setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}
            setFechaFin={setFechaFin}
            medicoSeleccionado={medicoSeleccionado}
            setMedicoSeleccionado={setMedicoSeleccionado}
            especialidadSeleccionada={especialidadSeleccionada}
            setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          />
        );
      default:
        return null;
    }
  }

  return (
    <TabsContent value="reportes" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reportes</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Selecciona el tipo de reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={tipoReporte === "turnos" ? "default" : "outline"}
              onClick={() => setTipoReporte("turnos")}
            >
              Reporte de Turnos por Fecha
            </Button>
            <Button
              variant={tipoReporte === "demanda-medico" ? "default" : "outline"}
              onClick={() => setTipoReporte("demanda-medico")}
            >
              Informe de Demanda por Médico
            </Button>
            <Button
              variant={
                tipoReporte === "demanda-especialidad" ? "default" : "outline"
              }
              onClick={() => setTipoReporte("demanda-especialidad")}
            >
              Informe de Demanda por Especialidad
            </Button>
          </div>
        </CardContent>
      </Card>
      {renderFormulario()}
    </TabsContent>
  );
};
