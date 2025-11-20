import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncEspecialidadesMedico , syncConveniosMedico } from "@/lib/medico/helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
//devuelve todos los medicos
export async function GET(request: NextRequest) {
  const { data, error } = await supabase.from("medico").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const {
      nombre,
      apellido,
      especialidades,
      dni,
      matricula,
      telefono,
      pesosArgentinos,
      obrasSociales,
    } = reqBody;

    // Validar campos requeridos
    if (!nombre || !apellido || !dni || !matricula || !telefono) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un médico con ese DNI
    const { data: medicoExistente, error: errorBusqueda } = await supabase
      .from("medico")
      .select("dni_medico")
      .eq("dni_medico", dni)
      .single();

    if (errorBusqueda && errorBusqueda.code !== "PGRST116") {
      console.error("Error buscando médico existente:", errorBusqueda);
      return NextResponse.json(
        { error: "Error verificando DNI" },
        { status: 500 }
      );
    }

    if (medicoExistente) {
      return NextResponse.json(
        { error: "Ya existe un médico con ese DNI" },
        { status: 409 } // Conflict
      );
    }

    // Verificar si ya existe un médico con esa matrícula
    // NOTE: la columna 'legajo_medico' es bigint (id), por eso no debemos
    // comparar ese campo con el valor de matrícula (que puede tener prefijos).
    // En su lugar comparamos contra la columna 'matricula' que almacena el
    // identificador de matrícula (texto).
    const { data: matriculaExistente, error: errorMatricula } = await supabase
      .from("medico")
      .select("matricula")
      .eq("matricula", matricula)
      .single();

    if (errorMatricula && errorMatricula.code !== "PGRST116") {
      console.error("Error buscando matrícula existente:", errorMatricula);
      return NextResponse.json(
        { error: "Error verificando matrícula" },
        { status: 500 }
      );
    }

    if (matriculaExistente) {
      return NextResponse.json(
        { error: "Ya existe un médico con esa matrícula" },
        { status: 409 }
      );
    }

    // Insertar médico
    const { data: medicoData, error: medicoError } = await supabase
      .from("medico")
      .insert([
        {
          nombre: nombre,
          apellido: apellido,
          dni_medico: dni,
          matricula: matricula,
          telefono: telefono,
          tarifa: pesosArgentinos,
          estado: "activo",
        },
      ])
      .select() //Esto es importante porque lo uso para que se devuelva el objeto insertado, asi puedo obtener el id del medico nuevo
      .single();

    if (medicoError) {
      console.error("Error insertando médico:", medicoError);
      return NextResponse.json(
        { error: "Error al crear el médico: " + medicoError.message },
        { status: 400 }
      );
    }

    const medicoId = medicoData.legajo_medico;
    for (const especialidad of especialidades) {
      const esp = await supabase.from("medico_especialidad").insert({
        legajo_medico: medicoId,
        id_especialidad: especialidad,
      });
    }

    // Insertar convenios con obras sociales
    if (obrasSociales && obrasSociales.length > 0) {
      for (const obraSocial of obrasSociales) {
        await supabase.from("convenio").insert({
          legajo_medico: medicoId,
          id_obra: obraSocial,
          fecha_alta: new Date().toISOString().split("T")[0],
        });
      }

      return NextResponse.json({
        success: true,
        data: medicoData,
        message: "Médico creado exitosamente",
      });
    }
  } catch (error) {
    console.error("Error en POST médico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest){
  try {
    const body = await request.json();
    const {
      legajo_medico,
      nombre,
      apellido,
      dni_medico,
      telefono,
      matricula,
      tarifa,
      especialidades,
      convenios, // 👈 viene en datosTemp.convenios
    } = body;

    if (!legajo_medico){
      return NextResponse.json(
        {error: "Legajo del medico requerido"},
        {status: 400}
      );
    }

    const {data, error} = await supabase
    .from("medico")
    .update({
      nombre,
      apellido,
      telefono,
      dni_medico,
      tarifa,
      matricula,
    })
    .eq("legajo_medico", legajo_medico)
    .select();

    if (error) {
      console.error ("Error updateando el medico:", error);
      return NextResponse.json({error:error.message}, {status: 400});
    }

    // Si vienen especialidades en el body, delegar la sincronización al helper
    if (Array.isArray(especialidades)) {
      const resultEsp = await syncEspecialidadesMedico(
        supabase,
        legajo_medico,
        especialidades
      );
      if (!resultEsp.success) {
        return NextResponse.json(
          { error: resultEsp.error },
          { status: 500 }
        );
      }
    }

    // lo mismo para los convenios
    if (Array.isArray(convenios)) {
      const resultConvenios = await syncConveniosMedico(
        supabase,
        legajo_medico,
        convenios
      );
      if (!resultConvenios.success) {
        return NextResponse.json(
          { error: resultConvenios.error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Datos actualizado correctamente!",
      data: data,
    });
  }
  catch (error) {
    console.error("Error en el request PUT de medico:", error);
    return NextResponse.json (
      {error: "Error al actualizar los datos del medico"},
      {status: 500}
    );
  }
}