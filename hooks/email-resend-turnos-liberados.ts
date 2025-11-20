const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function sendTurnosLiberadosNotification({
    pacienteEmail,
    especialidad,
    nombre,
    apellido,
}: {
    pacienteEmail: string;
    especialidad: string;
    nombre: string;
    apellido: string;
}) {
    try {
        console.log("enviando un email a ", pacienteEmail);
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏥 Clínica System</h1>
          <p style="color: #64748b; margin: 5px 0;">Sistema de Turnos</p>
        </div>
        <div style="background: #e0f2fe; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #2563eb; margin-top: 0;">¡Se ha liberado un turno!</h2>
          <p style="color: #2563eb; margin-bottom: 0;">
           Se han liberado nuevos turnos en la especialidad que te interesa.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">📋 Detalles del turno</h3>
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">Especialidad:</span>
              <span style="color: #1e293b;">${especialidad}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">Médico:</span>
              <span style="color: #1e293b;">${nombre} ${apellido}</span>
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
                sender: {
                    name: "Clínica System",
                    email: "devsistematurnos@gmail.com",
                },
                to: [{ email: pacienteEmail }],
                subject: `¡Se han liberado turnos!`,
                htmlContent,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Error enviando email de turno liberado:", result);
            return { success: false, error: result };
        }

        console.log("Email de turno liberado enviado exitosamente:", result);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error en sendTurnoLiberadoNotification:", error);
        return { success: false, error };
    }
}
