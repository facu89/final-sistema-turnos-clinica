import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const ReporteDemandaEspecialidad = () => (
  <Card>
    <CardHeader>
      <CardTitle>Informe de Demanda por Especialidad</CardTitle>
      <CardDescription>
        Consulta la demanda de turnos por especialidad.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full">
        <FileText className="h-4 w-4 mr-2" />
        Generar Informe de Demanda por Especialidad
      </Button>
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Médico</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTurnos.map((turno) => {
            const { fecha, hora } = formatearFechaHora(turno.fecha_hora_turno);
            return (
              <TableRow key={turno.cod_turno}>
                <TableCell>#{turno.cod_turno}</TableCell>
                <TableCell>
                  {turno.nombre_paciente} {turno.apellido_paciente}
                  <br />
                  <span className="text-xs text-gray-500">
                    DNI: {turno.dni_paciente}
                  </span>
                </TableCell>
                <TableCell>
                  {turno.nombre_medico} {turno.apellido_medico}
                  <br />
                  <span className="text-xs text-gray-500">
                    Legajo: {turno.legajo_medico}
                  </span>
                </TableCell>
                <TableCell>{turno.especialidad?.descripcion}</TableCell>
                <TableCell>{fecha}</TableCell>
                <TableCell>{hora}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${
                      turno.estado_turno === "Pendiente de pago"
                        ? "bg-orange-50 text-orange-700 border-orange-300"
                        : turno.estado_turno === "Pagado" ||
                            turno.estado_turno === "Confirmado"
                          ? "bg-green-50 text-green-700 border-green-300"
                          : turno.estado_turno === "Cancelado"
                            ? "bg-red-50 text-red-700 border-red-300"
                            : turno.estado_turno === "Pendiente"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                              : turno.estado_turno === "Reasignado"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-gray-50 text-gray-700 border-gray-300"
                    }`}
                  >
                    {turno.estado_turno || "Sin estado"}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
