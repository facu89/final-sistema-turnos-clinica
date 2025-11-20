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

export async function updateDiaSemana(id_agenda: number, dias: any[]){
    await supabase.from("dia_semana").delete().eq("id_agenda", id_agenda);

    const nuevos = dias.map((d)=> ({
        id_agenda,
        dia_semana: d.dia_semana,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin
    }));

    const { error } = await supabase.from("dia_semana"). insert(nuevos);
    
    if(error) throw error;
}