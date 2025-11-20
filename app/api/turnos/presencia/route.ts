import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PUT(req: NextRequest) {
  // leer el cuerpo y aceptar varios nombres de campo
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido o ausente" }, { status: 400 });
  }

  const rawId =
    body?.cod_turno ??
    body?.codTurno ??
    body?.id ??
    body?.turnoId;

  const cod_turno = Number(rawId);
  const presencia = body?.presencia === undefined ? true : !!body?.presencia;

  if (!Number.isFinite(cod_turno)) {
    return NextResponse.json(
      { error: `cod_turno es requerido. Recibido: ${JSON.stringify(body)}` },
      { status: 400 }
    );
  }

  // Actualizamos presencia_turno (columna booleana)
  const { data, error } = await supabase
    .from("turno")
    .update({ presencia_turno: presencia })
    .eq("cod_turno", cod_turno)
    .select("cod_turno, presencia_turno")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
