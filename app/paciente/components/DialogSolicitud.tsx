import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth/useAuth"; //este hook devuelve el id del usuario con la sesion actual

interface Medico {
  legajo_medico: String;
  nombre: String;
  apellido: String;
}
interface Patologia {
  id_patologia: string;
  descripcion: string;
}
async function setListaEsperaEspecialidad(
  especialidad: string,
  patologia: string,
  userId: string
) {
  const data = await fetch(`/api/dniPaciente?id_paciente=${userId}`);
  const { dni_paciente } = await data.json();
  console.log("DNI del paciente:", dni_paciente);
  await fetch("/api/lista-espera/especialidad", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      especialidad,
      patologia,
      dni_paciente,
    }),
  });
}
async function setListaEsperaMedico(
  medico: string,
  patologia: string,
  userId: string
) {
  const data = await fetch(`/api/dniPaciente?id_paciente=${userId}`);
  const { dni_paciente } = await data.json();
  console.log("DNI del paciente:", dni_paciente);
  await fetch("/api/lista-espera/medico", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      medico,
      patologia,
      dni_paciente,
    }),
  });
}

async function getPatologias(id_especialidad: string) {
  const response = await fetch(
    `/api/patologia?id_especialidad=${id_especialidad}`
  );
  const result = await response.json();
  const patologias = (result.data ?? []).map((item: any) => ({
    id_patologia: item.patologia.cod_patologia,
    descripcion: item.patologia.descripcion,
  }));
  return patologias;
}
//hago una funcion para obtener los medicos por especialidad
//NO HAGO UN ENDPOINT PORQUE ES MUY ESPECIFICO
async function getMedicosPorEspecialidad(id_especialidad: string) {
  console.log("fetching medicos for especialidad:", id_especialidad);
  const response = await fetch(
    `/api/medico/especialidad-medico?id_especialidad=${id_especialidad}`
  );
  const result = await response.json();
  console.log("info", result);

  // Extrae solo los médicos
  const medicos = (result.data ?? []).map((item: any) => item.medico);
  return medicos;
}

interface DialogSolicitudProps {
  id_especialidad: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  resultado: string | null;
  error: string | null;
  especialidad: string; // id_especialidad
  medico?: string;
  onConfirm: () => void;
}

const DialogSolicitud: React.FC<DialogSolicitudProps> = ({
  id_especialidad,
  open,
  onOpenChange,
  loading,
  resultado,
  error,
  especialidad,
  medico,
  onConfirm,
}) => {
  const { userId } = useAuth();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [patologias, setPatologias] = useState<Patologia[]>([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<string>("0");
  const [patologiaSeleccionada, setPatologiaSeleccionada] =
    useState<string>("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  useEffect(() => {
    async function fetchMedicos() {
      const medicos = await getMedicosPorEspecialidad(id_especialidad);
      setMedicos(medicos);
      if (medicos.length > 0) {
        setMedicoSeleccionado(medico ?? (medicos[0].legajo_medico as string));
      }
    }
    fetchMedicos();
  }, [id_especialidad, medico]);

  useEffect(() => {
    async function fetchPatologias() {
      const patologias = await getPatologias(id_especialidad);
      setPatologias(patologias);

      if (patologias.length > 0) {
        setPatologiaSeleccionada(patologias[0].id_patologia);
      } else {
        setPatologiaSeleccionada("");
      }
    }
    fetchPatologias();
  }, [id_especialidad]);
  // esto es porque no se me reseteaba la solicitud xd
  useEffect(() => {
    if (open) {
      setSolicitudEnviada(false);
    }
  }, [open]);

  const handlePatologiaChange = (id: string) => {
    setPatologiaSeleccionada(id);
  };

  const handleConfirm = async () => {
    if (medicoSeleccionado && medicoSeleccionado !== "0") {
      await setListaEsperaMedico(
        medicoSeleccionado,
        patologiaSeleccionada,
        userId
      );
    } else {
      await setListaEsperaEspecialidad(
        id_especialidad,
        patologiaSeleccionada,
        userId
      );
    }
    setSolicitudEnviada(true);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar solicitud</DialogTitle>
        </DialogHeader>
        {!solicitudEnviada ? (
          <>
            <p>
              ¿Desea solicitar el ingreso a la lista de espera para la
              especialidad <b>{especialidad}?</b>
            </p>
            <p className="mt-4">Seleccione el médico:</p>
            <select
              value={medicoSeleccionado}
              onChange={(e) => setMedicoSeleccionado(e.target.value)}
              className="ml-2 px-2 py-1 border rounded"
            >
              <option key="0" value="0">
                Cualquier medico
              </option>
              {medicos.map((m) => (
                <option
                  key={m.legajo_medico as string}
                  value={m.legajo_medico as string}
                >
                  {m.nombre} {m.apellido}
                </option>
              ))}
            </select>
            <p className="mt-4">Seleccione la patología:</p>
            <div className="flex flex-col space-y-2">
              {patologias.map((patologia, idx) => (
                <label
                  key={patologia.id_patologia ?? idx}
                  htmlFor={patologia.id_patologia}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    id={patologia.id_patologia}
                    name="patologia"
                    value={patologia.id_patologia}
                    checked={patologiaSeleccionada === patologia.id_patologia}
                    onChange={() =>
                      handlePatologiaChange(patologia.id_patologia)
                    }
                  />
                  <span className="text-sm font-normal">
                    {patologia.descripcion}
                  </span>
                </label>
              ))}
            </div>
            {resultado && <p className="text-green-600 mt-2">{resultado}</p>}
            {error && <p className="text-red-600 mt-2">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? "Enviando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-green-600 text-lg font-semibold mb-2">
              Solicitud enviada
            </p>
            <p className="text-center text-muted-foreground">
              Cuando se libere un turno, será notificado.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialogSolicitud;
