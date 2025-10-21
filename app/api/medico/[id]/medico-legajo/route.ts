import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, {params}: {params: {id:string}}){

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

    const {data: medico, error: errorMedico} = await supabase
    .from("medico")
    .select("*")
    .eq("legajo_medico", params.id)
    .single();

    if(errorMedico || !medico){
        return NextResponse.json({error: "Medico xd"})
    }

    return NextResponse.json(medico);

}