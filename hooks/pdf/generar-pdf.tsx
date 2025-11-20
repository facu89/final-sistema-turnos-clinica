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
  nombreArchivo = "reporte_medicos.pdf"
) {
  const turnosPorMedico = turnos.reduce(
    (acc, turno) => {
      const medicoKey = `${turno.nombre_medico}_${turno.apellido_medico}`;
      if (!acc[medicoKey]) {
        acc[medicoKey] = [];
      }
      acc[medicoKey].push(turno);
      return acc;
    },
    {} as Record<string, Turno[]>
  );

  const doc = new jsPDF();
  let isFirstPage = true;

  Object.entries(turnosPorMedico).forEach(([medicoKey, turnosMedico]) => {
    const [nombre, apellido] = medicoKey.split("_");
    const especialidad = turnosMedico[0]?.especialidad?.descripcion || "";

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    doc.setFontSize(16);
    doc.text(`Turnos - Dr. ${nombre} ${apellido} - ${especialidad}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Total de turnos: ${turnosMedico.length}`, 20, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Código", "Paciente", "Fecha", "Hora", "Estado"]],
      body: turnosMedico.map((t) => [
        t.cod_turno,
        `${t.nombre_paciente} ${t.apellido_paciente}`,
        new Date(t.fecha_hora_turno).toLocaleDateString("es-ES"),
        new Date(t.fecha_hora_turno).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        t.estado_turno,
      ]),
    });
  });

  doc.save(nombreArchivo);
}
