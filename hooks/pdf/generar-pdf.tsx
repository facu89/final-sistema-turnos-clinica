import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
interface Especialidad {
  id_especialidad: number;
  descripcion: string;
}

interface Turno {
  cod_turno: number;
  nombre_paciente: string;
  apellido_paciente: string;
  nombre_medico: string;
  apellido_medico: string;
  especialidad?: Especialidad;
  fecha_hora_turno: string;
  estado_turno: string;
}
export function generarPDFTablaTurnos(
  turnos: Turno[],
  nombreArchivo = "reporte.pdf"
) {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [
      [
        "Código",
        "Paciente",
        "Médico",
        "Especialidad",
        "Fecha",
        "Hora",
        "Estado",
      ],
    ],
    body: turnos.map((t) => [
      t.cod_turno,
      `${t.nombre_paciente} ${t.apellido_paciente}`,
      `${t.nombre_medico} ${t.apellido_medico}`,
      t.especialidad?.descripcion || "",
      new Date(t.fecha_hora_turno).toLocaleDateString("es-ES"),
      new Date(t.fecha_hora_turno).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      t.estado_turno,
    ]),
  });
  doc.save(nombreArchivo);
}
