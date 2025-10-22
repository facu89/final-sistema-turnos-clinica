import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth/useAuth';
import { Button } from "@/components/ui/button";
import ObrasSocialesMedico from './ObrasSocialesMedico';


interface AgendarProps {
     turnoAConfirmar: any;
     setTurnoAConfirmar: React.Dispatch<React.SetStateAction<any>>;
     setTurnosAgendados: React.Dispatch<React.SetStateAction<any[]>>;
     setTurnosDisponibles: React.Dispatch<React.SetStateAction<any[]>>;
}
interface TurnoBody {
     legajo_medico: string;
     dni_paciente: number;
     fecha_hora_turno: Date;
     id_especialidad: number;
     id_obra: string | null;
     turno_pagado?: boolean;
     estado_turno: string;
     turno_modificado?: boolean;
     presencia_turno?: boolean; // opcional
}

async function agendarTurno(payload: TurnoBody) {
     const res = await fetch("/api/turnos/agendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
     });
     const data = await res.json();
     if (!res.ok) throw new Error(data.error || "Error al agendar turno");
     return data;
}

const Agendar = ({ turnoAConfirmar, setTurnoAConfirmar, setTurnosAgendados, setTurnosDisponibles }: AgendarProps) => {

     const [selectedObraSocial, setSelectedObraSocial] = useState<string>("null");
     const [showMissingDni, setShowMissingDni] = useState(false);
     const [showSuccess, setShowSuccess] = useState(false);
     const { userId } = useAuth();

     // Getter: obtiene el dni del paciente asociado al userId (desde /api/paciente)
     const getDniPaciente = async (): Promise<number | null> => {
          try {
               if (!userId) return null;
               const r = await fetch(`/api/dniPaciente?id_paciente=${encodeURIComponent(userId)}`);
               if (!r.ok) return null;
               const j = await r.json();
               console.log("jota : ", j);
               const raw = j.dni_paciente ?? null;
               if (raw == null) return null;

               const n = Number(raw);
               return Number.isNaN(n) ? null : n;
          } catch (e) {
               console.warn("Error obteniendo DNI:", e);
               return null;
          }
     };

     // Reserva: construye payload y llama a la API
     const reserveTurno = async (dniPaciente: number) => {
          const payload: TurnoBody = {
               legajo_medico: turnoAConfirmar.medico.legajo_medico ?? turnoAConfirmar.legajo_medico,
               dni_paciente: dniPaciente,
               id_obra: selectedObraSocial === "null" ? null : selectedObraSocial,
               fecha_hora_turno: new Date(`${turnoAConfirmar.fecha}T${turnoAConfirmar.hora}`),
               id_especialidad: turnoAConfirmar.id_especialidad ?? turnoAConfirmar.especialidad_id,
               estado_turno: "confirmado",
          };
          return agendarTurno(payload);
     };

     // Función para confirmar el pago y agendar el turno
     const pagarYConfirmarTurno = async () => {
          if (!turnoAConfirmar) return;
          const dniPaciente = await getDniPaciente();
          if (!dniPaciente) {
               setShowMissingDni(true);
               return;
          }

          try {
               await reserveTurno(dniPaciente);
               // Actualiza estado local
               setTurnosAgendados((prev) => [
                    ...prev,
                    { ...turnoAConfirmar, direccion: "A confirmar" },
               ]);
               setTurnosDisponibles((prev) =>
                    prev.map((t) => (t.id === turnoAConfirmar.id ? { ...t, estado: "ocupado" } : t))
               );

               
               setShowSuccess(true);
               // setTurnoAConfirmar(null);
          } catch (err: any) {
               alert(err.message || "Error al reservar el turno");
          }
     };



     return (
          <>{ !showSuccess && (
               <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                         <h3 className="text-xl font-bold mb-4">
                              Debe pagar el turno para confirmarlo
                         </h3>
                         <p className="mb-4">
                              Médico: <b>{turnoAConfirmar.medico}</b> <br />
                              Especialidad: <b>{turnoAConfirmar.especialidad}</b> <br />
                              Fecha: <b>{turnoAConfirmar.fecha}</b> - Hora:{" "}
                              <b>{turnoAConfirmar.hora}</b>
                         </p>
                         


                         <ObrasSocialesMedico
                              obrasSociales={turnoAConfirmar.medico.obrasSociales}
                              onObraSocialChange={setSelectedObraSocial}
                         />

                         {/* aparece pagar solo si eligio particular */}
                         {selectedObraSocial === "null" && (
                              <Button className="w-full mb-2" onClick={pagarYConfirmarTurno}>
                                   Pagar turno
                              </Button>
                         )}

                         <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setTurnoAConfirmar(null)}
                         >
                              Cancelar
                         </Button>
                    

               {/* Dialogo cuando falta DNI en el perfil del usuario */}
               {showMissingDni && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60">
                         <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                              <h3 className="text-lg font-bold mb-2">Falta información</h3>
                              <p className="mb-4">No pudimos encontrar tu DNI en el perfil. Por favor completa tu perfil antes de reservar un turno.</p>
                              <div className="flex gap-2">
                                   <Button onClick={() => setShowMissingDni(false)}>Cerrar</Button>
                              </div>
                         </div>
                    </div>
               )}
               </div>
                    </div> )}
               {/*exito */}
               {showSuccess && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
      <h3 className="text-lg font-bold mb-2 text-green-600">¡Turno confirmado con éxito!</h3>
      <p className="mb-4">
        Tu turno fue agendado correctamente. Recibirás una notificación 24 horas antes.
      </p>
      <Button
        onClick={() => {
          setShowSuccess(false);
          setTurnoAConfirmar(null); 
        }}
      >
        Aceptar
      </Button>
    </div>
  </div>
)}
          </>
     )
}


export default Agendar
