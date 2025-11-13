import { NextRequest, NextResponse } from "next/server";
import { sendReintegroNotification } from "@/hooks/email-resend-reintegro";
import { sendTurnoLiberadoNotification } from "@/hooks/email-resend-lista-espera";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
        nombre,
        apellido,
        legajo_medico,
        fecha_hora_turno,
        especialidad,
        id_especialidad,
    } = body;

    console.log("nombre", nombre);
    console.log("apellido", apellido);
    console.log("legajo_medico", legajo_medico);
    console.log("fecha_hora_turno", fecha_hora_turno);
    console.log("especialidad", especialidad);
    console.log("id_especialidad", id_especialidad);

    const turnoDate = new Date(fecha_hora_turno);
    const now = new Date();
    const diffMs = turnoDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 24) {
        setTimeout(async () => {
            interface Patologia {
                prioridad: "Alta" | "Media" | "Baja";
            }

            interface Profile {
                email: string;
                dni_paciente: string;
            }

            interface Solicitud {
                dni_paciente: string;
                profiles: Profile | null;
                patologia: Patologia | null;
            }

            const { data: listaData, error: listaError } = await supabase
                .from("solicitudes_especialidad")
                .select(`profiles(email,dni_paciente), patologia(prioridad)`)
                .eq("id_especialidad", id_especialidad)
                .returns<Solicitud[]>();

            const { data: listaDataMedico, error: listaErrorMedico } =
                await supabase
                    .from("solicitudes_medico")
                    .select(
                        `profiles(email,dni_paciente), patologia(prioridad)`,
                    )
                    .eq("legajo_medico", legajo_medico)
                    .returns<Solicitud[]>();

            console.log("lista medico", listaDataMedico);

            if (listaError || !listaData) {
                console.error("Error obteniendo lista de espera:", listaError);
                return;
            }

            if (listaErrorMedico || !listaDataMedico) {
                console.error(
                    "Error obteniendo lista de espera por médico:",
                    listaErrorMedico,
                );
                return;
            }

            const alta = listaData.filter(
                (item) => item.patologia?.prioridad === "Alta",
            );
            const media = listaData.filter(
                (item) => item.patologia?.prioridad === "Media",
            );
            const baja = listaData.filter(
                (item) => item.patologia?.prioridad === "Baja",
            );

            alta.forEach(async (item) => {
                const email = item.profiles?.email;
                if (email) {
                    await sendTurnoLiberadoNotification({
                        pacienteEmail: email,
                        especialidad,
                        medicoNombre: `${nombre} ${apellido}`,
                        fechaTurno: fecha_hora_turno.split("T")[0],
                        horaTurno:
                            fecha_hora_turno.split("T")[1]?.slice(0, 5) ?? "",
                    });
                    console.log(
                        "Dni del paciente al que se le va a eliminar la solicirud",
                        item.profiles?.dni_paciente,
                    );
                    await supabase
                        .from("solicitudes_especialidad")
                        .delete()
                        .eq("id_especialidad", id_especialidad)
                        .eq("dni_paciente", item.profiles?.dni_paciente);
                }
            });

            setTimeout(
                () => {
                    media.forEach(async (item) => {
                        const email = item.profiles?.email;
                        if (email) {
                            console.log("por enviar un email a ", email);
                            sendTurnoLiberadoNotification({
                                pacienteEmail: email,
                                especialidad,
                                medicoNombre: `${nombre} ${apellido}`,
                                fechaTurno: fecha_hora_turno.split("T")[0],
                                horaTurno:
                                    fecha_hora_turno.split("T")[1]?.slice(
                                        0,
                                        5,
                                    ) ?? "",
                            });
                        }
                    });
                },
                60 * 1000, // 1 minuto
            );

            setTimeout(
                () => {
                    baja.forEach(async (item) => {
                        const email = item.profiles?.email;
                        if (email) {
                            sendTurnoLiberadoNotification({
                                pacienteEmail: email,
                                especialidad,
                                medicoNombre: `${nombre} ${apellido}`,
                                fechaTurno: fecha_hora_turno.split("T")[0],
                                horaTurno:
                                    fecha_hora_turno.split("T")[1]?.slice(
                                        0,
                                        5,
                                    ) ?? "",
                            });
                        }
                    });
                },
                2 * 60 * 1000, // 2 minutos
            );

            //ACA FILTRO PARA LAS NOTIFICACIONES DE LA LISTA DE ESPERA PARA UN MEDICO ESPECIFICO
            const altaMedico = listaDataMedico.filter(
                (item) => item.patologia?.prioridad === "Alta",
            );
            const mediaMedico = listaDataMedico.filter(
                (item) => item.patologia?.prioridad === "Media",
            );
            const bajaMedico = listaDataMedico.filter(
                (item) => item.patologia?.prioridad === "Baja",
            );
            altaMedico.forEach(async (item) => {
                const email = item.profiles?.email;
                if (email) {
                    await sendTurnoLiberadoNotification({
                        pacienteEmail: email,
                        especialidad,
                        medicoNombre: `${nombre} ${apellido}`,
                        fechaTurno: fecha_hora_turno.split("T")[0],
                        horaTurno:
                            fecha_hora_turno.split("T")[1]?.slice(0, 5) ?? "",
                    });
                    console.log(
                        "Dni del paciente al que se le va a eliminar la solicitud (por medico)",
                        item?.profiles?.dni_paciente,
                    );
                    // Eliminar solicitud de lista de espera por médico
                    await supabase
                        .from("solicitudes_medico")
                        .delete()
                        .eq("legajo_medico", legajo_medico)
                        .eq("dni_paciente", item.profiles?.dni_paciente);
                }
            });

            setTimeout(
                () => {
                    mediaMedico.forEach(async (item) => {
                        const email = item.profiles?.email;
                        if (email) {
                            console.log("por enviar un email a ", email);
                            sendTurnoLiberadoNotification({
                                pacienteEmail: email,
                                especialidad,
                                medicoNombre: `${nombre} ${apellido}`,
                                fechaTurno: fecha_hora_turno.split("T")[0],
                                horaTurno:
                                    fecha_hora_turno.split("T")[1]?.slice(
                                        0,
                                        5,
                                    ) ?? "",
                            });
                        }
                    });
                },
                60 * 1000, // 1 minuto
            );

            setTimeout(
                () => {
                    bajaMedico.forEach(async (item) => {
                        const email = item.profiles?.email;
                        if (email) {
                            sendTurnoLiberadoNotification({
                                pacienteEmail: email,
                                especialidad,
                                medicoNombre: `${nombre} ${apellido}`,
                                fechaTurno: fecha_hora_turno.split("T")[0],
                                horaTurno:
                                    fecha_hora_turno.split("T")[1]?.slice(
                                        0,
                                        5,
                                    ) ?? "",
                            });
                        }
                    });
                },
                2 * 60 * 1000, // 2 minutos
            );
        }, 0);
    } else {
        console.log(
            "faltan menos de 24 horas para el turno, no se mandan notificaciones",
        );
    }

    return NextResponse.json({
        success: true,
        message: "Notificaciones enviándose en background.",
    });
}
