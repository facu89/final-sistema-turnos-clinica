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

  export async function updateAgenda(id_agenda: number, body: any){
    const {fechainiciovigencia, fechafinvigencia, duracionturno} = body;

    const {data, error} = await supabase
    .from("agenda")
    .update({
        fechainiciovigencia,
        fechafinvigencia,
        duracionturno
    })
    .eq("id_agenda", id_agenda)
    .select()
    .single();

    if(error) throw error;

    return data;
  }