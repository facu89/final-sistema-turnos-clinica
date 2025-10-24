import React from "react";
import { useState, useEffect } from "react";
import { turnosDisponibles } from "../../../data/Info";
import { Edit, X } from "lucide-react";
import DialogCancelar from "../../components/DialogCancelar";
import { Button } from "@/components/ui/button";
import { ModificarTurno } from "./ModificarTurno";
import { calcularReintegro } from "@/hooks/pago/calcular-reintegro";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const ListarTurnosAgendados = ({ dni_paciente }: any) => {
  const [turnosAgendados, setTurnosAgendados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [turnoACancelar, setTurnoACancelar] = useState<number | null>(null);
  const [loadingCancelar, setLoadingCancelar] = useState(false);

  async function cancelarTurno(cod_turno: number) {
    const montoReintegro = await calcularReintegro(cod_turno); //llamo a la funcion para calcular el reintegro
    if (montoReintegro && montoReintegro > 0) {
      await fetch("/api/reintegro/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cod_turno,
          montoReintegro: Number(montoReintegro),
        }),
      });
    }

    setLoadingCancelar(true);
    console.log("eliminar el turno con el codigo", cod_turno);
    try {
      const response = await fetch(`/api/turnos/turnosPaciente`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cod_turno }),
      });
      if (!response.ok) throw new Error("Error al cancelar turno");
      //vuelvo a setear los turnos para que se reflejen los cambios
      setTurnosAgendados((prev) =>
        prev.filter((turno) => turno.cod_turno !== cod_turno)
      );
      setDialogOpen(false);
      setTurnoACancelar(null);
    } catch (error) {
      console.error("Error: ", error);
    }
    setLoadingCancelar(false);
  }
  async function getTurnosPaciente(dniPaciente: any) {
    try {
      const response = await fetch(
        `/api/turnos/turnosPaciente?dni_paciente=${dniPaciente}`,
        {
          cache: "no-store",
        }
      );
      if (!response.ok) throw new Error("Error al obtener turnos");
      const data = await response.json();
      return Array.isArray(data)
        ? data.sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          )
        : [];
    } catch (error) {
      console.error("Error: ", error);
      return [];
    }
  }

  useEffect(() => {
    const loadTurnos = async () => {
      setIsLoading(true);
      if (dni_paciente) {
        const data = await getTurnosPaciente(dni_paciente);
        setTurnosAgendados(data);
      }
      setIsLoading(false);
    };
    loadTurnos();
  }, [dni_paciente]);
  useEffect(() => {
    console.log(turnosAgendados);
  }, [turnosAgendados]);

  const [turnoAModificar, setTurnoAModificar] = useState<any>(null);


 




    if (turnoAModificar) {
      return (
        <ModificarTurno
          turnoAModificar={turnoAModificar}
          setTurnoAModificar={setTurnoAModificar}
        />
      );
    }
  return (
    <Table className="w-full text-m">
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            Médico
          </TableHead>
          <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            Fecha
          </TableHead>
          <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            Hora
          </TableHead>
          <TableHead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            Consultorio
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {turnosAgendados.map((turno) => (
          <TableRow key={turno.cod_turno}>
            <TableCell>
              {turno.medico
                ? `${turno.medico.nombre ?? ""} ${
                    turno.medico.apellido ?? ""
                  }`.trim()
                : "-"}
            </TableCell>

            <TableCell>{turno.fecha_hora_turno.split("T")[0]}</TableCell>
            <TableCell>
              {turno.fecha_hora_turno.split("T")[1].slice(0, 5)}
            </TableCell>

            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                    onClick={() => setTurnoAModificar(turno)}  //lo comento porque rompe todo
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modificar
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDialogOpen(true);
                    setTurnoACancelar(turno.cod_turno);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/administrativo/turnos/${turno.cod_turno}`)
                  }
                >
                  Ver Detalle
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        <DialogCancelar
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setTurnoACancelar(null);
          }}
          loading={loadingCancelar}
          onConfirm={() => turnoACancelar && cancelarTurno(turnoACancelar)}
        />
        {!isLoading && turnosAgendados.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              No tienes turnos agendados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
