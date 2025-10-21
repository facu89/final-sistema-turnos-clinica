import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

export async function POST(request : NextRequest){
    try{
        const body = await request.json();

        const {
            legajo_medico,
            fechainiciovigencia,
            fechafinvigencia,
            duracionturno,
            diasAtencion,
          } = body;

        if (
            !legajo_medico ||
            !fechainiciovigencia ||
            !fechafinvigencia ||
            !duracionturno ||
            !Array.isArray(diasAtencion) ||
            diasAtencion.length === 0
          ) {
            return NextResponse.json(
              { error: "Datos incompletos o inválidos." },
              { status: 400 }
            );
          }

        for (const dia of diasAtencion){
            if(!dia.dia_semana || !dia.hora_inicio || !dia.hora_fin){
                return NextResponse.json(
                    {error: "DATOS INCOMPLETOS EN DIAS DE ATENCION"},
                    {status: 400}
                );
            }
            if(dia.hora_inicio >= dia.hora_fin){
                return NextResponse.json(
                    {error: `el horario de ${dia.dia_semana} es invalido`},
                    {status: 400}
                );
            }
        }

        //ACA SE INSERTA LA AGENDA
        const {data: agenda, error: errorAgenda} = await supabase
        .from("agenda")
        .insert([
            {
                legajo_medico: legajo_medico,
                fechainiciovigencia: fechainiciovigencia,
                fechafinvigencia: fechafinvigencia,
                duracionturno: duracionturno,
            }
        ])
        .select()
        .single();

        if(errorAgenda) throw errorAgenda;

        const diasAtencionR = diasAtencion.map((dia)=> ({
            id_agenda: agenda.id_agenda,
            dia_semana: dia.dia_semana,
            hora_inicio: dia.hora_inicio,
            hora_fin: dia.hora_fin,
        }));

        const {error: errorDias} = await supabase
        .from("dia_semana")
        .insert(diasAtencionR);

        if(errorDias) throw errorDias;

        return NextResponse.json(
            {message: "Agenda creada con éxito", agenda},
            {status: 201}
        );
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            {error: "error al crear la agenda", detalle: error.message},
            {status: 500}
        );
    }
}