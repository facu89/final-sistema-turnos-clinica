import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth/useAuth";
import { Button } from "@/components/ui/button";
import ObrasSocialesMedico from "./ObrasSocialesMedico";
import DialogPagoTarjeta from "./DialogPagar";

interface AgendarProps {
  turnoAConfirmar: any;
  setTurnoAConfirmar: React.Dispatch<React.SetStateAction<any>>;
  setTurnosAgendados: React.Dispatch<React.SetStateAction<any[]>>;
  setTurnosDisponibles: React.Dispatch<React.SetStateAction<any[]>>;
}
interface TurnoBody {
  cod_turno?:number
  legajo_medico: number;
  nombre_medico: string;
  dni_paciente: number;
  fecha_hora_turno: Date;
  id_especialidad: number;
  desc_especialidad: string;
  id_obra: string | null;
  turno_pagado?: boolean;
  estado_turno: string;
  turno_modificado?: boolean;
  presencia_turno?: boolean; // opcional
  userId?: string;
}
export interface ObraSocial {
  id_obra: number;
  descripcion: string;
  estado?: string;
  telefono_contacto?: number;
  sitio_web?: string;
  fecha_alta?: string;
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

const Agendar = ({
  turnoAConfirmar,
  setTurnoAConfirmar,
  setTurnosAgendados,
  setTurnosDisponibles,
}: AgendarProps) => {
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [selectedObraSocial, setSelectedObraSocial] = useState<string>("null");
  const [showMissingDni, setShowMissingDni] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [especialidadDesc, setEspecialidadDesc] = useState<string>("");
  const { userId } = useAuth();
  const [medico, setMedico] = useState<any>();
  const [showPago, setShowPago] = useState(false);

  // Función para buscar la descripción de la especialidad
  const buscarEspecialidad = async () => {
    try {
      const res = await fetch(`/api/especialidades`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al obtener especialidades");
      const especialidades = await res.json();
      console.log(especialidades);
      // Buscar la especialidad que coincida con el ID
      const especialidad = especialidades.data.find(
        (esp: any) =>
          esp.id_especialidad === Number(turnoAConfirmar.id_especialidad)
      );

      if (especialidad) {
        setEspecialidadDesc(especialidad.descripcion);
      }
    } catch (error) {
      console.error("Error al buscar especialidad:", error);
    }
  };
  const [medicoNombre, setMedicoNombre] = useState<string>("");

  const buscarMedico = async () => {
    try {
      const res = await fetch(`/api/medico/${turnoAConfirmar.legajo_medico}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al obtener médico");

      const medico = await res.json();

      if (medico) {
        const nombreCompleto = `${medico.nombre} ${medico.apellido}`.trim();
        setMedicoNombre(nombreCompleto);
        setMedico(medico);
      }
    } catch (error) {
      console.error("Error al buscar médico:", error);
    }
  };

  // Buscar la especialidad cuando el componente se monta
  React.useEffect(() => {
    buscarEspecialidad();
    buscarMedico();
  }, [turnoAConfirmar.id_especialidad]);

  // Getter: obtiene el dni del paciente asociado al userId (desde /api/paciente)
  const getDniPaciente = async (): Promise<number | null> => {
    try {
      if (!userId) return null;
      const r = await fetch(
        `/api/dniPaciente?id_paciente=${encodeURIComponent(userId)}`
      );
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
      legajo_medico: turnoAConfirmar.legajo_medico,
      dni_paciente: dniPaciente,
      nombre_medico: medicoNombre,
      id_obra: selectedObraSocial === "null" ? null : selectedObraSocial,
      fecha_hora_turno: turnoAConfirmar.id, // Send ISO string directly
      id_especialidad:
        turnoAConfirmar.id_especialidad ?? turnoAConfirmar.especialidad_id,
      desc_especialidad: especialidadDesc,
      estado_turno: "Reservado",
      userId: userId,
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
        prev.map((t) =>
          t.fecha_hora_turno === turnoAConfirmar.fecha_hora_turno ? { ...t, estado: "ocupado" } : t
        )
      );

      setShowSuccess(true);
      // setTurnoAConfirmar(null);
    } catch (err: any) {
      alert(err.message || "Error al reservar el turno");
    }
  };

  //busca las obras scoiales del mdico
  const getObrasSociales = async () => {
    if (!turnoAConfirmar.legajo_medico) return;
      try {
        const res = await fetch(
          `/api/medico/medico-obraSocial?legajo_medico=${turnoAConfirmar.legajo_medico}`,
          {
            cache: "no-store",
          }
        );
        const json = await res.json();

        const parsed = json.map((item:any)=>({
          id_obra: item.obra_social?.id_obra,
          descripcion: item.obra_social?.descripcion,
          estado: item.obra_social?.estado,
          telefono_contacto: item.obra_social?.telefono_contacto,
          sitio_web: item.obra_social?.sitio_web,
          fecha_alta: item.fecha_alta,
        }));

        if (!res.ok) throw new Error(json.error || "Error al obtener obras sociales");
        setObrasSociales(parsed);
      } catch (err: any) {
        setObrasSociales([]);
      }
  };

  //Busca las obras sociales
  React.useEffect(()=>{
    if(turnoAConfirmar?.legajo_medico){
      getObrasSociales();
    }
  }, [turnoAConfirmar?.legajo_medico]);


  return (
    <>
      {!showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              Debe abonar el turno para reservarlo
            </h3>
            <p className="mb-4">
              Médico: <b>{medicoNombre || "Cargando..."}</b> <br />
              Especialidad: <b>{especialidadDesc || "Cargando..."}</b> <br />
              Fecha: <b>{turnoAConfirmar.fecha}</b> - Hora:{" "}
              <b>{turnoAConfirmar.hora}</b>
            </p>

            <ObrasSocialesMedico
              obrasSociales={obrasSociales}
              onObraSocialChange={setSelectedObraSocial}
            />

            {/* aparece pagar solo si eligio particular */}
            {selectedObraSocial === "null" ? (
              <Button className="w-full mb-2" onClick={()=>setShowPago(true)}>
              Confirmar turno
              </Button>
            ) : (
              <Button className="w-full mb-2" onClick={pagarYConfirmarTurno}>
              Confirmar turno
              </Button>
            )}

            {showPago && (
            <DialogPagoTarjeta
                turno={{
                  ...turnoAConfirmar,
                  nombre_medico: medicoNombre,
                  desc_especialidad: especialidadDesc,
                  tarifa: medico?.tarifa,
                }}
                onCerrar={() => setShowPago(false)}
                onPagoExitoso={async () => {
                  await pagarYConfirmarTurno();
                  setShowPago(false);
                }}
              />
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
                  <p className="mb-4">
                    No pudimos encontrar tu DNI en el perfil. Por favor completa
                    tu perfil antes de reservar un turno.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowMissingDni(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/*exito */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-bold mb-2 text-green-600">
              ¡Turno confirmado con éxito!
            </h3>
            <p className="mb-4">
              Tu turno fue agendado correctamente. Recibirás una notificación 24
              horas antes.
            </p>
            <Button
              onClick={() => {
                setShowSuccess(false);
                setTurnosAgendados(prev => [...prev, turnoAConfirmar]);
                setTurnosDisponibles(prev => 
                  prev.filter(t => t.iso !== turnoAConfirmar.id)
                );
                setTurnoAConfirmar(null);
              }}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Agendar;
