import React from "react";
import { useState, useEffect  } from "react";
import { turnosAgendados, turnosDisponibles, medico } from "../../data/Info";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {TurnosDisponibles}from "./TurnosDisponibles";

const FiltrosBusqueda = () => {

     const [filtroMedico, setFiltroMedico] = useState("");
     const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
     const [mostrarResultados, setMostrarResultados] = useState(false);
     const [disponibles, setTurnosDisponibles] = useState(turnosDisponibles);
     const [medicos, setMedicos] = useState<Medico[]>([]);
     const [especialidades, setEspecialidades] = useState<any[]>([]);

     const [loading, setLoading] = useState(false);

     //  buscar data en bd
     
     
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

       //Cargar TODAS las especialidadessss
       useEffect(() => {
         const cargarEspecialidades = async () => {
           try {
             setLoading(true);
             const response = await fetch("/api/especialidades");
             if (!response.ok) {
               throw new Error("Error al obtener especialidades");
             }
             const EspecialidadesData: any[] = await response.json();
             
             setEspecialidades(EspecialidadesData.data);
     
             console.log("especialidades cargados:", EspecialidadesData.length);
           } catch (error) {
             console.error("Error cargando especialidades:", error);
             setEspecialidades([]);
           } finally {
             setLoading(false);
           }
         };
     
         cargarEspecialidades();
       }, []);



console.log(medicos);
console.log(especialidades);

     //  laburar con la data

     // es un lujito este, que a l filtrar especialdiad muestre los medicos q atiendan con esa, la consulta deberia tener join con esp.
     // const medicosFiltrados = filtroEspecialidad 
     //      ? medicos.filter((m) => m.id_especialidad === filtroEspecialidad)
     //      : [];

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
                                   <option  value="">Seleccionar especialidad</option>
                                   {especialidades.length!=0 && especialidades.map((esp) => (
                                        <option key={ esp.id_especialidad}
                                        value={ esp.id_especialidad}> {esp.descripcion}</option>
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
                                        <option key={medico.legajo_medico}
                                        value={medico.legajo_medico} 
                                        >{medico.nombre} {medico.apellido}</option>
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
          
     { mostrarResultados &&
     <TurnosDisponibles
          filtroEspecialidad={filtroEspecialidad}
          filtroMedico={filtroMedico}
     ></TurnosDisponibles>}
          </>
     )
}

export default FiltrosBusqueda
