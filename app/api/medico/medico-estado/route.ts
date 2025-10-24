// app/api/medico/medico-estado/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SOLO server
);

export async function PUT(req: Request) {
  try {
    const { legajo_medico, estado } = await req.json();

    if (!Number.isFinite(Number(legajo_medico)) || !["activo","inactivo"].includes(estado)) {
      return NextResponse.json({ ok: false, message: "Datos inválidos" }, { status: 400 });
    }

    // Si vamos a INHABILITAR, validar turnos futuros asignados
    if (estado === "inactivo") {
      const nowIso = new Date().toISOString();
      const { count, error } = await supabase
        .from("turno")
        .select("cod_turno", { head: true, count: "exact" })
        .eq("legajo_medico", Number(legajo_medico))
        .not("dni_paciente", "is", null)
        .gte("fecha_hora_turno", nowIso);
        // .in("estado_turno", ["pendiente","confirmado","asignado"]) // si tu tabla usa estos estados

      if (error) {
        return NextResponse.json({ ok: false, message: "Error consultando turnos" }, { status: 500 });
      }
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { ok: false, message: "No se puede inhabilitar: tiene turnos asignados a futuro." },
          { status: 409 }
        );
      }
    }

    const { error: updErr } = await supabase
      .from("medico")
      .update({ estado })
      .eq("legajo_medico", Number(legajo_medico));

    if (updErr) {
      return NextResponse.json({ ok: false, message: "No se pudo actualizar el estado." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? "Error" }, { status: 500 });
  }
}
