"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function AgendaModificada({
  nombre,
  apellido,
  destino = "/administrativo/dashboard",
  delay = 4000,
  mensaje,
}: {
  nombre?: string;
  apellido?: string;
  destino?: string;
  delay?: number; // tiempo en milisegundos antes de redirigir
  mensaje?: string
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(destino);
    }, delay);

    return () => clearTimeout(timer);
  }, [router, destino, delay]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <CheckCircle2 className="text-green-500 w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ✅ Agenda modificada correctamente
        </h2>
        {nombre && apellido && (
          <p className="text-gray-600">
            La agenda del Dr. {nombre} {apellido} se modificó con éxito.
          </p>
        )}
        <p className="text-gray-600">Cantidad de turnos reasignados: {mensaje}</p>
        <p className="text-sm text-gray-400 mt-3">
          Serás redirigido automáticamente en {delay / 1000} segundos...
        </p>
      </div>
    </div>
  );
}
