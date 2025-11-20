import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, Users, Shield } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center max-w-6xl mx-auto">
      {/* Hero principal */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Gestión de Turnos
          <span className="block text-primary">Médicos Inteligente</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Simplifica la administración de tu clínica con nuestro sistema
          integral de gestión de turnos y pacientes.
        </p>
      </div>

      {/* Features cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Gestión de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Programa y administra citas médicas de manera eficiente
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Control de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Mantén un registro completo de tus pacientes y su historial
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Disponibilidad 24/7</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Accede al sistema desde cualquier lugar y en cualquier momento
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Seguridad Garantizada</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Protección de datos médicos con los más altos estándares de
              seguridad
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-muted rounded-lg p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">
          ¿Listo para optimizar tu clínica?
        </h2>
        <p className="text-muted-foreground mb-6">
          Únete a cientos de profesionales de la salud que ya confían en
          TurnsMed Manager
        </p>
      </div>
    </div>
  );
}
