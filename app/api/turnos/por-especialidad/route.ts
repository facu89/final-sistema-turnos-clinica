import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
//devuelve los turnos de un medico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_especialidad = searchParams.get("id_especialidad");
    if (!id_especialidad) return NextResponse.json({ error: "Falta id_especialidad" }, { status: 400 });

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("turno")
      .select("*")
      .eq("id_especialidad", Number(id_especialidad))
      .in("estado_turno", ["Reasignado", "Pendiente de pago", "Reservado"])
      .gt("fecha_hora_turno", nowIso)
      .order("fecha_hora_turno", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
