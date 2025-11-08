import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Medico {
  nombre: string;
  apellido: string;
}

interface Turno {
  fecha: string;
  cod_turno: number;
  legajo_medico?: number;
  id_especialidad?: number;
  medico?: Medico;
  descripcion?: string;
}

interface ModificarProps {
  turnoViejo: Turno;
  turnoNuevo: Turno;
  // accept a generic setter to match different parent setState signatures
  setTurnoAModificar: (turno: any) => void;
  onClose?: () => void;
  onSuccess?: () => void | Promise<void>;
}

async function modificarTurno(cod_turno: number, nuevaFecha: string) {
  const res = await fetch("/api/turnos/modificar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cod_turno, fecha_hora_turno: nuevaFecha }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al modificar turno");
  return data;
}

const Modificar = ({ turnoViejo, turnoNuevo, setTurnoAModificar, onClose, onSuccess }: ModificarProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modificadoPreviamente, setModificadoPreviamente] = useState(false);

  console.log("turno viejo",turnoViejo,"turno nuevo", turnoNuevo);
  
  // Safely extract fecha and hora from turnoNuevo
  const nuevaFecha = turnoNuevo?.fecha?.split("T")[0] || '';
  const nuevoHorario = turnoNuevo?.fecha?.split("T")[1]?.slice(0, 5) || '';

  const confirmarModificacion = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const result = await modificarTurno(
        turnoViejo.cod_turno,
        turnoNuevo.fecha,
      );

      console.log("Turno modificado:", result);
      setShowSuccess(true);
      // Notify parent to refresh the list
      try {
        if (onSuccess) await onSuccess();
      } catch (e) {
        // don't block UI if refresh fails
        console.warn("onSuccess callback failed:", e);
      }
    } catch (err: any) {
      console.error(" Error al modificar:", err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setTurnoAModificar(null);
      if (onClose) onClose();
    }
  };

     return (
          <>{ !showSuccess && !modificadoPreviamente && (
               <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                         <h3 className="text-xl font-bold mb-4">
                              Informacion nuevo turno: 
                         </h3>
                         <p className="mb-4">
                              Médico: <b>{turnoNuevo.medico?.nombre} {turnoNuevo.medico?.apellido}</b> <br />
                              Especialidad: <b>{turnoNuevo.descripcion}</b> <br />
                              Fecha: <b> {nuevaFecha}
 </b> - Hora:
                              <b> {nuevoHorario}</b>
                                            
                         </p>
                      
                              <Button className="w-full mb-2" onClick={confirmarModificacion}>
                                   Confirmar Turno
                              </Button>
                        

                         <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setTurnoAModificar(null)}
                         >
                              Cancelar
                         </Button>
                    

               
               </div>
                    </div> )}
               {/*exito */}
               {showSuccess && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
      <h3 className="text-lg font-bold mb-2 text-green-600">¡Turno modificado con éxito!</h3>
      <p className="mb-4">
        Tu turno fue modificado correctamente. Recibirás una notificación 24 horas antes.
      </p>
      <Button
        onClick={() => {
          setShowSuccess(false);
          if (onClose) onClose();
        }}
      >
        Aceptar
      </Button>
    </div>
  </div>
)}

{!showSuccess && modificadoPreviamente && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
      <h3 className="text-lg font-bold mb-2 text-green-600">No se puede reprogramar</h3>
      <p className="mb-4">
        Tu turno ya fue modificado una vez, no se puede reprogramar nuevamente.
      </p>
      <Button
        onClick={() => {
          setShowSuccess(false);
          if (onClose) onClose();
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


export default Modificar;
