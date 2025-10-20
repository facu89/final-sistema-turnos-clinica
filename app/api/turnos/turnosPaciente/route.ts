import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//Obtengo todos los turnos de un paciente
export async function GET(request: NextRequest, dniPaciente: string) {
     console.log("EndPoint llamado");
     const { data, error } = await supabase
          .from("turno")
          .select("*")
          .eq("dni_paciente", dniPaciente);


     if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
     }

     return NextResponse.json(data);
}