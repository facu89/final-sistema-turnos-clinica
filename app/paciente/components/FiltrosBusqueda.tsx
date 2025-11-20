import React from "react";
import { useState, useEffect } from "react";
import { turnosAgendados, turnosDisponibles, medico } from "../../data/Info";
import { Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TurnosDisponibles } from "./TurnosDisponibles";
import { json } from "stream/consumers";
import { filtrarMedicosPorEspecialidad } from "@/hooks/medico/filtrarMedicos";
const FiltrosBusqueda = () => {
  const [filtroMedico, setFiltroMedico] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [disponibles, setTurnosDisponibles] = useState(turnosDisponibles);
  const [medicosTodos, setMedicosTodos] = useState<Medico[]>([]);

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  //  buscar data en bd
  interface especialidad {
    id_especialidad: number;
    descripcion: string;
  }
  //  Cargar TODOS los médicos registrados desde la API
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
        setMedicos([]);
        setMedicosTodos(medicosActivos);
      } catch (error) {
        console.error("Error cargando médicos:", error);
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarMedicos();
  }, []);

  //Cargar TODAS las especialidadessss
  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/especialidades");
        if (!response.ok) {
          throw new Error("Error al obtener especialidades");
        }
        const EspecialidadesData: any = await response.json();
        console.log(EspecialidadesData);
        setEspecialidades(EspecialidadesData.data);
      } catch (error) {
        console.error("Error cargando especialidades:", error);
        setEspecialidades([]);
      } finally {
        setLoading(false);
      }
    };

    cargarEspecialidades();
  }, []);

  //para q cuando seleccione un filtro de especialidad, se filtren solo los medicos que tienen esa especialidad
  useEffect(() => {
    const cargarMedicosPorEspecialidadSeleccionada = async () => {
      const medicosObtneidos = await filtrarMedicosPorEspecialidad(
        filtroEspecialidad,
        medicosTodos
      );
      if (medicosObtneidos == undefined) {
        setMedicos([]);
      } else {
        setMedicos(medicosObtneidos);
      }
    };

    cargarMedicosPorEspecialidadSeleccionada();
  }, [filtroEspecialidad]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Selecciona primero la especialidad, luego el médico para ver turnos
            disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Especialidad</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg"
                value={filtroEspecialidad}
                onChange={(e) => {
                  setFiltroEspecialidad(e.target.value);
                  setFiltroMedico(""); // Reinicia el médico al cambiar especialidad
                }}
              >
                <option value="">Seleccionar especialidad</option>
                {especialidades.length != 0 &&
                  especialidades.map((esp) => (
                    <option
                      key={esp.id_especialidad}
                      value={esp.id_especialidad}
                    >
                      {" "}
                      {esp.descripcion}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Médico</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg"
                value={filtroMedico}
                onChange={(e) => setFiltroMedico(e.target.value)}
                disabled={!filtroEspecialidad}
              >
                <option value="">Seleccionar médico</option>
                {medicos.map((medico) => (
                  <option
                    key={medico.legajo_medico}
                    value={medico.legajo_medico}
                  >
                    {medico.nombre} {medico.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setMostrarResultados(true)}
            disabled={!filtroEspecialidad}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Turnos Disponibles
          </Button>
        </CardContent>
      </Card>

      {mostrarResultados && (
        <TurnosDisponibles
          filtroEspecialidad={Number(filtroEspecialidad)}
          filtroMedico={Number(filtroMedico)}
        ></TurnosDisponibles>
      )}
    </>
  );
};

export default FiltrosBusqueda;
