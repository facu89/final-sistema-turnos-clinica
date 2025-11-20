"use client";

import { GeneralHeader } from "@/components/GeneralHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SinAusencias from "@/components/no-abscens";

export default function HistorialAusencias({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/historial/${params.id}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  if (loading) return <div>
    <GeneralHeader/>
    <hr />
  </div>;
  if (data?.error) return <p>{data.error}</p>;


return (
<div>
    <GeneralHeader />
    <hr className="w-full border-gray-300 my-4" />
    <div className="ml-35 mt-5 flex justify-start">
        <Button
          variant="outline"
          onClick={()=> router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver  
        </Button>
      </div>
    <div className="flex flex-col items-center bg-white-100 py-10">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">
            Historial de ausencias de {data.paciente.nombre} {data.paciente.apellido}
        </h2>
        {data.ausencias.length === 0 ? (
          <SinAusencias/>
        ) : (
        <div className="overflow-x-auto">
            <table className="table-auto border-collapse border border-gray-300 rounded-lg shadow-lg bg-white">
                <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">Fecha</th>
                        <th className="border border-gray-300 px-4 py-2">Nro Turno</th>
                        <th className="border border-gray-300 px-4 py-2">Médico</th>
                        <th className="border border-gray-300 px-4 py-2">Especialidad</th>
                    </tr>
                </thead>
                <tbody>
                    {data.ausencias.map((a: any) => (
                        <tr key={a.cod_turno}>
                            <td className="border border-gray-300 px-4 py-2">{a.fecha_hora_turno}</td>
                            <td className="border border-gray-300 px-4 py-2">{a.cod_turno}</td>
                            <td className="border border-gray-300 px-4 py-2">{`${a.medico.nombre} ${a.medico.apellido}`}</td>
                            <td className="border border-gray-300 px-4 py-2">{a.especialidad.descripcion}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        )}
    </div>
    </div>
    
  );
}
