"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export default function SkeletonAgendaConfig() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-white shadow-sm">
        <div className="h-9 w-9 bg-gray-200 rounded-md" /> {/* Botón volver */}
        <div className="h-6 w-64 bg-gray-200 rounded-md" /> {/* Nombre médico */}
      </div>

      <div className="flex flex-col items-center py-10">
        <div className="w-full max-w-3xl space-y-6">
          {/* Card Configuración General */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-300" />
                <div className="h-5 w-48 bg-gray-200 rounded" />
              </CardTitle>
              <div className="h-3 w-80 bg-gray-200 rounded mt-2" />
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-4">
              {/* Duración */}
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded-md" />
              </div>

              {/* Fecha inicio */}
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded-md" />
              </div>

              {/* Fecha fin */}
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* Card Horarios */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-300" />
                <div className="h-5 w-44 bg-gray-200 rounded" />
              </CardTitle>
              <div className="h-3 w-72 bg-gray-200 rounded mt-2" />
            </CardHeader>

            <CardContent className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-4 gap-3"
                >
                  <div className="flex items-center gap-2 w-40">
                    <div className="h-5 w-5 bg-gray-200 rounded-md" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="h-10 w-24 bg-gray-200 rounded-md" />
                    <div className="h-3 w-8 bg-gray-200 rounded" />
                    <div className="h-10 w-24 bg-gray-200 rounded-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botón */}
          <div className="flex justify-center">
            <div className="h-10 w-32 bg-gray-200 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
