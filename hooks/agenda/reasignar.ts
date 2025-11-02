import { createClient } from "@supabase/supabase-js";

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

  function horaToMinutos(hora: string){
    const [h,m] = hora.split(":").map(Number);

    return h * 60 + m;
  }

  export async function reasignarTurnos(turnosAfectados: any[], agenda: any){
    const { id_agenda, fechainiciovigencia, fechafinvigencia, duracionturno, legajo_medico} = agenda;

    const {data: diasSemana, error: errorDias} = await supabase
    .from("dia_semana")
    .select("dia_semana, hora_inicio, hora_fin")
    .eq("id_agenda", id_agenda);

    if(errorDias) throw errorDias;

    const { data: reservados, error: errorReservados} = await supabase
    .from("turno")
    .select("fecha_hora_turno")
    .eq("legajo_medico", legajo_medico)
    .neq("estado_turno", "Reasignado") //IGNORA TURNOS REASIGNADOS Y PENDIENTES DE PAGO
    .neq("estado_turno", "Pendiente de pago");

    if(errorReservados) throw errorReservados;

    //GENERA HORARIOS DISPONIBLES
    const disponibles = generarHorariosDisponibles(
        fechainiciovigencia,
        fechafinvigencia,
        duracionturno,
        diasSemana,
        reservados || []
    );

    const turnosReasignados = [];

    //REASIGNA LOS TURNOS A LOS HORARIOS GENERADOS
    for (const turno of turnosAfectados){
        const horario = disponibles.shift();
        if(horario){
            await supabase.from("turno").insert({
                id_especialidad: turno.id_especialidad,
                id_obra: turno.id_obra,
                turno_pagado: turno.turno_pagado,
                turno_modificado: turno.turno_modificado,
                presencia_turno: turno.presencia_turno,
                fecha_hora_turno: horario.toISOString(),
                dni_paciente: turno.dni_paciente,
                legajo_medico,
                estado_turno: "Reservado",
            });
            turnosReasignados.push(horario);
        }
    }


    if(turnosAfectados.length > 0){
        const codigoTurno = turnosAfectados.map((t)=> t.cod_turno);
        await supabase
        .from("turno")
        .delete()
        .in("cod_turno", codigoTurno);
    }

    return turnosReasignados;

    function generarHorariosDisponibles(
        fechaInicio: string,
        fechaFin: string,
        duracion: string,
        diasSemana: any[],
        turnosReservados: any[]
      ) {

        const horarios: Date[] = [];
        const fecha_Ini = new Date(`${fechaInicio}T00:00:00`);
        const fecha_Fin = new Date(`${fechaFin}T23:59:59`);
        const duracionturno = horaToMinutos(duracion);

        for (
            let d = new Date(fecha_Ini);
            d <= new Date(fecha_Fin.getTime() + 24 * 60 * 60 * 1000 - 1); // incluye último día
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
          )
          {
          const diaSemana = ((d.getDay() + 6) % 7) + 1; // lunes=1 ... domingo=7
          const diaConfig = diasSemana.find((dia) => dia.dia_semana === diaSemana);
          if (!diaConfig) continue; // no atiende ese día
      
          const inicioMin = horaToMinutos(diaConfig.hora_inicio);
          const finMin = horaToMinutos(diaConfig.hora_fin);
      
          for (let m = inicioMin; m < finMin; m += duracionturno) {
            const horas = Math.floor(m / 60).toString().padStart(2, "0");
            const minutos = (m % 60).toString().padStart(2, "0");
            const fechaISO = d.toISOString().split("T")[0];
            const fechaHora = new Date(`${fechaISO}T${horas}:${minutos}:00`);
      
            const ocupado = turnosReservados.some(
              (t) => new Date(t.fecha_hora_turno).getTime() === fechaHora.getTime()
            );
      
            if (!ocupado) horarios.push(fechaHora);
          }
        }
        return horarios;
      }
  }