// app/api/obraSocial/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { notificarCambioEstadoTurno } from "@/hooks/obra-social/notifica-pendiente-pago";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

type Turno = {
  cod_turno: number;
  fecha_hora_turno: string;
  id_especialidad: number;
};

/* =========================
   GET — Lista obras sociales
   ========================= */
export async function GET() {
  try {
    const hoy = new Date().toISOString().split("T")[0];

    // Promueve a "Habilitado" las obras con fecha ya alcanzada
    const { error: updateError } = await supabaseAdmin
      .from("obra_social")
      .update({ estado: "Habilitado" })
      .eq("estado", "Pendiente")
      .lte("fecha_cambio_estado", hoy)
      .select();

    if (updateError) console.error("Error actualizando estados:", updateError);

    const { data: obrasSociales, error: selectError } = await supabaseAdmin
      .from("obra_social")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectError) {
      console.error("Error en consulta:", selectError);
      throw new Error(`Error de base de datos: ${selectError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: obrasSociales ?? [],
      metadata: {
        total: obrasSociales?.length ?? 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /obraSocial:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

/* =====================================
   POST — Crear nueva obra social (alta)
   ===================================== */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as {
      data?: {
        descripcion?: string;
        telefono_contacto?: string | null;
        sitioweb?: string | null;
        fecha_vigencia?: string; // yyyy-mm-dd
      };
    };

    if (!data?.descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 },
      );
    }
    if (!data?.fecha_vigencia) {
      return NextResponse.json(
        { error: "La fecha de vigencia es requerida" },
        { status: 400 },
      );
    }

    const fechaVigencia = new Date(data.fecha_vigencia);
    const fechaActual = new Date();
    fechaVigencia.setHours(0, 0, 0, 0);
    fechaActual.setHours(0, 0, 0, 0);

    const estado = fechaVigencia <= fechaActual ? "Habilitado" : "Pendiente";

    const insertData = {
      descripcion: data.descripcion,
      telefono_contacto: data.telefono_contacto ?? null,
      sitio_web: data.sitioweb ?? null,
      fecha_cambio_estado: data.fecha_vigencia,
      estado,
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("obra_social")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("POST insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    console.error("POST /obraSocial:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      estado,
      fecha_vigencia,
      descripcion,
      telefono_contacto,
      nombre, // alias opcional para "descripcion"
    } = body as {
      id?: string | number;
      estado?: string;
      fecha_vigencia?: string;
      descripcion?: string;
      telefono_contacto?: string | null;
      nombre?: string;
    };

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // detectar qué campos vinieron explícitamente
    const hasDescripcion = Object.prototype.hasOwnProperty.call(
      body,
      "descripcion",
    );
    const hasNombre = Object.prototype.hasOwnProperty.call(body, "nombre");
    const hasTelefono = Object.prototype.hasOwnProperty.call(
      body,
      "telefono_contacto",
    );

    const updateData: Record<string, any> = {};

    // 1) Programar habilitación (se combina con lo demás)
    if (fecha_vigencia) {
      updateData.fecha_cambio_estado = fecha_vigencia;
      updateData.estado = "Pendiente";
    }

    // 2) Cambiar estado (se combina con lo demás)
    if (estado) {
      updateData.estado = estado;

      if (estado === "Deshabilitado") {
        const { data: turnosAfectados } = await supabaseAdmin
          .from("turno")
          .select("cod_turno, fecha_hora_turno, id_especialidad")
          .eq("id_obra", Number(id));

        await supabaseAdmin
          .from("turno")
          .update({ estado_turno: "Pendiente de pago", turno_pagado: false })
          .eq("id_obra", Number(id));

        if (turnosAfectados?.length) {
          const descNotif =
            (typeof descripcion === "string" && descripcion.trim()) ||
            (typeof nombre === "string" && nombre.trim()) ||
            "Obra social";

          for (const turno of turnosAfectados as Turno[]) {
            try {
              const esp = await supabaseAdmin
                .from("especialidad")
                .select("descripcion")
                .eq("id_especialidad", turno.id_especialidad)
                .single();

              await notificarCambioEstadoTurno({
                idTurno: String(turno.cod_turno),
                descripcion: descNotif,
                nuevoEstado: "Pendiente de pago",
                fechaHoraTurno: turno.fecha_hora_turno,
                especialidad: esp.data?.descripcion ||
                  "Especialidad no disponible",
              });
            } catch (e) {
              console.error("Notificación fallo:", e);
            }
          }
        }

        await supabaseAdmin.from("convenio").delete().eq("id_obra", Number(id));
      }
    }

    if (hasDescripcion || hasNombre) {
      const nuevoNombre =
        (typeof descripcion === "string" && descripcion.trim()) ||
        (typeof nombre === "string" && nombre.trim()) ||
        undefined;

      if (nuevoNombre !== undefined) updateData.descripcion = nuevoNombre;
    }

    if (hasTelefono) {
      if (typeof telefono_contacto === "string") {
        const t = telefono_contacto.trim();
        updateData.telefono_contacto = t === "" ? null : t; // vacío => borra
      } else if (telefono_contacto === null) {
        updateData.telefono_contacto = null;
      }
    }

    // DEBUG: ver qué llega y qué vamos a escribir
    console.log("[PUT /obraSocial] body:", body);
    console.log("[PUT /obraSocial] updateData:", updateData);

    // 4) Validar que haya algo para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "Enviá al menos un campo para actualizar (nombre o teléfono).",
        },
        { status: 400 },
      );
    }

    // 5) Ejecutar actualización
    const { error } = await supabaseAdmin
      .from("obra_social")
      .update(updateData)
      .eq("id_obra", Number(id));

    if (error) {
      console.error("Error al actualizar obra_social:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /obraSocial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
