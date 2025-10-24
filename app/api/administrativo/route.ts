import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
elimina al usuario administrativo
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    console.log("API: Eliminando usuario completo:", userId);

    // 1) auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Error Supabase admin:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // perfíl
    await supabaseAdmin
      .from("profiles_administrativos")
      .delete()
      .eq("id", userId);

    console.log("Usuario eliminado completamente");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en API delete-user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
crea usuario administrativo
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API: Iniciando creación de usuario administrativo");
    const data = await request.json();

    if (!data.email || !data.password || !data.dni || !data.firstName || !data.lastName) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      console.error("Error al crear usuario auth:", authError);
      return NextResponse.json(
        { error: "Error al crear usuario: " + authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    console.log("Usuario creado en auth.users:", authData.user.id);

    const profilePayload = {
      id: authData.user.id,
      email: data.email.trim().toLowerCase(),
      legajo_administrativo: "00" + data.dni,
      nombre: data.firstName,
      apellido: data.lastName,
      dni_administrativo: data.dni,
      telefono: data.phone || null,
      fecha_nacimiento: data.birthDate || null,
      tipo_usuario: "Administrativo",
    };

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles_administrativos")
      .insert(profilePayload)
      .select()
      .single();

    if (profileError) {
      console.error("Error al crear perfil:", profileError);

      // rollback de auth si falla el perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

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

    console.log("Usuario administrativo creado exitosamente");
    return NextResponse.json({
      success: true,
      data: {
        userId: authData.user.id,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error("Error crítico en API:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 actualiza campos del perfil administrativo

 */
export async function PUT(req: NextRequest) {
  try {
    const {
      id,
      nombre,
      apellido,
      telefono,
      fecha_nacimiento,
      dni_administrativo,
      email,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Falta 'id'." }, { status: 400 });
    }

    const toUpdate: Record<string, any> = {};

    if (nombre !== undefined) toUpdate.nombre = nombre;
    if (apellido !== undefined) toUpdate.apellido = apellido;

    if (telefono !== undefined)
      toUpdate.telefono = typeof telefono === "string" && telefono.trim() === "" ? null : telefono;

    if (fecha_nacimiento !== undefined)
      toUpdate.fecha_nacimiento =
        typeof fecha_nacimiento === "string" && fecha_nacimiento.trim() === ""
          ? null
          : fecha_nacimiento;

    if (dni_administrativo !== undefined) toUpdate.dni_administrativo = dni_administrativo;

    if (email !== undefined)
      toUpdate.email = typeof email === "string" && email.trim() === "" ? null : email;

    const { data, error } = await supabaseAdmin
      .from("profiles_administrativos")
      .update(toUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("PUT /api/administrativo:", e);
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
