"use client";

import { TurnosAcciones } from "./TurnosAcciones";
import InfoTurno from "./InfoTurno";
import InfoPaciente from "./InfoPaciente";
import HeaderTurno from "./HeaderTurno";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkeletonDetalleTurno } from "@/components/ui/skeletons/skeletonDetalle";

export default function TurnoDetalle({params}:{params: {id: string}}) {
  const cod_turno = params.id;
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const router = useRouter();
  const [administrativo, setAdministrativo] = useState<boolean | null>(null);
  
  const handleUserType= async() =>{
      // Call server-side API to get profile by userId
      try {
        const res = await fetch(`/api/profile/check?userId=${encodeURIComponent(
          userId || ""
        )}`);
        const json = await res.json();
        const profileData = json.data ?? null;

        if (profileData) {
          const userType = String(profileData.tipo_usuario || "");
          // consider different possible values, treat any value containing 'admin' as administrative
          if (userType.toLowerCase().includes("admin")) {
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error("Error fetching profile via API:", err);
      }
  }
   
  useEffect(()=>{
    const fetchData = async() => {
      const res = await fetch(`/api/turnos/turno-codigo?cod_turno=${cod_turno}`, {cache: "no-store"});
      const json = await res.json();
      setTurno(json);
      setLoading(false);
    };
    fetchData();
  },[]);
  
  // Check user type when userId becomes available
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      const isAdmin = await handleUserType();
      if (!mounted) return;
      setAdministrativo(Boolean(isAdmin));
    })();
    return () => { mounted = false; };
  }, [userId]);

  if(loading){
    return(
      <SkeletonDetalleTurno/>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HeaderTurno turno={turno}>{}</HeaderTurno>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <InfoTurno turno={turno}></InfoTurno>

            <InfoPaciente turno={turno}></InfoPaciente>
          </div>
{ administrativo === true && (
          <div className="space-y-6">
            <TurnosAcciones />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
