"use client";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonDetalleTurno = ({ administrativo = false }: { administrativo?: boolean }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="w-full bg-white shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-neutral-300" />
            <Skeleton className="h-4 w-32 bg-neutral-200" />
          </div>
          <Skeleton className="h-10 w-40 bg-neutral-300 rounded-md" />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* InfoTurno */}
            <div className="bg-white border rounded-lg p-6 shadow-sm space-y-3 animate-pulse">
              <Skeleton className="h-6 w-40 bg-neutral-300" />
              <Skeleton className="h-4 w-2/3 bg-neutral-200" />
              <Skeleton className="h-4 w-1/2 bg-neutral-200" />
              <div className="grid grid-cols-2 gap-3 pt-3">
                <Skeleton className="h-4 w-3/4 bg-neutral-200" />
                <Skeleton className="h-4 w-2/3 bg-neutral-200" />
                <Skeleton className="h-4 w-2/3 bg-neutral-200" />
                <Skeleton className="h-4 w-3/4 bg-neutral-200" />
              </div>
            </div>

            {/* InfoPaciente */}
            <div className="bg-white border rounded-lg p-6 shadow-sm space-y-3 animate-pulse">
              <Skeleton className="h-6 w-44 bg-neutral-300" />
              <Skeleton className="h-4 w-1/2 bg-neutral-200" />
              <Skeleton className="h-4 w-2/3 bg-neutral-200" />
              <Skeleton className="h-4 w-1/3 bg-neutral-200" />
              <div className="grid grid-cols-2 gap-3 pt-3">
                <Skeleton className="h-4 w-3/4 bg-neutral-200" />
                <Skeleton className="h-4 w-2/3 bg-neutral-200" />
                <Skeleton className="h-4 w-1/2 bg-neutral-200" />
                <Skeleton className="h-4 w-3/4 bg-neutral-200" />
              </div>
            </div>
          </div>

          {/* Columna lateral (solo si es administrativo) */}
          {administrativo && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6 shadow-sm animate-pulse space-y-4">
                <Skeleton className="h-6 w-40 bg-neutral-300" />
                <Skeleton className="h-10 w-full bg-neutral-300 rounded-md" />
                <Skeleton className="h-10 w-full bg-neutral-300 rounded-md" />
                <Skeleton className="h-10 w-full bg-neutral-300 rounded-md" />
              </div>

              <div className="bg-white border rounded-lg p-6 shadow-sm animate-pulse space-y-4">
                <Skeleton className="h-6 w-48 bg-neutral-300" />
                <Skeleton className="h-4 w-full bg-neutral-200" />
                <Skeleton className="h-4 w-5/6 bg-neutral-200" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
