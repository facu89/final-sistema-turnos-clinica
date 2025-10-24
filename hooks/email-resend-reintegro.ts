import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReintegroNotification({
  administrativoEmail,
  dniPaciente,
  telefono,
  correoPaciente,
  monto,
}: {
  administrativoEmail: string;
  dniPaciente: string;
  telefono: string;
  correoPaciente: string;
  monto: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Clínica System <noreply@resend.dev>",
      to: [administrativoEmail],
      subject: ` Notificación de Reintegro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🏥 Clínica System</h1>
            <p style="color: #64748b; margin: 5px 0;">Sistema de Turnos</p>
          </div>
          <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #065f46; margin-top: 0;"> Hay un reintegro pendiente</h2>
            <p style="color: #065f46; margin-bottom: 0;">
              Se ha procesado un reintegro para el siguiente paciente:
            </p>
          </div>
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">📋 Datos del paciente</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">DNI:</span>
                <span style="color: #1e293b;">${dniPaciente}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Teléfono:</span>
                <span style="color: #1e293b;">${telefono}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Email:</span>
                <span style="color: #1e293b;">${correoPaciente}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                <span style="font-weight: bold; color: #475569;">Monto reintegrado:</span>
                <span style="color: #059669;">$${monto}</span>
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
      `,
    });

    if (error) {
      console.error("Error enviando email de reintegro:", error);
      return { success: false, error };
    }

    console.log("Email de reintegro enviado exitosamente:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error en sendReintegroNotification:", error);
    return { success: false, error };
  }
}
