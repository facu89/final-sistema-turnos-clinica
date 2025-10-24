import { NextRequest, NextResponse } from "next/server";
import { sendReintegroNotification } from "@/hooks/email-resend-reintegro";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//TUVE  QUE MOVER ESTA FUNCION A BACKEND PORQUE LA API KEY DE RESEND NO SE PUEDE ACCEDER EN FRONT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cod_turno, montoReintegro } = body;
    const { data: turnoData, error: turnoError } = await supabase
      .from("turno")
      .select("profiles(dni_paciente, telefono, email)")
      .eq("cod_turno", cod_turno)
      .single();

    if (turnoError || !turnoData?.profiles) {
      return NextResponse.json(
        { error: "No se encontraron datos del paciente" },
        { status: 404 }
      );
    }

    const paciente = Array.isArray(turnoData.profiles)
      ? turnoData.profiles[0]
      : turnoData.profiles;

    const dniPaciente = paciente.dni_paciente;
    const telefono = paciente.telefono;
    const correoPaciente = paciente.email;

    // Buscar y notificar en background
    setTimeout(async () => {
      const { data: admins, error: adminError } = await supabase
        .from("profiles_administrativos")
        .select("email");

      if (adminError || !admins) {
        console.error("No se encontraron emails de administrativos");
        return;
      }

      admins.forEach(async (admin: any) => {
        await sendReintegroNotification({
          administrativoEmail: admin.email,
          dniPaciente,
          telefono,
          correoPaciente,
          monto: montoReintegro,
        });
      });
    }, 0);

    // Responde rápido al cliente
    return NextResponse.json({
      success: true,
      message: "Notificaciones enviándose en background.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
