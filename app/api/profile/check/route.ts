import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // First try `profiles` (pacientes) by auth user id
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profileData) {
      // Ensure tipo_usuario is present for consistency
      if (!profileData.tipo_usuario) profileData.tipo_usuario = "Paciente";
      return NextResponse.json({ data: profileData, source: "profiles" }, { status: 200 });
    }

    // If not found in `profiles`, try `profiles_administrativos` (administrativos)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("profiles_administrativos")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (adminError) throw adminError;

    if (adminData) {
      // mark administrative profiles explicitly
      if (!adminData.tipo_usuario) adminData.tipo_usuario = "Administrador";
      return NextResponse.json({ data: adminData, source: "administrativos" }, { status: 200 });
    }

    // Nothing found
    return NextResponse.json({ data: null }, { status: 200 });
  } catch (err: any) {
    console.error("Error checking profile:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
