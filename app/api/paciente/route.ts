import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, apellido, telefono } = await request.json();
    console.log("id del paciente", id);
    console.log(nombre);
    console.log(apellido);
    console.log(telefono);

    if (!id) {
      return NextResponse.json(
        { error: "ID de paciente requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Datos actualizados correctamente",
      data: data,
    });
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json(
      { error: "Error al actualizar los datos" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("tipo_usuario", "Paciente");

    if (id_paciente) {
      query = query.eq("id", id_paciente);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
