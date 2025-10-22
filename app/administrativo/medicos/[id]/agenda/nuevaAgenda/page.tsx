"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { HeaderAgenda } from "../HeaderAgenda";
import { Calendar, Clock } from "lucide-react";
import { AgendaCreada } from "@/components/agendaCreada";

function minutosToTime(minutos: number) {
    const horas = Math.floor(minutos / 60)
      .toString()
      .padStart(2, "0");
    const mins = (minutos % 60).toString().padStart(2, "0");
    return `${horas}:${mins}:00`;
  }
  
export default function NuevaAgendaForm({ params }: { params: { id: string } }) {
  const legajo_medico = params.id;
  const [duracionTurno, setDuracionTurno] = useState(30);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [medico, setMedico] = useState<any>(null);
  const [agendaCreada, setAgendaCreada] = useState(false);


  useEffect(() => {
    const fetchMedico = async () => {
      const res = await fetch(`/api/medico/${params.id}/medico-legajo`);
      const json = await res.json();
      setMedico(json);
      setLoading(false);
    };
  
    if (legajo_medico) fetchMedico();
  }, [legajo_medico]);
  
  console.log("legajo_url:",legajo_medico);
  console.log("params", params);

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const [diasAtencion, setDiasAtencion] = useState(
    diasSemana.map(() => ({
      activo: false,
      hora_inicio: "09:00",
      hora_fin: "17:00",
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    const diasSeleccionados = diasAtencion
      .map((dia, index) => ({
        dia_semana: index + 1,
        hora_inicio: dia.hora_inicio,
        hora_fin: dia.hora_fin,
      }))
      .filter((_, i) => diasAtencion[i].activo);

    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legajo_medico: Number(legajo_medico),
          fechainiciovigencia: new Date().toISOString().split("T")[0],
          fechafinvigencia: fechaFin,
          duracionturno: minutosToTime(Number(duracionTurno)),
          diasAtencion: diasSeleccionados,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la agenda");

      setAgendaCreada(true);
    } catch (error: any) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if(agendaCreada){
    return(
        <AgendaCreada
        nombre={medico?.nombre}
        apellido={medico?.apellido}
        destino={'/administrativo/dashboard'}
        />
    );
  }

  return (
  <div>
    <HeaderAgenda nombre={medico?.nombre} apellido={medico?.apellido} />
    <div className="flex flex-col items-center bg-gray-50 min-h-screen py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <p className="text-sm text-gray-500">
              Configurá los parámetros generales de la agenda del médico <b>{medico?.nombre}{" "+medico?.apellido}</b>.
            </p>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Duración de cada turno (minutos)
              </label>
              <select
                className="border rounded p-2 w-full"
                value={duracionTurno}
                onChange={(e) => setDuracionTurno(Number(e.target.value))}
                required
                >
                <option value="">Seleccionar duración</option>
                <option value={15}>15 </option>
                <option value={20}>20 </option>
                <option value={30}>30 </option>
                <option value={45}>45 </option>
                <option value={60}>60 </option>
            </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de inicio de vigencia
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de fin de vigencia
              </label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
             Horarios de Atención
            </CardTitle>
            <p className="text-sm text-gray-500">
              Configurá los días y horarios de atención
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {diasSemana.map((nombre, index) => {
              const dia = diasAtencion[index];
              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 border rounded-xl p-4 gap-3"
                >
                  <div className="flex items-center gap-2 w-40">
                    <Checkbox
                      checked={dia.activo}
                      onCheckedChange={(checked) => {
                        const nuevos = [...diasAtencion];
                        nuevos[index].activo = Boolean(checked);
                        setDiasAtencion(nuevos);
                      }}
                    />
                    <span className="font-medium">{nombre}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={dia.hora_inicio}
                      onChange={(e) => {
                        const nuevos = [...diasAtencion];
                        nuevos[index].hora_inicio = e.target.value;
                        setDiasAtencion(nuevos);
                      }}
                      disabled={!dia.activo}
                    />
                    <span className="text-gray-500">hasta</span>
                    <Input
                      type="time"
                      value={dia.hora_fin}
                      onChange={(e) => {
                        const nuevos = [...diasAtencion];
                        nuevos[index].hora_fin = e.target.value;
                        setDiasAtencion(nuevos);
                      }}
                      disabled={!dia.activo}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Agenda"}
          </Button>
        </div>

        {mensaje && (
          <p className="text-center font-medium text-gray-700">{mensaje}</p>
        )}
      </form>
    </div>
    </div>
  );
}
