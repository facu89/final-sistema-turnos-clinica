//OBTENER TODOS LOS TURNOS DE LA CLINICA
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("turno")
      .select(
        `
        cod_turno,
        estado_turno,
        dni_paciente,
        fecha_hora_turno,
        turno_modificado,
        legajo_medico,
        medico!inner(
          legajo_medico,
          nombre,
          apellido
        ),
        profiles!inner(
          dni_paciente,
          nombre,
          apellido
        ),
        especialidad(id_especialidad,descripcion)
      `
      )
      .order("fecha_hora_turno", { ascending: true });

    if (error) {
      console.error("Error en consulta:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log("No se encontraron datos");
      return NextResponse.json([]);
    }

    const turnosFormateados = data.map((turno: any, index: number) => {
      let nombrePaciente = "Sin nombre";
      let apellidoPaciente = "Sin apellido";
      let nombreMedico = "Sin nombre";
      let apellidoMedico = "Sin apellido";

      if (turno.profiles) {
        if (Array.isArray(turno.profiles)) {
          nombrePaciente = turno.profiles[0]?.nombre || "Sin nombre";
          apellidoPaciente = turno.profiles[0]?.apellido || "Sin apellido";
        } else {
          nombrePaciente = turno.profiles.nombre || "Sin nombre";
          apellidoPaciente = turno.profiles.apellido || "Sin apellido";
        }
      }

      if (turno.medico) {
        if (Array.isArray(turno.medico)) {
          nombreMedico = turno.medico[0]?.nombre || "Sin nombre";
          apellidoMedico = turno.medico[0]?.apellido || "Sin apellido";
        } else {
          nombreMedico = turno.medico.nombre || "Sin nombre";
          apellidoMedico = turno.medico.apellido || "Sin apellido";
        }
      }
      const resultado = {
        cod_turno: turno.cod_turno,
        estado_turno: turno.estado_turno,
        dni_paciente: turno.dni_paciente,
        fecha_hora_turno: turno.fecha_hora_turno,
        legajo_medico: turno.legajo_medico,
        nombre_paciente: nombrePaciente,
        apellido_paciente: apellidoPaciente,
        nombre_medico: nombreMedico,
        apellido_medico: apellidoMedico,
        especialidad: turno.especialidad, // <-- AGREGA ESTA LÍNEA
      };

      return resultado;
    });
    return NextResponse.json(turnosFormateados);
  } catch (error) {
    console.error("Error en API turnos/todos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/*
SELECT cod_turno, profiles.dni_paciente, fecha_hora_turno, legajo_medico,
 nombre as nombre_paciente, apellido as apellido_paciente,
 nombre_medico, apellido_medico
FROM
(SELECT cod_turno, dni_paciente, fecha_hora_turno, medico.legajo_medico, nombre as nombre_medico, apellido as apellido_medico FROM turno 
JOIN medico 
ON turno.legajo_medico = medico.legajo_medico
) AS turno_medico
JOIN profiles ON profiles.dni_paciente = turno_medico.dni_paciente


*/
