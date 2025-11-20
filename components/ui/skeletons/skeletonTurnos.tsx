"use client";
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const SkeletonTurnosTab = () => {
  return (
    <TabsContent value="turnos" className="space-y-6">
      {/* Título */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Turnos</h2>
      </div>

      {/* Filtros + botón */}
      <div className="flex items-end gap-3">
        <div className="flex-1 flex gap-3">
          <Skeleton className="h-10 w-48 bg-neutral-300" />
          <Skeleton className="h-10 w-48 bg-neutral-300" />
          <Skeleton className="h-10 w-48 bg-neutral-300" />
        </div>
        <Skeleton className="h-10 w-64 bg-neutral-300" />
      </div>

      {/* Banner de error (placeholder visual) */}
      <div className="flex items-start gap-3 bg-neutral-100 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-md">
        <Skeleton className="h-4 w-2/3 bg-neutral-300" />
      </div>

      {/* Tabla de skeletons */}
      <div className="border rounded-lg shadow bg-white overflow-hidden">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              {[
                "Código",
                "Paciente",
                "Médico",
                "Fecha",
                "Hora",
                "Consultar",
                "Reasignar",
                "Estado",
              ].map((col) => (
                <TableHead key={col}>
                  <Skeleton className="h-4 w-16 bg-neutral-300" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <Skeleton className="h-4 w-10 bg-neutral-300" />
                </TableCell>
                <TableCell className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-neutral-300" />
                  <Skeleton className="h-3 w-24 bg-neutral-200" />
                </TableCell>
                <TableCell className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-neutral-300" />
                  <Skeleton className="h-3 w-20 bg-neutral-200" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20 bg-neutral-300" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12 bg-neutral-300" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24 rounded-md bg-neutral-300" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto rounded-sm bg-neutral-300" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-20 mx-auto rounded-full bg-neutral-300" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
};
