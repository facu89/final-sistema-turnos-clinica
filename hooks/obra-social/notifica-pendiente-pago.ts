import { obtenerPacienteTurno } from "../turnos/obtener-paciente-turno";
import { obtenerMedicoTurno } from "../turnos/obtener-medico-turno";
import { sendTurnoPendientePagoNotification } from "../email-resend-obra";

export async function notificarCambioEstadoTurno({
  idTurno,
  descripcion,
  nuevoEstado,
  fechaHoraTurno,
  especialidad,
}: {
  idTurno: string;
  descripcion: string;
  nuevoEstado: string;
  fechaHoraTurno: string;
  especialidad: string;
}) {
  try {
    console.log("LLEGUE A NOTIFICAR CAMBIOE  ESTADO TURNO hola");
    console.log(idTurno, descripcion, nuevoEstado, fechaHoraTurno);

    const pacienteResult = await obtenerPacienteTurno(idTurno);
    const medicoResult = await obtenerMedicoTurno(idTurno);
    console.log("despues de los datos");

    if (!pacienteResult.success) {
      console.log(`Error obteniendo paciente: ${pacienteResult.error}`);
      throw new Error(`Error obteniendo paciente: ${pacienteResult.error}`);
    }

    if (!medicoResult.success) {
      console.log(`Error obteniendo médico: ${medicoResult.error}`);

      throw new Error(`Error obteniendo médico: ${medicoResult.error}`);
    }

    if (!pacienteResult.data?.email) {
      console.log("El paciente no tiene email registrado");

      throw new Error("El paciente no tiene email registrado");
    }

    const fechaHora = new Date(fechaHoraTurno || new Date());

    console.log(
      pacienteResult.data.email,
      pacienteResult.data.nombre,
      medicoResult.data?.nombre,
      fechaHoraTurno
    );

    const notificationResult = await sendTurnoPendientePagoNotification({
      pacienteEmail: pacienteResult.data.email,
      pacienteNombre: `${pacienteResult.data.nombre} ${pacienteResult.data.apellido}`,
      fechaTurno: fechaHora.toLocaleDateString(),
      horaTurno: fechaHora.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      medicoNombre: `Dr. ${medicoResult.data?.nombre} ${medicoResult.data?.apellido}`,
      especialidad: especialidad,
      obraSocial: descripcion,
      numeroTurno: idTurno,
    });

    if (!notificationResult.success) {
      throw new Error(
        `Error enviando notificación: ${notificationResult.error}`
      );
    }

    return {
      success: true,
      message: `Notificación enviada exitosamente a ${pacienteResult.data.email}`,
      data: notificationResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
