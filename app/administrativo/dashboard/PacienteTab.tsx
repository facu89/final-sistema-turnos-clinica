"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getPacientes() {
  try {
    const response = await fetch("/api/paciente", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Error al obtener pacientes");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: ", error);
    return [];
  }
}

export default function PacienteTab() {
  const [allPacientes, setAllPacientes] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPacientes = async () => {
      const data = await getPacientes();
      setAllPacientes(Array.isArray(data) ? data : []);
    };

    fetchPacientes();
  }, []);

  const pacientes = useMemo(() => {
    if (!search) return allPacientes;
    const q = search.toLowerCase();
    return allPacientes.filter(
      (p: any) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        String(p.dni || "")
          .toLowerCase()
          .includes(q) ||
        String(p.telefono || "")
          .toLowerCase()
          .includes(q)
    );
  }, [search, allPacientes]);

  return (
    <TabsContent value="pacientes" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
        <section className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar paciente..."
            className="w-45"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>
      </div>

      <div className="grid gap-4">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Paciente</TableHead>
              <TableHead className="text-left">Email</TableHead>
              <TableHead className="text-left">Teléfono</TableHead>
              <TableHead className="text-left">
                Historial de ausencias
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes.map((paciente: any) => (
              <TableRow key={paciente.id}>
                <TableCell className="font-medium">{paciente.nombre}</TableCell>
                <TableCell>{paciente.email}</TableCell>
                <TableCell>{paciente.telefono}</TableCell>
                <TableCell>
                  <Button
                    variant={paciente.ausencias > 0 ? "default" : "outline"}
                    size="sm"
                    disabled={
                      !paciente.cantidad_ausencias ||
                      paciente.cantidad_ausencias === 0
                    }
                    onClick={() =>
                      (window.location.href = `/administrativo/paciente/${paciente.id}/historial`)
                    }
                  >
                    Ver Historial
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {pacientes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground"
                >
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}
