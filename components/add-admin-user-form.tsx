"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { UserPlus } from "lucide-react";

interface AddAdminUserFormProps {
  onUserAdded: () => void;
}

export function AddAdminUserForm({ onUserAdded }: AddAdminUserFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRepeatPassword("");
    setFirstName("");
    setLastName("");
    setDni("");
    setPhone("");
    setBirthDate("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Creando usuario administrativo...");

      // 1. Verificar si el DNI ya existe en profiles_administrativos
      const { data: existingDni, error: dniCheckError } = await supabase
        .from("profiles_administrativos")
        .select("dni_administrativo")
        .eq("dni_administrativo", dni)
        .maybeSingle();

      if (dniCheckError) {
        throw new Error("Error al verificar DNI: " + dniCheckError.message);
      }

      if (existingDni) {
        setError("El DNI ya está registrado como administrador.");
        setIsLoading(false);
        return;
      }

      // 2. Crear el usuario en auth.users (Supabase maneja email duplicados automáticamente)
      const response = await fetch("/api/administrativo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName,
          lastName,
          dni,
          phone,
          birthDate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la creación del usuario:", errorText);
        setError("Error al crear usuario: " + errorText);
        setIsLoading(false);
        return;
      }

      console.log("Usuario administrativo creado exitosamente");

      resetForm();
      setIsOpen(false);
      onUserAdded();
    } catch (error: unknown) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Usuario Administrativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Usuario Administrativo</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario con permisos administrativos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-password">Contraseña</Label>
            <Input
              id="admin-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-repeat-password">Confirmar Contraseña</Label>
            <Input
              id="admin-repeat-password"
              type="password"
              required
              minLength={6}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-first-name">Nombre</Label>
              <Input
                id="admin-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-last-name">Apellido</Label>
              <Input
                id="admin-last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-dni">DNI</Label>
            <Input
              id="admin-dni"
              type="text"
              required
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-phone">Teléfono</Label>
            <Input
              id="admin-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-birth-date">Fecha de Nacimiento</Label>
            <Input
              id="admin-birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
