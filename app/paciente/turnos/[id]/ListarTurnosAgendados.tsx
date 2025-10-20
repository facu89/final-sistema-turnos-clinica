import React from 'react'
import { useState, useEffect } from "react";
import { turnosDisponibles } from "../../../data/Info";
import { Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModificarTurno } from './ModificarTurno';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

export const ListarTurnosAgendados = ({ paciente }: any) => {
     const [turnosAgendados, setTurnosAgendados] = useState<any[]>([]);
     const [isLoading, setIsLoading] = useState(true);


     async function getTurnosPaciente(dniPaciente: string) {
          try {
               const response = await fetch(`/api/turnos/turnosPaciente?dni_paciente=${dniPaciente}`, {
                    cache: "no-store",
               });
               if (!response.ok) throw new Error("Error al obtener turnos");
               const data = await response.json();
               return Array.isArray(data) ? data.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) : [];
          } catch (error) {
               console.error("Error: ", error);
               return [];
          }
     }

     useEffect(() => {
          const loadTurnos = async () => {
               setIsLoading(true);
               if (paciente?.dni_paciente) {
                    const data = await getTurnosPaciente(paciente.dni_paciente);
                    setTurnos(data);
               }
               setIsLoading(false);
          };
          loadTurnos();
     }, [paciente?.dni_paciente]);


     const [filtroMedico, setFiltroMedico] = useState("");
     const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
     const [turnoAModificar, setTurnoAModificar] = useState<any>(null);
     const [turnos, setTurnos] = useState(turnosAgendados);

     // Filtrar turnos según los filtros seleccionados y que estén disponibles
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

     // Turnos disponibles para modificar (solo los que coinciden con el médico y especialidad del turno a modificar,
     // y que también aparecen en la lista filtrada de turnos disponibles)
     const turnosParaModificar = turnoAModificar
          ? turnosFiltrados.filter(
               (t) =>
                    t.medico === turnoAModificar.medico &&
                    t.especialidad === turnoAModificar.especialidad
          )
          : [];

     // Función para cancelar turno
     const cancelarTurno = (id: number) => {
          setTurnos((prev) => prev.filter((turno) => turno.id !== id));
     };

     // Función para seleccionar un turno disponible y modificar el turno agendado
     const seleccionarNuevoTurno = (nuevoTurno: any) => {
          setTurnos((prev) =>
               prev.map((t) =>
                    t.id === turnoAModificar.id
                         ? { ...t, fecha: nuevoTurno.fecha, hora: nuevoTurno.hora }
                         : t
               )
          );
          setTurnoAModificar(null);
     };



     if (turnoAModificar) {
          return (
               <ModificarTurno
                    turnoAModificar={turnoAModificar}
                    setTurnoAModificar={setTurnoAModificar}
                    turnosParaModificar={turnosParaModificar}
                    seleccionarNuevoTurno={seleccionarNuevoTurno}
               />
          );
     }

     return (
          <Table className="w-full text-sm">
               <TableHeader>
                    <TableRow>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Paciente</TableHead>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Médico</TableHead>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Fecha</TableHead>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Hora</TableHead>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Consultorio</TableHead>
                         <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">Acciones</TableHead>

                    </TableRow>
               </TableHeader>
               <TableBody>
                    {turnosAgendados.map((turno) => (
                         <TableRow key={turno.id}>
                              <TableCell>{turno.paciente || "-"}</TableCell>
                              <TableCell>{turno.medico}</TableCell>
                              <TableCell>{turno.fecha}</TableCell>
                              <TableCell>{turno.hora}</TableCell>
                              <TableCell>{turno.direccion}</TableCell>
                              <TableCell>
                                   <div className="flex gap-2">
                                        <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => setTurnoAModificar(turno)}
                                        >
                                             <Edit className="h-4 w-4 mr-1" />
                                             Modificar
                                        </Button>
                                        <Button
                                             variant="destructive"
                                             size="sm"
                                             onClick={() => cancelarTurno(turno.id)}
                                        >
                                             <X className="h-4 w-4 mr-1" />
                                             Cancelar
                                        </Button>
                                        <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => (window.location.href = `/admin/turnos/${turno.id}`)}
                                        >
                                             Ver Detalle
                                        </Button>
                                   </div>
                              </TableCell>

                         </TableRow>
                    ))}
                    {turnosAgendados.length === 0 && (
                         <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                   No tienes turnos agendados.
                              </TableCell>
                         </TableRow>
                    )}
               </TableBody>
          </Table>

     )
}

