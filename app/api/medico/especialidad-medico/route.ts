import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//tuve que hacer un endpoint para obtener los medicos por especialidad porque no me andaba en el componente dialog xd
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id_especialidad = searchParams.get("id_especialidad");

  //  de la especialidad
  console.log("LLego a medicos especialidad con el id", id_especialidad);
  const { data, error } = await supabase
    .from("medico_especialidad")
    .select("medico(legajo_medico, nombre, apellido)")
    .eq("id_especialidad", Number(id_especialidad));

  if (error) {
    console.error("Error obteniendo médicos por especialidad:", error);
  }
  return NextResponse.json({ data, error });
}
