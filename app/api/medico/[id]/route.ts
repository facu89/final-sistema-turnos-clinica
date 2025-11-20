import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0; //estos 2 parametros hacen que no traiga la informacion cacheada
//si se rompe algo lo sacamos a la mierda
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  const legajo = Number(params.id);
  if (isNaN(legajo)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { data: medico, error: errorMedico } = await supabase
    .from("medico")
    .select("*,especialidad(id_especialidad,descripcion)")
    .eq("legajo_medico", legajo)
    .single();

  if (errorMedico || !medico) {
    return NextResponse.json({ error: "Medico xd" });
  }

  return NextResponse.json(medico);
}
