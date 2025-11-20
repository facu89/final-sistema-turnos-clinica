import { getTurnosAfectados } from "@/hooks/agenda/getTurnosAfectados";
import { reasignarTurnos } from "@/hooks/agenda/reasignar";
import { updateAgenda } from "@/hooks/agenda/updateAgenda";
import { updateDiaSemana } from "@/hooks/agenda/updateDiasSemana";
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
    },
);

export async function POST(request: NextRequest) {
    try {
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
                { status: 400 },
            );
        }

        for (const dia of diasAtencion) {
            if (!dia.dia_semana || !dia.hora_inicio || !dia.hora_fin) {
                return NextResponse.json(
                    { error: "DATOS INCOMPLETOS EN DIAS DE ATENCION" },
                    { status: 400 },
                );
            }
            if (dia.hora_inicio >= dia.hora_fin) {
                return NextResponse.json(
                    { error: `el horario de ${dia.dia_semana} es invalido` },
                    { status: 400 },
                );
            }
        }

        //ACA SE INSERTA LA AGENDA
        const { data: agenda, error: errorAgenda } = await supabase
            .from("agenda")
            .insert([
                {
                    legajo_medico: legajo_medico,
                    fechainiciovigencia: fechainiciovigencia,
                    fechafinvigencia: fechafinvigencia,
                    duracionturno: duracionturno,
                },
            ])
            .select()
            .single();

        if (errorAgenda) throw errorAgenda;

        //ACTUALIZA TABLA MEDICO CON LA AGENDA REFERENCIADA

        const { error: errorMedico } = await supabase
            .from("medico")
            .update({ id_agenda: agenda.id_agenda })
            .eq("legajo_medico", legajo_medico);

        if (errorMedico) {
            throw errorMedico;
        }

        const diasAtencionR = diasAtencion.map((dia) => ({
            id_agenda: agenda.id_agenda,
            dia_semana: dia.dia_semana,
            hora_inicio: dia.hora_inicio,
            hora_fin: dia.hora_fin,
        }));

        const { error: errorDias } = await supabase
            .from("dia_semana")
            .insert(diasAtencionR);

        if (errorDias) throw errorDias;

        return NextResponse.json(
            { message: "Agenda creada con éxito", agenda },
            { status: 201 },
        );
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: "error al crear la agenda", detalle: error.message },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const legajo_medico = searchParams.get("legajo_medico");

        if (!legajo_medico) {
            return NextResponse.json(
                { error: "No se encontro legajo_medico" },
                { status: 400 },
            );
        }

        const { data: medico, error: errorMedico } = await supabase
            .from("medico")
            .select(`
            legajo_medico,
            nombre,
            apellido,
                medico_especialidad(especialidad(id_especialidad,descripcion)),
            agenda: id_agenda(
            id_agenda,
            fechainiciovigencia,
            fechafinvigencia,
            duracionturno,
            dia_semana(
            dia_semana,
            hora_inicio,
            hora_fin)
            )
            `)
            .eq("legajo_medico", legajo_medico)
            .single();
        console.log(medico);
        if (errorMedico) throw errorMedico;

        if (!medico.agenda) {
            return NextResponse.json(
                { message: "El medico no tiene agenda", medico },
                { status: 200 },
            );
        }

        return NextResponse.json(medico, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: "error al obtener la agenda", detalle: error.message },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const legajo_medico = url.searchParams.get("legajo_medico");

        if (!legajo_medico) {
            return NextResponse.json(
                { error: "no se encuentra el parametro legajo_medico" },
                { status: 400 },
            );
        }

        const body = await request.json();

        const { data: agenda, error: errorAgenda } = await supabase
            .from("agenda")
            .select("*")
            .eq("legajo_medico", legajo_medico)
            .single();

        if (errorAgenda || !agenda) {
            return NextResponse.json(
                { error: "No se encontró la agenda para ese legajo" },
                { status: 404 },
            );
        }

        //actualiza agenda
        const nuevaAgenda = await updateAgenda(agenda.id_agenda, body);

        //actualiza dias semana
        await updateDiaSemana(agenda.id_agenda, body.dias_semana);

        //busca turnos que quedaron afectados con las modificaciones
        const turnosAfectados = await getTurnosAfectados(
            agenda.id_agenda,
            agenda.legajo_medico,
        );

        const turnosReasignados = await reasignarTurnos(
            turnosAfectados,
            nuevaAgenda,
        );

        return NextResponse.json({
            mensaje: "Agenda actualizada correctamente",
            turnos_afectados: turnosAfectados.length,
            turnos_reasignados: turnosReasignados.length,
        });
    } catch (error: any) {
        console.error("Error en put /api/agenda:", error);
        return NextResponse.json(
            { error: "Error al modificar la agenda", detalle: error.message },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            legajo_medico,
        } = body;

        if (!legajo_medico) {
            return NextResponse.json(
                { error: "Datos incompletos o inválidos." },
                { status: 400 },
            );
        }
        const { data: medico, error: errorMedico } = await supabase
            .from("agenda")
            .delete()
            .eq("legajo_medico", legajo_medico)
            .single();
        if (errorMedico) throw errorMedico;

        return NextResponse.json(
            { message: "Agenda eliminada con éxito", medico },
            { status: 201 },
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: "error al eliminar la agenda", detalle: error.message },
            { status: 500 },
        );
    }
}
