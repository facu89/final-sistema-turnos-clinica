import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
interface Turno {
  cod_turno: number;
  fecha_hora_turno: string;
  medico: {
    nombre: string;
    apellido: string;
  };
  profiles: {
    nombre: string;
    apellido: string;
    email: string;
  };
  especialidad: {
    descripcion: string;
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Calcular fecha de mañana (desde las 00:00 hasta las 23:59)
    const today = new Date();

    // Inicio: 00:00 del día siguiente (mañana)
    const now = new Date();
    now.setHours(now.getHours() - 3);

    // Día siguiente (mañana, según horario local)
    const inicio = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    );
    const fin = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      23,
      59,
      59,
      999,
    );

    console.log("🕐 Fecha base local (Argentina):", now);
    console.log(
      "📅 Filtrando turnos entre:",
      inicio.toISOString(),
      fin.toISOString(),
    );

    const { data: turnos, error } = await supabase
      .from("turno")
      .select(`
    cod_turno,
    fecha_hora_turno,
    estado_turno,
    medico(nombre, apellido),
    profiles(nombre, apellido, email),
    especialidad(descripcion)
  `)
      .gte(
        "fecha_hora_turno",
        inicio.toISOString(),
      )
      .lt(
        "fecha_hora_turno",
        fin.toISOString(),
      ).eq("estado_turno", "Reservado") as {
        data: Turno[] | null;
        error: any;
      };

    console.log(`🔍 Turnos encontrados: ${turnos?.length ?? 0}`);
    console.log(turnos);

    if (error) {
      console.error("❌ Error al obtener turnos:", error);
      return new Response(
        JSON.stringify({ error: "Error al consultar turnos" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let notificacionesEnviadas = 0;

    // Enviar notificaciones a cada paciente
    for (const turno of turnos ?? []) {
      try {
        notificacionesEnviadas++;
        /*   nombre_paciente: string;
    apellido_paciente: string;
    nombre_medico: string;
    especialidad: string;
    fecha_turno: Date;
    email_paciente: string; */
        const data = await sendAvisoTurno({
          nombre_paciente: turno.profiles.nombre,
          apellido_paciente: turno.profiles.apellido,
          nombre_medico: turno.medico.nombre,
          especialidad: turno.especialidad.descripcion,
          fecha_turno: new Date(turno.fecha_hora_turno),
          email_paciente: turno.profiles.email,
        });
      } catch (e) {
        console.error(
          `⚠️ Error enviando notificación para turno ${turno.cod_turno}:`,
          e,
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: `Notificaciones procesadas: ${notificacionesEnviadas}}`,
        turnos: turnos?.length ?? 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

// Función para formatear la fecha en español
function formatearFecha(fecha: Date): string {
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const diaSemana = dias[fecha.getDay()];
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");

  return `${diaSemana} ${dia} de ${mes} de ${año} a las ${horas}:${minutos}hs`;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";

//notificacion al paciente para cuando tenga un turno al dia siguiente
export async function sendAvisoTurno({
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
    // Formatear la fecha antes de usarla en el HTML
    const fechaFormateada = formatearFecha(fecha_turno);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏥 Clínica System</h1>
          <p style="color: #64748b; margin: 5px 0;">Sistema de Turnos</p>
        </div>
        <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #065f46; margin-top: 0;">⏰ Mañana tenés un turno!</h2>
          <p style="color: #065f46; margin-bottom: 0;">
            Hola ${nombre_paciente} ${apellido_paciente}, te recordamos que mañana tenés un turno:
          </p>
        </div>
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">📋 Detalles del Turno</h3>
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">👨‍⚕️ Médico:</span>
              <span style="color: #1e293b;">${nombre_medico}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">🏥 Especialidad:</span>
              <span style="color: #1e293b;">${especialidad}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: bold; color: #475569;">📅 Fecha y Hora:</span>
              <span style="color: #1e293b; font-weight: bold;">${fechaFormateada}</span>
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
        subject: `Aviso de turno próximo`,
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
