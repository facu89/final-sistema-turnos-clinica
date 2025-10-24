import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
//obtengo las patologias correposdienres a la especiliadad
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_especialidad = searchParams.get("id_especialidad");
    const { data, error } = await supabase
      .from("patologia_especialidad")
      .select("patologia(cod_patologia, descripcion)")
      .eq("id_especialidad", id_especialidad);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
