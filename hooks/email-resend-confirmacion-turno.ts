const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function sendConfirmacionTurno({
  nombre_paciente,
  apellido_paciente,
  nombre_medico,
  especialidad,
  fecha_turno,
  email_paciente,
}: {
  nombre_paciente: string;
  apellido_paciente: string;
  nombre_medico: string;
  especialidad: string;
  fecha_turno: Date;
  email_paciente: string;
}) {
  try {
    const fechaFormateada = new Date(fecha_turno).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏥 Clínica System</h1>
          <p style="color: #64748b; margin: 5px 0;">Sistema de Turnos</p>
        </div>
        <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #065f46; margin-top: 0;">Confirmación de turno</h2>
          <p style="color: #065f46; margin-bottom: 0;">
            Hola ${nombre_paciente} ${apellido_paciente}, su turno ha sido procesado correctamente.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">📋 Datos del turno</h3>
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">Nombre del médico:</span>
              <span style="color: #1e293b;">${nombre_medico}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">Especialidad:</span>
              <span style="color: #1e293b;">${especialidad}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">Fecha y hora del turno:</span>
              <span style="color: #1e293b;">${fechaFormateada}</span>
            </div>
          </div>
        </div>
        <div style="text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
            📞 <strong>Consultas:</strong> +54 11 1234-5678
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
            📧 <strong>Email:</strong> consultas@clinica.com
          </p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            Este email fue enviado automáticamente por el Sistema de Turnos de la Clínica.<br>
            Por favor, no responda a este email.
          </p>
        </div>
      </div>
    `;

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Clínica System", email: "devsistematurnos@gmail.com" },
        to: [{ email: email_paciente }],
        subject: `Confirmación de turno`,
        htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error };
  }
}
