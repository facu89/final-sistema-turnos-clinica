import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { sendAvisoTurno } from "../hooks/email-resend-aviso-turno";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function enviarNotificacionesPendientes() {
  const hoy = new Date();
  const inicio = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() + 1,
    0,
    0,
    0
  );
  const fin = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() + 2,
    0,
    0,
    0
  );

  const { data: turnos, error } = await supabase
    .from("turno")
    .select(
      `medico( nombre, apellido),
       paciente(nombre, apellido, telefono), 
       fecha_hora_turno,
       especialidad(descripcion)`
    )
    .gte("fecha_hora_turno", inicio.toISOString())
    .lt("fecha_hora_turno", fin.toISOString());

  if (error) {
    console.error(
      "Hubo un problema trayendo los turnos en notificacionPaciente:",
      error
    );
    return;
  }

  for (const turno of turnos) {
    console.log(`${turno}`);
    /*sendAvisoTurno({
      nombre_paciente: turno.paciente.nombre,
      apellido_paciente: turno.paciente.apellido,
      nombre_medico: turno.medico.nombre,
      especialidad: turno.especialidad.descripcion,
      fecha_turno: turno.fecha_hora_turno,
      email_paciente: turno.paciente.email,
    });*/
  }
}
//*/10 * * * *
//"0 6 * * *"
cron.schedule("*/1 * * * *", () => {
  enviarNotificacionesPendientes();
});

console.log("Job de notificaciones programado para las 6 am todos los días.");
