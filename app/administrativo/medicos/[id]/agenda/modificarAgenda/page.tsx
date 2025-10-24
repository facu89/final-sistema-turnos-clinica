"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { HeaderAgenda } from "../HeaderAgenda";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditarAgendaForm({
  params,
}: {
  params: { id: string };
}) {
  const legajo_medico = params.id;
  const [duracionTurno, setDuracionTurno] = useState<number>(30);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [medico, setMedico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const [diasAtencion, setDiasAtencion] = useState(
    diasSemana.map(() => ({
      activo: false,
      hora_inicio: "08:00",
      hora_fin: "16:00",
    }))
  );

  useEffect(() => {
    const fetchMedico = async () => {
      try {
        const res = await fetch(`/api/agenda?legajo_medico=${legajo_medico}`);
        const data = await res.json();
        setMedico(data);

        if (data.agenda) {
          // Configurar valores iniciales
          setDuracionTurno(
            parseInt(data.agenda.duracionturno.split(":")[1]) || 30
          );
          setFechaInicio(data.agenda.fechainiciovigencia.split("T")[0]);
          setFechaFin(data.agenda.fechafinvigencia.split("T")[0]);

          console.log(data.agenda.dia_semana);

          const nuevosDias = diasSemana.map((_, index) => {
            const diaEncontrado = data.agenda.dia_semana?.find(
              (d: any) => d.dia_semana === index
            );
            return {
              activo: !!diaEncontrado,
              hora_inicio: diaEncontrado
                ? diaEncontrado.hora_inicio.substring(0, 5)
                : "08:00",
              hora_fin: diaEncontrado
                ? diaEncontrado.hora_fin.substring(0, 5)
                : "16:00",
            };
          });

          setDiasAtencion(nuevosDias);
        }
      } catch (error) {
        console.error("Error al obtener datos del médico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedico();
  }, [legajo_medico]);

  if (loading) return <p className="text-center mt-8">Cargando Agenda...</p>;

  return (
    <div>
      <HeaderAgenda nombre={medico?.nombre} apellido={medico?.apellido} />
      <div className="flex flex-col items-center bg-gray-50 min-h-screen py-10">
        <form className="w-full max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <p className="text-sm text-gray-500">
                Modificá los parámetros generales de la agenda del médico{" "}
                <b>
                  {medico?.nombre} {medico?.apellido}
                </b>
                .
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
                >
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
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
                Configurá los días y horarios de atención.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              {diasSemana.map((_, index) => {
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
                      <span className="font-medium">{diasSemana[index]}</span>
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
            <Button>Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
