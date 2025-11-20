import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

/* Utilidad: normaliza fecha a YYYY-MM-DD (si viene dd/mm/yyyy o con hora) */
function normalizeDateToYMD(val: string | null | undefined): string | null {
  if (!val) return null;
  let s = String(val).trim();
  if (!s) return null;

  // dd/mm/yyyy -> yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  // yyyy-mm-ddTHH:mm:ss -> yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    return s.slice(0, 10);
  }

  // si ya es yyyy-mm-dd lo dejo
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return s; // dejo que Postgres lo intente castear si es válido
}

/**
 * DELETE — Elimina un usuario administrativo (auth + perfil)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    // 1) auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Error eliminando en auth:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // 2) Perfil (por si no hay cascade)
    await supabaseAdmin.from("profiles_administrativos").delete().eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/administrativo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST — Crea usuario administrativo (auth + perfil)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.email || !data.password || !data.dni || !data.firstName || !data.lastName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // 1) Crear en auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: String(data.email).trim().toLowerCase(),
      password: data.password,
      options: { emailRedirectTo: undefined },
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "Error al crear usuario: " + (authError?.message ?? "desconocido") },
        { status: 500 }
      );
    }

    // 2) Insertar perfil
    const profilePayload = {
      id: authData.user.id,
      email: String(data.email).trim().toLowerCase(),
      legajo_administrativo: "00" + data.dni,
      nombre: data.firstName,
      apellido: data.lastName,
      dni_administrativo: data.dni,
      telefono: data.phone || null,
      fecha_nacimiento: normalizeDateToYMD(data.birthDate),
      tipo_usuario: "Administrativo",
    };

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles_administrativos")
      .insert(profilePayload)
      .select()
      .single();

    if (profileError) {
      // rollback de auth si falla el perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      // 23505: unique_violation (por ejemplo, DNI duplicado)
      if ((profileError as any).code === "23505") {
        return NextResponse.json(
          { error: "El DNI ya está registrado en el sistema" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Error al crear perfil: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { userId: authData.user.id, profile: profileData },
    });
  } catch (error) {
    console.error("POST /api/administrativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT — Actualiza campos del perfil administrativo
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      nombre,
      apellido,
      telefono,
      fecha_nacimiento,
      dni_administrativo,
      email,
    } = body || {};

    if (!id) {
      return NextResponse.json({ error: "Falta 'id'." }, { status: 400 });
    }

    const toUpdate: Record<string, any> = {};
    if (nombre !== undefined) toUpdate.nombre = nombre;
    if (apellido !== undefined) toUpdate.apellido = apellido;

    if (telefono !== undefined) {
      const t = typeof telefono === "string" ? telefono.trim() : telefono;
      toUpdate.telefono = t === "" ? null : t;
    }

    if (fecha_nacimiento !== undefined) {
      toUpdate.fecha_nacimiento = normalizeDateToYMD(fecha_nacimiento);
    }

    if (dni_administrativo !== undefined) toUpdate.dni_administrativo = dni_administrativo;

    if (email !== undefined) {
      const e = typeof email === "string" ? email.trim() : email;
      toUpdate.email = e === "" ? null : e;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles_administrativos")
      .update(toUpdate)
      .eq("id", id)
      .select()
      .maybeSingle(); // evita el error "Cannot coerce the result to a single JSON object"

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      // 0 filas afectadas (id inexistente o bloqueado por RLS)
      return NextResponse.json(
        { error: "No se encontró el usuario o no se pudo actualizar." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("PUT /api/administrativo:", e);
    return NextResponse.json(
      { error: e?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
