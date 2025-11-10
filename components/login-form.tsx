"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Manejo específico de diferentes tipos de errores
        let errorMessage = "";

        switch (error.message) {
          case "Invalid login credentials":
            errorMessage =
              "Email o contraseña incorrectos. Si el email está registrado, verifica tu contraseña.";
            break;
          case "Email not confirmed":
            errorMessage =
              "Tu email no ha sido confirmado. Revisa tu bandeja de entrada.";
            break;
          case "Too many requests":
            errorMessage =
              "Demasiados intentos. Intenta de nuevo en unos minutos.";
            break;
          case "User not found":
            errorMessage =
              "Este email no está registrado. ¿Necesitas crear una cuenta?";
            break;
          default:
            // Para el mensaje genérico de credenciales inválidas
            if (
              error.message.includes("credentials") ||
              error.message.includes("invalid")
            ) {
              errorMessage =
                "Credenciales incorrectas. Verifica que el email esté registrado y la contraseña sea correcta.";
            } else {
              errorMessage = error.message;
            }
        }

        setError(errorMessage);
        return;
      }


      // 1. Buscar primero en profiles (pacientes)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      console.log("📋 Resultado profiles:", { profileData, profileError });

      // Si lo encuentra en profiles
      if (profileData && !profileError) {
        const userType = profileData.tipo_usuario;
        console.log("✅ Usuario encontrado en profiles, tipo:", userType);

        if (userType === "Administrador") {
          router.push("../administrador");
          return;
        } else {
          router.push("../paciente/dashboard");
          return;
        }
      }

      console.log("🔍 Buscando en profiles_administrativos para:", email);

      // 2. Si no lo encuentra en profiles, buscar en profiles_administrativos
      const { data: adminData, error: adminError } = await supabase
        .from("profiles_administrativos")
        .select("*")
        .eq("email", email)
        .single();

      console.log(" Resultado profiles_administrativos:", {
        adminData,
        adminError,
      });

      // Si lo encuentra en profiles_administrativos
      if (adminData && !adminError) {
        console.log(" Usuario admin encontrado");
        router.push("../administrativo/dashboard");
        return;
      }

      console.log(" No encontrado en ninguna tabla");
      // Si no lo encuentra en ninguna tabla
      setError("Usuario no encontrado en el sistema");
    } catch (error: unknown) {
      console.error(" Error en handleLogin:", error);
      setError(
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Ingresa tu email para iniciar sesion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              No tenes una cuenta?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
